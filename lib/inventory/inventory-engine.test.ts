import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const inventory = readFileSync(
  new URL("../../supabase/migrations/20260810055913_inventory_engine.sql", import.meta.url),
  "utf8"
);
const paymentCompletion = readFileSync(
  new URL("../../supabase/migrations/20260811100000_payos_paid_order_status_transition.sql", import.meta.url),
  "utf8"
);
const admin = readFileSync(
  new URL("../../supabase/migrations/20260810055926_admin_security_and_operations.sql", import.meta.url),
  "utf8"
);
const orderCreation = readFileSync(
  new URL("../../supabase/migrations/20260810045534_fixed_shipping_fee.sql", import.meta.url),
  "utf8"
);
const yarnSchema = readFileSync(
  new URL("../../supabase/06_yarn_ecommerce.sql", import.meta.url),
  "utf8"
);

test("inventory schema preserves nullable, nonnegative stock semantics", () => {
  assert.match(yarnSchema, /stock integer/);
  assert.match(yarnSchema, /stock is null or stock >= 0/);
  assert.match(inventory, /if v_stock is null then[\s\S]*v_attention := true/);
  assert.doesNotMatch(inventory, /coalesce\(v_stock,\s*0\)/i);
  assert.match(inventory, /p\.category = 'yarn'/);
  assert.match(admin, /p\.category = 'yarn'/);
});

test("order availability subtracts active non-expired reservations", () => {
  assert.match(orderCreation, /reservation_status = 'active'/);
  assert.match(orderCreation, /expires_at > v_created_at/);
  assert.match(orderCreation, /v_available := v_variant\.stock - v_reserved/);
});

test("COD order creation never consumes physical stock", () => {
  const codBranch = orderCreation.slice(orderCreation.indexOf("if v_input.payment_method = 'bank_transfer'"));
  assert.doesNotMatch(codBranch, /update public\.product_variants[\s\S]*set stock/);
});

test("first successful PayOS completion decrements managed stock and completes reservations", () => {
  assert.match(paymentCompletion, /v_payment\.status = 'paid'[\s\S]*alreadyPaid'[\s\S]*true/);
  assert.match(paymentCompletion, /'payment_sale'[\s\S]*-v_item\.quantity/);
  assert.match(paymentCompletion, /update public\.product_variants[\s\S]*set stock = v_stock_after/);
  assert.match(paymentCompletion, /reservation_status = 'completed'/);
  assert.match(paymentCompletion, /payment:%s:variant:%s/);
  assert.match(inventory, /reference_key text not null unique/);
});

test("PayOS retry repairs only pending bank-transfer order status before inventory mutation", () => {
  const retryStart = paymentCompletion.indexOf("if v_payment.status = 'paid'");
  const retryEnd = paymentCompletion.indexOf("perform pv.id", retryStart);
  const retryBranch = paymentCompletion.slice(retryStart, retryEnd);
  assert.match(retryBranch, /alreadyPaid', true/);
  assert.doesNotMatch(retryBranch, /product_variants|inventory_movements|stock_reservations/);
  assert.match(retryBranch, /v_order\.payment_method = 'bank_transfer'[\s\S]*v_order\.order_status = 'pending_payment'/);
  assert.match(retryBranch, /payment_status = 'paid',[\s\S]*order_status = case[\s\S]*else order_status/);
});

test("first PayOS payment moves only pending bank-transfer orders to confirmation", () => {
  assert.match(paymentCompletion, /o\.order_status,[\s\S]*o\.payment_method,[\s\S]*o\.payment_status/);
  const firstPaymentUpdate = paymentCompletion.slice(paymentCompletion.lastIndexOf("update public.orders"));
  assert.match(firstPaymentUpdate, /payment_status = 'paid',[\s\S]*when payment_method = 'bank_transfer'[\s\S]*order_status = 'pending_payment'[\s\S]*then 'pending_confirmation'[\s\S]*else order_status/);
});

test("expired reservation payment still reconciles when stock is sufficient", () => {
  const loop = paymentCompletion.slice(paymentCompletion.indexOf("for v_item in"), paymentCompletion.indexOf("update public.payments"));
  assert.doesNotMatch(loop, /expires_at\s*>/);
  assert.match(loop, /elsif v_stock >= v_item\.quantity/);
  assert.match(loop, /set stock = v_stock_after/);
});

test("insufficient or unmanaged stock leaves payment paid and flags attention", () => {
  assert.match(paymentCompletion, /if v_stock is null then[\s\S]*v_attention := true/);
  assert.match(paymentCompletion, /else[\s\S]*v_attention := true[\s\S]*reservation_status = 'cancelled'/);
  assert.match(paymentCompletion, /update public\.payments[\s\S]*status = 'paid'/);
  assert.match(paymentCompletion, /update public\.orders[\s\S]*payment_status = 'paid'[\s\S]*inventory_attention_required/);
  assert.match(inventory, /stock_after is null or stock_after >= 0/);
});

test("COD confirmation consumes managed available stock once", () => {
  assert.match(admin, /if v_order\.payment_method = 'cod'/);
  assert.match(admin, /reservation_status = 'active'[\s\S]*expires_at > pg_catalog\.clock_timestamp/);
  assert.match(admin, /v_stock - v_reserved < v_item\.quantity/);
  assert.match(admin, /'cod_confirm'[\s\S]*-v_item\.quantity/);
  assert.match(admin, /cod_confirm:%s:variant:%s/);
  assert.match(admin, /if v_order\.order_status = 'confirmed'[\s\S]*alreadyConfirmed', true/);
});

test("admin cancellation restores consumed managed stock once without faking unmanaged stock", () => {
  assert.match(admin, /movement_type in \('payment_sale', 'cod_confirm'\)/);
  assert.match(admin, /if v_stock is null then[\s\S]*v_attention := true[\s\S]*else[\s\S]*v_stock_after := v_stock \+ v_item\.quantity/);
  assert.match(admin, /'order_cancel_restore'/);
  assert.match(admin, /admin_cancel_restore:%s:variant:%s/);
  assert.match(admin, /on conflict \(reference_key\) do nothing/);
});

test("admin adjustment is atomic, traceable, nullable, and nonnegative", () => {
  assert.match(admin, /admin_adjust_variant_stock/);
  assert.match(admin, /p_new_stock is not null and p_new_stock < 0/);
  assert.match(admin, /for update of pv/);
  assert.match(admin, /set stock = p_new_stock/);
  assert.match(admin, /'admin_adjustment:' \|\| p_request_id::text/);
  assert.match(admin, /when v_variant\.stock is null and p_new_stock is not null then 'admin_restock'/);
});
