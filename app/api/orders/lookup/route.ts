import { NextResponse } from "next/server";
import { ORDER_LOOKUP_NOT_FOUND_MESSAGE } from "@/lib/orders/order-lookup-display";
import { orderLookupRequestSchema } from "@/lib/orders/order-lookup";
import {
  lookupGuestOrder,
  OrderServiceError
} from "@/lib/orders/order-service";

export const runtime = "nodejs";

const noStoreHeaders = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
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

  try {
    const order = await lookupGuestOrder(parsed.data);
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
}
