import { after, NextResponse } from "next/server";
import { sendTelegramOrderCancelledNotification } from "@/lib/notifications/telegram";
import {
  cancelOrderRequestSchema,
  orderCodeSchema
} from "@/lib/orders/order-schema";
import {
  cancelGuestOrder,
  OrderServiceError
} from "@/lib/orders/order-service";
import {
  checkOrderCancellationCompositeRateLimit,
  checkOrderCancellationIpRateLimit,
  type OrderRateLimitDecision
} from "@/lib/security/order-creation-rate-limit";

export const runtime = "nodejs";

const noStoreHeaders = { "Cache-Control": "no-store" };

type OrderCancellationPostHandlerDependencies = {
  checkIpRateLimit: (request: Request) => Promise<OrderRateLimitDecision>;
  checkCompositeRateLimit: (request: Request, normalizedOrderCode: string) => Promise<OrderRateLimitDecision>;
  cancelGuestOrder: typeof cancelGuestOrder;
  sendTelegramOrderCancelledNotification: typeof sendTelegramOrderCancelledNotification;
  scheduleAfter: (callback: () => Promise<void>) => void;
};

function rateLimitedResponse(decision: OrderRateLimitDecision) {
  return NextResponse.json(
    { code: "RATE_LIMITED", message: "Bạn thao tác quá nhanh. Vui lòng thử lại sau." },
    {
      status: 429,
      headers: {
        ...noStoreHeaders,
        "Retry-After": String(Math.max(1, Math.ceil(decision.retryAfterSeconds)))
      }
    }
  );
}

async function failOpenRateLimit(check: () => Promise<OrderRateLimitDecision>) {
  try {
    return await check();
  } catch (error) {
    console.error("Order cancellation rate limiter unavailable", {
      name: error instanceof Error ? error.name : "UnknownError"
    });
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

export function createOrderCancellationPostHandler(dependencies: OrderCancellationPostHandlerDependencies) {
  return async function postOrderCancellation(
    request: Request,
    { params }: { params: Promise<{ orderCode: string }> }
  ) {
    const ipDecision = await failOpenRateLimit(() => dependencies.checkIpRateLimit(request));
    if (!ipDecision.allowed) return rateLimitedResponse(ipDecision);

    const routeParams = await params;
    const parsedOrderCode = orderCodeSchema.safeParse(routeParams.orderCode);
    if (!parsedOrderCode.success) {
      return NextResponse.json(
        { code: "INVALID_REQUEST", message: "Mã đơn hàng không hợp lệ." },
        { status: 400, headers: noStoreHeaders }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { code: "INVALID_REQUEST", message: "Dữ liệu gửi lên không hợp lệ." },
        { status: 400, headers: noStoreHeaders }
      );
    }

    const parsedBody = cancelOrderRequestSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: parsedBody.error.issues[0]?.message || "Số điện thoại không hợp lệ."
        },
        { status: 400, headers: noStoreHeaders }
      );
    }

    const compositeDecision = await failOpenRateLimit(
      () => dependencies.checkCompositeRateLimit(request, parsedOrderCode.data)
    );
    if (!compositeDecision.allowed) return rateLimitedResponse(compositeDecision);

    try {
      const result = await dependencies.cancelGuestOrder(parsedOrderCode.data, parsedBody.data);

      if (!result.alreadyCancelled) {
        dependencies.scheduleAfter(async () => {
          try {
            await dependencies.sendTelegramOrderCancelledNotification({
              orderCode: parsedOrderCode.data
            });
          } catch (error) {
            console.error("Telegram cancel notification failed", {
              name: error instanceof Error ? error.name : "UnknownError"
            });
          }
        });
      }

      return NextResponse.json(result, {
        status: 200,
        headers: noStoreHeaders
      });
    } catch (error) {
      if (error instanceof OrderServiceError) {
        return NextResponse.json(
          { code: error.code, message: error.message },
          { status: error.status, headers: noStoreHeaders }
        );
      }

      console.error("Unexpected order cancellation failure", error);
      return NextResponse.json(
        { code: "ORDER_CANCELLATION_FAILED", message: "Tiny chưa thể hủy đơn lúc này. Vui lòng thử lại sau." },
        { status: 500, headers: noStoreHeaders }
      );
    }
  };
}

export const POST = createOrderCancellationPostHandler({
  checkIpRateLimit: checkOrderCancellationIpRateLimit,
  checkCompositeRateLimit: checkOrderCancellationCompositeRateLimit,
  cancelGuestOrder,
  sendTelegramOrderCancelledNotification,
  scheduleAfter: after
});
