import { after, NextResponse } from "next/server";
import { sendTelegramNewOrderNotification } from "@/lib/notifications/telegram";
import { createOrder, OrderServiceError, getOrderItemsSnapshot } from "@/lib/orders/order-service";
import { orderRequestSchema } from "@/lib/orders/order-schema";

export const runtime = "nodejs";

export async function POST(request: Request) {
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

  try {
    const result = await createOrder(parsed.data);
    
    after(async () => {
      try {
        const items = await getOrderItemsSnapshot(result.orderCode);
        await sendTelegramNewOrderNotification({
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
}

