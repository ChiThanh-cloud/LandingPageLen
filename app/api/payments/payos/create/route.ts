import { NextResponse } from "next/server";
import { PaymentFlowError } from "@/lib/payments/payment-core";
import { createPayOSPaymentRequestSchema } from "@/lib/payments/payment-schema";
import { createCustomerPayOSPayment } from "@/lib/payments/payment-service";
import {
  checkPaymentCreationCompositeRateLimit,
  checkPaymentCreationIpRateLimit,
  type OrderRateLimitDecision
} from "@/lib/security/order-creation-rate-limit";

export const runtime = "nodejs";

const noStoreHeaders = { "Cache-Control": "no-store" };

type PayOSPaymentPostHandlerDependencies = {
  checkIpRateLimit: (request: Request) => Promise<OrderRateLimitDecision>;
  checkCompositeRateLimit: (
    request: Request,
    normalizedOrderCode: string,
    normalizedPhone: string
  ) => Promise<OrderRateLimitDecision>;
  createCustomerPayOSPayment: typeof createCustomerPayOSPayment;
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
    console.error("Payment creation rate limiter unavailable", {
      name: error instanceof Error ? error.name : "UnknownError"
    });
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

export function createPayOSPaymentPostHandler(dependencies: PayOSPaymentPostHandlerDependencies) {
  return async function postPayOSPayment(request: Request) {
    const ipDecision = await failOpenRateLimit(() => dependencies.checkIpRateLimit(request));
    if (!ipDecision.allowed) return rateLimitedResponse(ipDecision);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { code: "INVALID_REQUEST", message: "Dữ liệu gửi lên không hợp lệ." },
        { status: 400, headers: noStoreHeaders }
      );
    }

    const parsed = createPayOSPaymentRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: parsed.error.issues[0]?.message || "Thông tin thanh toán không hợp lệ."
        },
        { status: 400, headers: noStoreHeaders }
      );
    }

    const compositeDecision = await failOpenRateLimit(
      () => dependencies.checkCompositeRateLimit(
        request,
        parsed.data.orderCode,
        parsed.data.phone
      )
    );
    if (!compositeDecision.allowed) return rateLimitedResponse(compositeDecision);

    try {
      const payment = await dependencies.createCustomerPayOSPayment(
        parsed.data.orderCode,
        parsed.data.phone
      );
      return NextResponse.json(payment, {
        status: 200,
        headers: noStoreHeaders
      });
    } catch (error) {
      if (error instanceof PaymentFlowError) {
        return NextResponse.json(
          { code: error.code, message: error.message },
          { status: error.status, headers: noStoreHeaders }
        );
      }

      console.error("Unexpected payment creation failure", {
        name: error instanceof Error ? error.name : "UnknownError"
      });
      return NextResponse.json(
        { code: "PAYMENT_CREATION_FAILED", message: "Chưa thể tạo mã thanh toán. Vui lòng thử lại." },
        { status: 500, headers: noStoreHeaders }
      );
    }
  };
}

export const POST = createPayOSPaymentPostHandler({
  checkIpRateLimit: checkPaymentCreationIpRateLimit,
  checkCompositeRateLimit: checkPaymentCreationCompositeRateLimit,
  createCustomerPayOSPayment
});
