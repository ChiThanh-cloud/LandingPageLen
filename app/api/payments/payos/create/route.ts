import { NextResponse } from "next/server";
import { PaymentFlowError } from "@/lib/payments/payment-core";
import { createPayOSPaymentRequestSchema } from "@/lib/payments/payment-schema";
import { createCustomerPayOSPayment } from "@/lib/payments/payment-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { code: "INVALID_REQUEST", message: "Dữ liệu gửi lên không hợp lệ." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const parsed = createPayOSPaymentRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        code: "INVALID_REQUEST",
        message: parsed.error.issues[0]?.message || "Thông tin thanh toán không hợp lệ."
      },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const payment = await createCustomerPayOSPayment(
      parsed.data.orderCode,
      parsed.data.phone
    );
    return NextResponse.json(payment, {
      status: 200,
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    if (error instanceof PaymentFlowError) {
      return NextResponse.json(
        { code: error.code, message: error.message },
        { status: error.status, headers: { "Cache-Control": "no-store" } }
      );
    }

    console.error("Unexpected payment creation failure", {
      name: error instanceof Error ? error.name : "UnknownError"
    });
    return NextResponse.json(
      { code: "PAYMENT_CREATION_FAILED", message: "Chưa thể tạo mã thanh toán. Vui lòng thử lại." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

