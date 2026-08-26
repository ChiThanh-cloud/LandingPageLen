import assert from "node:assert/strict";
import test from "node:test";
import { orderReceivedEmailPreview } from "@/emails/OrderReceivedEmail.preview";
import { createOrderEmailService } from "@/lib/email/order-email-service";

test("empty persisted customer email never calls Resend", async () => {
  let calls = 0;
  const service = createOrderEmailService({
    getConfig: () => ({ apiKey: "test-key", from: "Tiny <orders@example.test>", replyTo: undefined }),
    createClient: () => ({
      emails: {
        async send() {
          calls += 1;
          return { data: { id: "email_1" }, error: null };
        }
      }
    })
  });

  const result = await service.sendOrderReceivedEmail({ ...orderReceivedEmailPreview, customerEmail: "   " });
  assert.deepEqual(result, { delivered: false, reason: "missing_recipient" });
  assert.equal(calls, 0);
});

test("order-received email uses the persisted recipient, order code, and deterministic idempotency key", async () => {
  let captured: { to: string; subject: string; idempotencyKey: string } | null = null;
  const service = createOrderEmailService({
    getConfig: () => ({ apiKey: "test-key", from: "Tiny <orders@example.test>", replyTo: "support@example.test" }),
    createClient: () => ({
      emails: {
        async send(message, options) {
          captured = { to: message.to, subject: message.subject, idempotencyKey: options.idempotencyKey };
          return { data: { id: "email_1" }, error: null };
        }
      }
    })
  });

  const result = await service.sendOrderReceivedEmail(orderReceivedEmailPreview);
  assert.deepEqual(result, { delivered: true, reason: null });
  assert.deepEqual(captured, {
    to: "preview@example.test",
    subject: "Tiny đã nhận đơn TINY-A1B2C3D4E5F6 🧶",
    idempotencyKey: "order-received/TINY-A1B2C3D4E5F6"
  });
});

test("Resend failures remain observable to the after() boundary", async () => {
  const service = createOrderEmailService({
    getConfig: () => ({ apiKey: "test-key", from: "Tiny <orders@example.test>", replyTo: undefined }),
    createClient: () => ({
      emails: {
        async send() {
          return { data: null, error: { name: "application_error" } };
        }
      }
    })
  });

  await assert.rejects(service.sendOrderReceivedEmail(orderReceivedEmailPreview), {
    message: "Resend order-received email failed"
  });
});
