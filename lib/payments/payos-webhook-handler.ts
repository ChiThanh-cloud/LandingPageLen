import { PaymentFlowError, type PayOSWebhookResult } from "@/lib/payments/payment-core";

type PayOSWebhookHandlerDependencies = {
  handleWebhook: (webhook: unknown) => Promise<PayOSWebhookResult>;
  getNotificationContext: (providerOrderCode: number) => Promise<{
    orderCode: string;
    amount: number;
  } | null>;
  sendPaidNotification: (input: { orderCode: string; amount: number }) => Promise<void>;
  scheduleAfter: (callback: () => Promise<void>) => void;
};

function json(body: unknown, status: number) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" }
  });
}

export function createPayOSWebhookHandler(dependencies: PayOSWebhookHandlerDependencies) {
  return async function handlePayOSWebhookRequest(request: Request) {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json({ success: false }, 400);
    }

    try {
      // Keep this exact parsed JSON value intact for SDK signature verification.
      const result = await dependencies.handleWebhook(body);

      if (result.kind === "payment" && !result.alreadyPaid) {
        dependencies.scheduleAfter(async () => {
          try {
            const context = await dependencies.getNotificationContext(result.providerOrderCode);
            if (context) {
              await dependencies.sendPaidNotification({
                orderCode: context.orderCode,
                amount: context.amount
              });
            }
          } catch (error) {
            console.error("Telegram payment notification failed", {
              name: error instanceof Error ? error.name : "UnknownError"
            });
          }
        });
      }

      return result.kind === "payment"
        ? json({ success: true, alreadyProcessed: result.alreadyPaid }, 200)
        : json({ success: true, ignored: "signed_non_tiny" }, 200);
    } catch (error) {
      if (error instanceof PaymentFlowError) {
        console.warn("Rejected payment webhook", { code: error.code });
        return json({ success: false }, error.status);
      }

      console.error("Unexpected payment webhook failure", {
        name: error instanceof Error ? error.name : "UnknownError"
      });
      return json({ success: false }, 503);
    }
  };
}
