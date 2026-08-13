import { NextResponse } from "next/server";
import { ORDER_LOOKUP_NOT_FOUND_MESSAGE } from "@/lib/orders/order-lookup-display";
import { orderLookupRequestSchema } from "@/lib/orders/order-lookup";
import {
  lookupGuestOrder,
  OrderServiceError
} from "@/lib/orders/order-service";
import {
  checkOrderLookupCompositeRateLimit,
  checkOrderLookupIpRateLimit,
  type OrderRateLimitDecision
} from "@/lib/security/order-creation-rate-limit";

export const runtime = "nodejs";

const noStoreHeaders = { "Cache-Control": "no-store" };

type OrderLookupPostHandlerDependencies = {
  checkIpRateLimit: (request: Request) => Promise<OrderRateLimitDecision>;
  checkCompositeRateLimit: (request: Request, normalizedOrderCode: string) => Promise<OrderRateLimitDecision>;
  lookupGuestOrder: typeof lookupGuestOrder;
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
    console.error("Order lookup rate limiter unavailable", {
      name: error instanceof Error ? error.name : "UnknownError"
    });
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

export function createOrderLookupPostHandler(dependencies: OrderLookupPostHandlerDependencies) {
  return async function postOrderLookup(request: Request) {
    const ipDecision = await failOpenRateLimit(() => dependencies.checkIpRateLimit(request));
    if (!ipDecision.allowed) return rateLimitedResponse(ipDecision);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { code: "INVALID_REQUEST", message: ORDER_LOOKUP_NOT_FOUND_MESSAGE },
        { status: 400, headers: noStoreHeaders }
      );
    }

    const parsed = orderLookupRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { code: "INVALID_REQUEST", message: ORDER_LOOKUP_NOT_FOUND_MESSAGE },
        { status: 400, headers: noStoreHeaders }
      );
    }

    const compositeDecision = await failOpenRateLimit(
      () => dependencies.checkCompositeRateLimit(request, parsed.data.orderCode)
    );
    if (!compositeDecision.allowed) return rateLimitedResponse(compositeDecision);

    try {
      const order = await dependencies.lookupGuestOrder(parsed.data);
      if (!order) {
        return NextResponse.json(
          { code: "ORDER_NOT_FOUND", message: ORDER_LOOKUP_NOT_FOUND_MESSAGE },
          { status: 404, headers: noStoreHeaders }
        );
      }

      return NextResponse.json(order, {
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

      console.error("Unexpected customer order lookup failure", {
        name: error instanceof Error ? error.name : "UnknownError"
      });
      return NextResponse.json(
        {
          code: "ORDER_LOOKUP_FAILED",
          message: "Tiny chưa thể tra cứu đơn hàng lúc này. Vui lòng thử lại sau."
        },
        { status: 500, headers: noStoreHeaders }
      );
    }
  };
}

export const POST = createOrderLookupPostHandler({
  checkIpRateLimit: checkOrderLookupIpRateLimit,
  checkCompositeRateLimit: checkOrderLookupCompositeRateLimit,
  lookupGuestOrder
});
