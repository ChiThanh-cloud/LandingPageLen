import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  calculateCheckoutDisplayTotals,
  FIXED_SHIPPING_FEE_VND,
  FREESHIP_SAME_PRODUCT_QUANTITY,
  getOrderStatusLabel,
  getPaymentMethodLabel,
  getPaymentStatusLabel
} from "./order-display";

const migration = readFileSync(
  new URL("../../supabase/migrations/20260813090000_freeship_same_product_quantity.sql", import.meta.url),
  "utf8"
);
const checkoutPage = readFileSync(
  new URL("../../components/checkout/CheckoutPage.tsx", import.meta.url),
  "utf8"
);

const items = (...lines: Array<[productId: string, quantity: number]>) => lines.map(
  ([productId, quantity], index) => ({ productId, variantId: String(index), quantity })
);

test("same-product freeship display pricing", async (t) => {
  await t.test("adds 30,000 VND to a 43,200 VND subtotal", () => {
    assert.equal(FIXED_SHIPPING_FEE_VND, 30_000);
    assert.equal(FREESHIP_SAME_PRODUCT_QUANTITY, 20);
    assert.deepEqual(calculateCheckoutDisplayTotals(43_200, items(["milk-bo", 19])), {
      subtotal: 43_200,
      shippingFee: 30_000,
      total: 73_200
    });
  });

  await t.test("mixes variants of one product toward freeship", () => {
    assert.deepEqual(calculateCheckoutDisplayTotals(144_000, items(
      ["milk-bo", 8], ["milk-bo", 6], ["milk-bo", 6]
    )), {
      subtotal: 144_000,
      shippingFee: 0,
      total: 144_000
    });
  });

  await t.test("does not combine quantities from different products", () => {
    assert.deepEqual(calculateCheckoutDisplayTotals(144_000, items(
      ["milk-bo", 10], ["mac-den", 10]
    )), {
      subtotal: 144_000,
      shippingFee: 30_000,
      total: 174_000
    });
  });

  await t.test("applies freeship to the whole order when one product qualifies", () => {
    assert.deepEqual(calculateCheckoutDisplayTotals(165_600, items(
      ["milk-bo", 20], ["mac-den", 3]
    )), {
      subtotal: 165_600,
      shippingFee: 0,
      total: 165_600
    });
  });

  await t.test("uses the same preview rule for COD and bank transfer", () => {
    for (const paymentMethod of ["cod", "bank_transfer"]) {
      assert.equal(paymentMethod.length > 0, true);
      assert.equal(calculateCheckoutDisplayTotals(144_000, items(["milk-bo", 8], ["milk-bo", 6], ["milk-bo", 6])).shippingFee, 0);
      assert.equal(calculateCheckoutDisplayTotals(144_000, items(["milk-bo", 10], ["mac-den", 10])).shippingFee, 30_000);
    }
  });
});

test("same-product freeship migration preserves production order flow", () => {
  assert.match(migration, /Existing orders are intentionally not backfilled/);
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.create_guest_order\(p_payload jsonb\)/);
  assert.match(migration, /pg_catalog\.substr\([\s\S]*pg_catalog\.gen_random_uuid/);
  assert.match(migration, /pg_catalog\.btrim\(v_product\.price\)[\s\S]*::numeric/);
  assert.match(migration, /from public\.product_variants[\s\S]*for update;/i);
  assert.match(migration, /if v_variant\.stock is null then[\s\S]*v_stock_confirmation_required := true;/i);
  assert.match(migration, /v_payment_method = 'bank_transfer' and v_variant\.stock is not null/i);
  assert.match(migration, /from public\.order_items oi[\s\S]*where oi\.order_id = v_order_id[\s\S]*group by oi\.product_id[\s\S]*having pg_catalog\.sum\(oi\.quantity\) >= 20/i);
  assert.match(migration, /shipping_fee = v_shipping_fee,[\s\S]*total = v_subtotal \+ v_shipping_fee/i);
  assert.match(migration, /where id = v_order_id;/i);
  assert.doesNotMatch(migration, /update public\.orders[\s\S]*where shipping_fee is null/i);
  assert.doesNotMatch(migration, /where\s+shipping_fee\s+is\s+null/i);
  assert.match(migration, /SECURITY DEFINER[\s\S]*SET search_path TO ''/);
  assert.match(migration, /revoke all on function public\.create_guest_order\(jsonb\) from public, anon, authenticated;/i);
  assert.match(migration, /grant execute on function public\.create_guest_order\(jsonb\) to service_role;/i);
});

test("checkout preview passes cart items to the same-product shipping rule", () => {
  assert.match(checkoutPage, /calculateCheckoutDisplayTotals\(displaySubtotal, items\)/);
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
