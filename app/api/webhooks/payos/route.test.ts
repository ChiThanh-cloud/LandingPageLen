import assert from "node:assert/strict";
import test from "node:test";
import { PaymentFlowError } from "@/lib/payments/payment-core";
import { createPayOSWebhookHandler } from "@/lib/payments/payos-webhook-handler";

function createHandler(options?: {
  result?: { kind: "payment"; alreadyPaid: boolean; providerOrderCode: number }
    | { kind: "ignored_signed_non_tiny" };
  error?: PaymentFlowError;
}) {
  const calls = {
    webhooks: [] as unknown[],
    notificationContexts: [] as number[],
    notifications: 0,
    scheduled: [] as Array<() => void | Promise<void>>
  };

  const handler = createPayOSWebhookHandler({
    async handleWebhook(webhook) {
      calls.webhooks.push(webhook);
      if (options?.error) throw options.error;
      return options?.result || {
        kind: "payment" as const,
        alreadyPaid: false,
        providerOrderCode: 1_000_000_001
      };
    },
    async getNotificationContext(providerOrderCode) {
      calls.notificationContexts.push(providerOrderCode);
      return { orderCode: "TINY-ABCDEF123456", amount: 58_800 };
    },
    async sendPaidNotification() {
      calls.notifications += 1;
    },
    scheduleAfter(callback) {
      calls.scheduled.push(callback);
    }
  });

  return { handler, calls };
}

test("malformed JSON returns 400 before verification or any payment action", async () => {
  const { handler, calls } = createHandler();
  const response = await handler(new Request("https://lentiny.xyz/api/webhooks/payos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{"
  }));

  assert.equal(response.status, 400);
  assert.equal(calls.webhooks.length, 0);
  assert.equal(calls.scheduled.length, 0);
});

test("the route passes a complete webhook object through without pre-verification filtering", async () => {
  const payload = {
    code: "00",
    data: {
      orderCode: 1_000_000_001,
      extraSignedField: "must-reach-sdk"
    },
    signature: "opaque-signature"
  };
  const { handler, calls } = createHandler({
    result: { kind: "ignored_signed_non_tiny" }
  });
  const response = await handler(new Request("https://lentiny.xyz/api/webhooks/payos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }));

  assert.equal(response.status, 200);
  assert.deepEqual(calls.webhooks[0], payload);
  assert.equal(calls.scheduled.length, 0);
});

test("invalid signatures return 400 without scheduling a notification", async () => {
  const { handler, calls } = createHandler({
    error: new PaymentFlowError("PAYMENT_VERIFICATION_FAILED", 400, "invalid")
  });
  const response = await handler(new Request("https://lentiny.xyz/api/webhooks/payos", {
    method: "POST",
    body: JSON.stringify({ data: {}, signature: "invalid" })
  }));

  assert.equal(response.status, 400);
  assert.equal(calls.scheduled.length, 0);
});

test("a new Tiny payment is acknowledged and schedules one paid notification", async () => {
  const { handler, calls } = createHandler();
  const response = await handler(new Request("https://lentiny.xyz/api/webhooks/payos", {
    method: "POST",
    body: JSON.stringify({ data: {}, signature: "verified" })
  }));

  assert.equal(response.status, 200);
  assert.equal(calls.scheduled.length, 1);
  await calls.scheduled[0]?.();
  assert.deepEqual(calls.notificationContexts, [1_000_000_001]);
  assert.equal(calls.notifications, 1);
});

test("already-paid and signed non-Tiny webhooks never schedule a duplicate notification", async () => {
  for (const result of [
    { kind: "payment" as const, alreadyPaid: true, providerOrderCode: 1_000_000_001 },
    { kind: "ignored_signed_non_tiny" as const }
  ]) {
    const { handler, calls } = createHandler({ result });
    const response = await handler(new Request("https://lentiny.xyz/api/webhooks/payos", {
      method: "POST",
      body: JSON.stringify({ data: {}, signature: "verified" })
    }));
    assert.equal(response.status, 200);
    assert.equal(calls.scheduled.length, 0);
  }
});

test("unknown Tiny provider codes and temporary service failures remain retryable", async () => {
  for (const code of ["PAYMENT_NOT_FOUND", "PAYMENT_SERVICE_UNAVAILABLE"] as const) {
    const { handler } = createHandler({
      error: new PaymentFlowError(code, 503, "retryable")
    });
    const response = await handler(new Request("https://lentiny.xyz/api/webhooks/payos", {
      method: "POST",
      body: JSON.stringify({ data: {}, signature: "verified" })
    }));
    assert.equal(response.status, 503);
  }
});

test("amount and payment link mismatches remain non-success responses", async () => {
  const { handler } = createHandler({
    error: new PaymentFlowError("PAYMENT_AMOUNT_MISMATCH", 409, "mismatch")
  });
  const response = await handler(new Request("https://lentiny.xyz/api/webhooks/payos", {
    method: "POST",
    body: JSON.stringify({ data: {}, signature: "verified" })
  }));
  assert.equal(response.status, 409);
});
