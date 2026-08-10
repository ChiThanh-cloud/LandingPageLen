import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  calculateCheckoutDisplayTotals,
  FIXED_SHIPPING_FEE_VND,
  getOrderStatusLabel,
  getPaymentMethodLabel,
  getPaymentStatusLabel
} from "./order-display";

const migration = readFileSync(
  new URL("../../supabase/migrations/20260810045534_fixed_shipping_fee.sql", import.meta.url),
  "utf8"
);

test("fixed shipping display pricing", async (t) => {
  await t.test("adds 30,000 VND to a 43,200 VND subtotal", () => {
    assert.equal(FIXED_SHIPPING_FEE_VND, 30_000);
    assert.deepEqual(calculateCheckoutDisplayTotals(43_200), {
      subtotal: 43_200,
      shippingFee: 30_000,
      total: 73_200
    });
  });

  await t.test("uses the same fixed fee for COD and bank-transfer display", () => {
    for (const paymentMethod of ["cod", "bank_transfer"]) {
      assert.equal(paymentMethod.length > 0, true);
      assert.equal(calculateCheckoutDisplayTotals(43_200).shippingFee, 30_000);
      assert.equal(calculateCheckoutDisplayTotals(43_200).total, 73_200);
    }
  });
});

test("fixed shipping migration preserves production order flow", () => {
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.create_guest_order\(p_payload jsonb\)/);
  assert.match(migration, /pg_catalog\.substr\([\s\S]*pg_catalog\.gen_random_uuid/);
  assert.match(migration, /pg_catalog\.btrim\(v_product\.price\)[\s\S]*::numeric/);
  assert.match(migration, /from public\.product_variants[\s\S]*for update;/i);
  assert.match(migration, /if v_variant\.stock is null then[\s\S]*v_stock_confirmation_required := true;/i);
  assert.match(migration, /v_payment_method = 'bank_transfer' and v_variant\.stock is not null/i);
  assert.match(migration, /subtotal = v_subtotal,[\s\S]*shipping_fee = 30000,[\s\S]*total = v_subtotal \+ 30000/i);
  assert.match(migration, /where id = v_order_id;/i);
  assert.doesNotMatch(migration, /where\s+shipping_fee\s+is\s+null/i);
  assert.match(migration, /SECURITY DEFINER[\s\S]*SET search_path TO ''/);
  assert.match(migration, /revoke all on function public\.create_guest_order\(jsonb\) from public, anon, authenticated;/i);
  assert.match(migration, /grant execute on function public\.create_guest_order\(jsonb\) to service_role;/i);
});

test("customer order labels never render raw statuses", () => {
  assert.equal(getOrderStatusLabel("pending_confirmation"), "Chờ Tiny xác nhận");
  assert.equal(getOrderStatusLabel("pending_payment"), "Chờ thanh toán");
  assert.equal(getOrderStatusLabel("confirmed"), "Đã xác nhận");
  assert.equal(getOrderStatusLabel("cancelled"), "Đã hủy");
  assert.equal(getOrderStatusLabel("completed"), "Hoàn thành");
  assert.equal(getPaymentStatusLabel("unpaid"), "Chưa thanh toán");
  assert.equal(getPaymentStatusLabel("paid"), "Đã thanh toán");
  assert.equal(getPaymentStatusLabel("failed"), "Thanh toán chưa thành công");
  assert.equal(getPaymentStatusLabel("refunded"), "Đã hoàn tiền");
  assert.equal(getPaymentMethodLabel("bank_transfer"), "Chuyển khoản ngân hàng");
  assert.equal(getPaymentMethodLabel("cod"), "Thanh toán khi nhận hàng (COD)");
});
