import { after, NextResponse } from "next/server";
import { sendOrderReceivedEmail } from "@/lib/email/order-email-service";
import { sendTelegramNewOrderNotification } from "@/lib/notifications/telegram";
import {
  createOrder,
  getOrderItemsSnapshot,
  getOrderReceivedEmailSnapshot,
  OrderServiceError
} from "@/lib/orders/order-service";
import { orderRequestSchema } from "@/lib/orders/order-schema";
import { canonicalizeOrderPhone } from "@/lib/orders/order-cancellation";
import {
  checkOrderCreationCompositeRateLimit,
  checkOrderCreationIpRateLimit,
  type OrderRateLimitDecision
} from "@/lib/security/order-creation-rate-limit";

export const runtime = "nodejs";

type OrderPostHandlerDependencies = {
  checkIpRateLimit: (request: Request) => Promise<OrderRateLimitDecision>;
  checkCompositeRateLimit: (request: Request, normalizedPhone: string) => Promise<OrderRateLimitDecision>;
  createOrder: typeof createOrder;
  getOrderItemsSnapshot: typeof getOrderItemsSnapshot;
  getOrderReceivedEmailSnapshot: typeof getOrderReceivedEmailSnapshot;
  sendNewOrderNotification: typeof sendTelegramNewOrderNotification;
  sendOrderReceivedEmail: typeof sendOrderReceivedEmail;
  scheduleAfter: (callback: () => Promise<void>) => void;
};

function rateLimitedResponse(decision: OrderRateLimitDecision) {
  return NextResponse.json(
    { code: "RATE_LIMITED", message: "Bạn thao tác quá nhanh. Vui lòng thử lại sau." },
    {
      status: 429,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": String(Math.max(1, Math.ceil(decision.retryAfterSeconds)))
      }
    }
  );
}

async function failOpenRateLimit(check: () => Promise<OrderRateLimitDecision>) {
  try {
    return await check();
  } catch (error) {
    console.error("Order rate limiter unavailable", {
      name: error instanceof Error ? error.name : "UnknownError"
    });
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

export function createOrderPostHandler(dependencies: OrderPostHandlerDependencies) {
  return async function postOrder(request: Request) {
    const ipDecision = await failOpenRateLimit(() => dependencies.checkIpRateLimit(request));
    if (!ipDecision.allowed) return rateLimitedResponse(ipDecision);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { code: "INVALID_REQUEST", message: "Dữ liệu gửi lên không hợp lệ." },
        { status: 400 }
      );
    }

    const parsed = orderRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: "Vui lòng kiểm tra lại thông tin đặt hàng.",
          fieldErrors: parsed.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const normalizedPhone = canonicalizeOrderPhone(parsed.data.customer.phone);
    const compositeDecision = await failOpenRateLimit(
      () => dependencies.checkCompositeRateLimit(request, normalizedPhone)
    );
    if (!compositeDecision.allowed) return rateLimitedResponse(compositeDecision);

    try {
      const result = await dependencies.createOrder(parsed.data);

      dependencies.scheduleAfter(async () => {
        await Promise.allSettled([
          (async () => {
            try {
              const items = await dependencies.getOrderItemsSnapshot(result.orderCode);
              await dependencies.sendNewOrderNotification({
                orderCode: result.orderCode,
                customerName: parsed.data.customer.name,
                paymentMethod: parsed.data.paymentMethod,
                itemLines: parsed.data.items.length,
                totalQuantity: parsed.data.items.reduce(
                  (sum, item) => sum + item.quantity,
                  0
                ),
                items
              });
            } catch (error) {
              console.error("Telegram new-order notification failed", {
                name: error instanceof Error ? error.name : "UnknownError"
              });
            }
          })(),
          (async () => {
            try {
              const snapshot = await dependencies.getOrderReceivedEmailSnapshot(result.orderCode);
              if (snapshot) await dependencies.sendOrderReceivedEmail(snapshot);
            } catch (error) {
              console.error("Order-received email failed", {
                name: error instanceof Error ? error.name : "UnknownError"
              });
            }
          })()
        ]);
      });

      return NextResponse.json(result, {
        status: 201,
        headers: { "Cache-Control": "no-store" }
      });
    } catch (error) {
      if (error instanceof OrderServiceError) {
        return NextResponse.json(
          { code: error.code, message: error.message, item: error.item },
          { status: error.status, headers: { "Cache-Control": "no-store" } }
        );
      }

      console.error("Unexpected order creation failure", error);
      return NextResponse.json(
        { code: "ORDER_CREATION_FAILED", message: "Tiny chưa thể tạo đơn lúc này. Vui lòng thử lại sau." },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }
  };
}

export const POST = createOrderPostHandler({
  checkIpRateLimit: checkOrderCreationIpRateLimit,
  checkCompositeRateLimit: checkOrderCreationCompositeRateLimit,
  createOrder,
  getOrderItemsSnapshot,
  getOrderReceivedEmailSnapshot,
  sendNewOrderNotification: sendTelegramNewOrderNotification,
  sendOrderReceivedEmail,
  scheduleAfter: after
});
