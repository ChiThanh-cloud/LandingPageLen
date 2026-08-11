import { after } from "next/server";
import { createPayOSWebhookHandler } from "@/lib/payments/payos-webhook-handler";
import { handlePayOSWebhook, getPayOSNotificationContext } from "@/lib/payments/payment-service";
import { sendTelegramPaymentPaidNotification } from "@/lib/notifications/telegram";

export const runtime = "nodejs";

const handleRequest = createPayOSWebhookHandler({
  handleWebhook: handlePayOSWebhook,
  getNotificationContext: getPayOSNotificationContext,
  sendPaidNotification: sendTelegramPaymentPaidNotification,
  scheduleAfter: after
});

export async function POST(request: Request) {
  return handleRequest(request);
}
