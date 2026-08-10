import { NextResponse } from "next/server";
import { orderCodeSchema } from "@/lib/orders/order-schema";
import { verifyPaymentAccessToken } from "@/lib/payments/payment-access-token";
import { getCustomerPaymentStatus } from "@/lib/payments/payment-service";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderCode: string }> }
) {
  const routeParams = await params;
  const parsedOrderCode = orderCodeSchema.safeParse(routeParams.orderCode);
  const token = new URL(request.url).searchParams.get("token");
  const secret = process.env.PAYOS_CHECKSUM_KEY;

  if (
    !parsedOrderCode.success
    || !token
    || !secret
    || !verifyPaymentAccessToken(token, parsedOrderCode.data, secret)
  ) {
    return NextResponse.json(
      { message: "Không thể xác minh yêu cầu." },
      { status: 404, headers: { "Cache-Control": "no-store" } }
    );
  }

  const status = await getCustomerPaymentStatus(parsedOrderCode.data);
  if (!status) {
    return NextResponse.json(
      { message: "Không tìm thấy trạng thái thanh toán." },
      { status: 404, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    { status },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}

