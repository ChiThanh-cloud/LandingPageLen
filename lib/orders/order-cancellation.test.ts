import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  canonicalizeOrderPhone,
  canCustomerCancelOrder,
  getCustomerCancellationState
} from "./order-cancellation";
import {
  cancelOrderRequestSchema,
  cancelOrderResultSchema,
  orderCodeSchema
} from "./order-schema";

const cancellationMigration = readFileSync(
  new URL("../../supabase/migrations/20260810042829_guest_order_cancellation.sql", import.meta.url),
  "utf8"
);

test("guest order cancellation policy", async (t) => {
  await t.test("allows pending_confirmation unpaid", () => {
    assert.equal(canCustomerCancelOrder("pending_confirmation", "unpaid"), true);
    assert.equal(getCustomerCancellationState("pending_confirmation", "unpaid"), "cancellable");
  });

  await t.test("allows pending_payment unpaid", () => {
    assert.equal(canCustomerCancelOrder("pending_payment", "unpaid"), true);
    assert.equal(getCustomerCancellationState("pending_payment", "unpaid"), "cancellable");
  });

  await t.test("rejects paid, confirmed, shipping, and completed orders", () => {
    assert.equal(getCustomerCancellationState("pending_payment", "paid"), "paid_contact_required");
    assert.equal(getCustomerCancellationState("confirmed", "unpaid"), "not_cancellable");
    assert.equal(getCustomerCancellationState("shipping", "unpaid"), "not_cancellable");
    assert.equal(getCustomerCancellationState("completed", "unpaid"), "not_cancellable");
  });

  await t.test("treats an already cancelled order as idempotent only after verification in RPC", () => {
    assert.equal(getCustomerCancellationState("cancelled", "unpaid"), "already_cancelled");
    const verificationIndex = cancellationMigration.indexOf("v_input_phone <> v_stored_phone");
    const idempotencyIndex = cancellationMigration.indexOf("v_order.order_status = 'cancelled'");
    assert.ok(verificationIndex >= 0);
    assert.ok(idempotencyIndex > verificationIndex);
  });
});

test("order cancellation phone verification", async (t) => {
  await t.test("canonicalizes both stored and submitted formatting", () => {
    const storedPhone = canonicalizeOrderPhone(" 090 123.4567 ");
    assert.equal(storedPhone, "0901234567");
    assert.equal(storedPhone, canonicalizeOrderPhone("090-123-4567"));
    assert.equal(storedPhone, canonicalizeOrderPhone("0901234567"));
  });

  await t.test("does not translate +84 and 0 conventions", () => {
    assert.notEqual(
      canonicalizeOrderPhone("+84 90 123 4567"),
      canonicalizeOrderPhone("090 123 4567")
    );
  });

  await t.test("rejects a different phone after canonicalization", () => {
    const submittedPhone = canonicalizeOrderPhone("090-123-4567");
    const storedPhone = canonicalizeOrderPhone("091 123 4567");
    assert.notEqual(submittedPhone, storedPhone);
    assert.match(
      cancellationMigration,
      /v_input_phone <> v_stored_phone[\s\S]*ORDER_VERIFICATION_FAILED/i
    );
  });

  await t.test("validates and canonicalizes the cancellation payload", () => {
    const parsed = cancelOrderRequestSchema.parse({ phone: "090-123-4567" });
    assert.deepEqual(parsed, { phone: "0901234567" });
    assert.equal(cancelOrderRequestSchema.safeParse({ phone: "123" }).success, false);
    assert.equal(cancelOrderRequestSchema.safeParse({ phone: "0901234567", paid: true }).success, false);
  });

  await t.test("validates public order code and idempotent result shapes", () => {
    assert.equal(orderCodeSchema.parse("tiny-abcdef123456"), "TINY-ABCDEF123456");
    assert.equal(orderCodeSchema.safeParse("TINY-1").success, false);
    assert.equal(cancelOrderResultSchema.safeParse({
      status: "cancelled",
      alreadyCancelled: true,
      cancelledReservations: 0
    }).success, true);
  });
});

test("cancellation migration preserves order history and inventory", () => {
  const paidCheckIndex = cancellationMigration.indexOf("v_order.payment_status = 'paid'");
  const orderUpdateIndex = cancellationMigration.indexOf("update public.orders");

  assert.match(cancellationMigration, /from public\.orders[\s\S]*for update;/i);
  assert.ok(paidCheckIndex >= 0);
  assert.ok(orderUpdateIndex > paidCheckIndex);
  assert.match(cancellationMigration, /update public\.orders[\s\S]*order_status = 'cancelled'/i);
  assert.match(
    cancellationMigration,
    /update public\.stock_reservations[\s\S]*reservation_status = 'cancelled'[\s\S]*reservation_status = 'active'/i
  );
  assert.match(cancellationMigration, /payment_status = 'paid'/i);
  assert.match(cancellationMigration, /pending_confirmation'[\s\S]*pending_payment'/i);
  assert.doesNotMatch(cancellationMigration, /\bdelete\s+from\b/i);
  assert.doesNotMatch(cancellationMigration, /update\s+public\.product_variants/i);
  assert.match(cancellationMigration, /revoke all on function public\.cancel_guest_order\(text, text\)/i);
  assert.match(cancellationMigration, /grant execute on function public\.cancel_guest_order\(text, text\)[\s\S]*to service_role/i);
});
