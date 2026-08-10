import { NextResponse } from "next/server";
import {
  cancelOrderRequestSchema,
  orderCodeSchema
} from "@/lib/orders/order-schema";
import {
  cancelGuestOrder,
  OrderServiceError
} from "@/lib/orders/order-service";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderCode: string }> }
) {
  const routeParams = await params;
  const parsedOrderCode = orderCodeSchema.safeParse(routeParams.orderCode);
  if (!parsedOrderCode.success) {
    return NextResponse.json(
      { code: "INVALID_REQUEST", message: "Mã đơn hàng không hợp lệ." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { code: "INVALID_REQUEST", message: "Dữ liệu gửi lên không hợp lệ." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const parsedBody = cancelOrderRequestSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      {
        code: "INVALID_REQUEST",
        message: parsedBody.error.issues[0]?.message || "Số điện thoại không hợp lệ."
      },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const result = await cancelGuestOrder(parsedOrderCode.data, parsedBody.data);
    return NextResponse.json(result, {
      status: 200,
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    if (error instanceof OrderServiceError) {
      return NextResponse.json(
        { code: error.code, message: error.message },
        { status: error.status, headers: { "Cache-Control": "no-store" } }
      );
    }

    console.error("Unexpected order cancellation failure", error);
    return NextResponse.json(
      { code: "ORDER_CANCELLATION_FAILED", message: "Tiny chưa thể hủy đơn lúc này. Vui lòng thử lại sau." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
