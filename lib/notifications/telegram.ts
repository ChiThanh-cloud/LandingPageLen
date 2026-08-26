import "server-only";
import type { NotificationItemSnapshot } from "@/lib/orders/order-service";

export type NewOrderNotificationArgs = {
  orderCode: string;
  customerName: string;
  paymentMethod: "cod" | "bank_transfer";
  itemLines: number;
  totalQuantity: number;
  items: NotificationItemSnapshot[];
};

async function sendTelegramMessage(text: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true
      }),
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      throw new Error(`Telegram API responded with status ${response.status}`);
    }
  } catch {
    throw new Error("Telegram API request failed");
  }
}

export async function sendTelegramNewOrderNotification({
  orderCode,
  customerName,
  paymentMethod,
  itemLines,
  totalQuantity,
  items
}: NewOrderNotificationArgs) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  let text = `🛒 ĐƠN HÀNG MỚI\n\nMã đơn: ${orderCode}\nKhách: ${customerName}\nThanh toán: ${paymentMethod === "cod" ? "COD" : "Chuyển khoản"}\nSản phẩm: ${itemLines} dòng / ${totalQuantity} sản phẩm\n\n📦 SẢN PHẨM\n`;

  for (const item of items) {
    text += `• ${item.productName}\n  Phân loại: ${item.variantName}\n`;
    if (item.colorCode?.trim()) text += `  Mã: ${item.colorCode.trim()}\n`;
    text += `  SL: ${item.quantity}\n\n`;
  }

  if (appUrl) {
    text += `\nXem đơn:\n${appUrl}/admin/don-hang/${orderCode}`;
  }

  return sendTelegramMessage(text);
}

export async function sendTelegramPaymentPaidNotification({
  orderCode,
  amount
}: { orderCode: string; amount: number }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const formattedAmount = `${amount.toLocaleString("vi-VN")}đ`;
  let text = `💰 THANH TOÁN THÀNH CÔNG\n\nMã đơn: ${orderCode}\nSố tiền: ${formattedAmount}\nPhương thức: Chuyển khoản PayOS\n\n✅ Hệ thống đã xác nhận thanh toán.\n`;

  if (appUrl) {
    text += `\nXem đơn:\n${appUrl}/admin/don-hang/${orderCode}`;
  }

  return sendTelegramMessage(text);
}

export async function sendTelegramOrderCancelledNotification({
  orderCode
}: { orderCode: string }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  let text = `❌ ĐƠN HÀNG ĐÃ HỦY\n\nMã đơn: ${orderCode}\n\nKhách đã hủy đơn qua website.\n`;

  if (appUrl) {
    text += `\nXem đơn:\n${appUrl}/admin/don-hang/${orderCode}`;
  }

  return sendTelegramMessage(text);
}
