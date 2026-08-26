import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const inventory = readFileSync(
  new URL("../../supabase/migrations/20260810055913_inventory_engine.sql", import.meta.url),
  "utf8"
);
const accessoryInventory = readFileSync(
  new URL("../../supabase/migrations/20260825233404_accessory_inventory_backend.sql", import.meta.url),
  "utf8"
);
const previousPayosCompletion = readFileSync(
  new URL("../../supabase/migrations/20260811100000_payos_paid_order_status_transition.sql", import.meta.url),
  "utf8"
);
const admin = readFileSync(
  new URL("../../supabase/migrations/20260810055926_admin_security_and_operations.sql", import.meta.url),
  "utf8"
);
const orderCreation = readFileSync(
  new URL("../../supabase/migrations/20260826103646_accessory_launch_business_rules.sql", import.meta.url),
  "utf8"
);
const yarnSchema = readFileSync(
  new URL("../../supabase/06_yarn_ecommerce.sql", import.meta.url),
  "utf8"
);

function functionBlock(source: string, name: string, nextName: string) {
  const start = source.indexOf(`create or replace function public.${name}`);
  const end = source.indexOf(`create or replace function public.${nextName}`, start);

  assert.notEqual(start, -1, `${name} must be present in the forward migration`);
  assert.notEqual(end, -1, `${nextName} must follow ${name} in the forward migration`);

  return source.slice(start, end);
}

const latestPayosCompletion = functionBlock(
  accessoryInventory,
  "complete_guest_payos_payment",
  "admin_confirm_order"
);
const latestAdminConfirm = functionBlock(
  accessoryInventory,
  "admin_confirm_order",
  "admin_adjust_variant_stock"
);
const latestAdminAdjustment = accessoryInventory.slice(
  accessoryInventory.indexOf("create or replace function public.admin_adjust_variant_stock"),
  accessoryInventory.indexOf("revoke all on function public.complete_guest_payos_payment")
);

function functionDefinition(source: string, name: string) {
  const start = source.indexOf(`create or replace function public.${name}`);
  const end = source.indexOf("\n$$;", start);

  assert.notEqual(start, -1, `${name} must exist`);
  assert.notEqual(end, -1, `${name} must have a complete body`);

  return source.slice(start, end + 4);
}

test("accessory inventory functions differ from their authoritative predecessors only by managed category scope", () => {
  const expectedPayos = functionDefinition(previousPayosCompletion, "complete_guest_payos_payment")
    .replaceAll("p.category = 'yarn'", "p.category in ('yarn', 'accessory')");
  const expectedAdminConfirm = functionDefinition(admin, "admin_confirm_order")
    .replaceAll("p.category = 'yarn'", "p.category in ('yarn', 'accessory')");
  const expectedAdminAdjustment = functionDefinition(admin, "admin_adjust_variant_stock")
    .replaceAll("v_variant.category <> 'yarn'", "v_variant.category not in ('yarn', 'accessory')");

  assert.equal(functionDefinition(accessoryInventory, "complete_guest_payos_payment"), expectedPayos);
  assert.equal(functionDefinition(accessoryInventory, "admin_confirm_order"), expectedAdminConfirm);
  assert.equal(functionDefinition(accessoryInventory, "admin_adjust_variant_stock"), expectedAdminAdjustment);
});

test("inventory schema preserves nullable, nonnegative stock semantics", () => {
  assert.match(yarnSchema, /stock integer/);
  assert.match(yarnSchema, /stock is null or stock >= 0/);
  assert.match(latestPayosCompletion, /if v_stock is null then[\s\S]*v_attention := true/);
  assert.doesNotMatch(latestPayosCompletion, /coalesce\(v_stock,\s*0\)/i);
  assert.match(inventory, /stock_after is null or stock_after >= 0/);
});

test("order availability subtracts active non-expired reservations", () => {
  assert.match(orderCreation, /reservation_status = 'active'/);
  assert.match(orderCreation, /expires_at > v_created_at/);
  assert.match(orderCreation, /v_available := v_variant\.stock - v_reserved/);
});

test("guest order reservations remain bank-transfer-only and freeship leaves inventory untouched", () => {
  const reservationCondition = "if v_payment_method = 'bank_transfer' and v_variant.stock is not null then";
  const reservationStart = orderCreation.indexOf(reservationCondition);
  assert.notEqual(reservationStart, -1, "current production SQL must guard reservations by bank transfer");

  const reservationEnd = orderCreation.indexOf("    end if;", reservationStart);
  assert.notEqual(reservationEnd, -1, "bank-transfer reservation branch must be complete");
  const reservationBranch = orderCreation.slice(reservationStart, reservationEnd);
  assert.match(reservationBranch, /insert into public\.stock_reservations/);
  assert.match(reservationBranch, /reservation_status,[\s\S]*'active'/);
  assert.equal(
    (orderCreation.match(/insert into public\.stock_reservations/g) || []).length,
    1,
    "the bank-transfer branch must be the only reservation creation path"
  );
  assert.doesNotMatch(orderCreation, /update public\.product_variants[\s\S]*set stock/);

  const freeshipStart = orderCreation.indexOf("  select case when exists (");
  assert.notEqual(freeshipStart, -1, "current production SQL must contain the freeship calculation");
  const freeshipBlock = orderCreation.slice(freeshipStart);
  assert.doesNotMatch(freeshipBlock, /stock_reservations|product_variants|inventory_movements/);
});

test("latest inventory lifecycle scopes managed products to yarn and accessory only", () => {
  const managedCategoryScope = /p\.category in \('yarn', 'accessory'\)/g;

  assert.equal(
    (latestPayosCompletion.match(managedCategoryScope) || []).length,
    2,
    "PayOS must lock and consume both managed categories"
  );
  assert.equal(
    (latestAdminConfirm.match(managedCategoryScope) || []).length,
    3,
    "COD confirmation must lock variants, reservations, and items for both managed categories"
  );
  assert.doesNotMatch(latestPayosCompletion, /p\.category = 'yarn'/);
  assert.doesNotMatch(latestAdminConfirm, /p\.category = 'yarn'/);
});

test("first successful PayOS completion decrements yarn or accessory stock and completes reservations", () => {
  assert.match(latestPayosCompletion, /v_payment\.status = 'paid'[\s\S]*alreadyPaid'[\s\S]*true/);
  assert.match(latestPayosCompletion, /'payment_sale'[\s\S]*-v_item\.quantity/);
  assert.match(latestPayosCompletion, /update public\.product_variants[\s\S]*set stock = v_stock_after/);
  assert.match(latestPayosCompletion, /reservation_status = 'completed'/);
  assert.match(latestPayosCompletion, /payment:%s:variant:%s/);
  assert.match(inventory, /reference_key text not null unique/);
});

test("PayOS retry repairs only pending bank-transfer order status before inventory mutation", () => {
  const retryStart = latestPayosCompletion.indexOf("if v_payment.status = 'paid'");
  const retryEnd = latestPayosCompletion.indexOf("perform pv.id", retryStart);
  const retryBranch = latestPayosCompletion.slice(retryStart, retryEnd);
  assert.match(retryBranch, /alreadyPaid', true/);
  assert.doesNotMatch(retryBranch, /product_variants|inventory_movements|stock_reservations/);
  assert.match(retryBranch, /v_order\.payment_method = 'bank_transfer'[\s\S]*v_order\.order_status = 'pending_payment'/);
  assert.match(retryBranch, /payment_status = 'paid',[\s\S]*order_status = case[\s\S]*else order_status/);
});

test("first PayOS payment moves only pending bank-transfer orders to confirmation", () => {
  assert.match(latestPayosCompletion, /o\.order_status,[\s\S]*o\.payment_method,[\s\S]*o\.payment_status/);
  const firstPaymentUpdate = latestPayosCompletion.slice(latestPayosCompletion.lastIndexOf("update public.orders"));
  assert.match(firstPaymentUpdate, /payment_status = 'paid',[\s\S]*when payment_method = 'bank_transfer'[\s\S]*order_status = 'pending_payment'[\s\S]*then 'pending_confirmation'[\s\S]*else order_status/);
});

test("expired reservation payment still reconciles when stock is sufficient", () => {
  const loop = latestPayosCompletion.slice(latestPayosCompletion.indexOf("for v_item in"), latestPayosCompletion.indexOf("update public.payments"));
  assert.doesNotMatch(loop, /expires_at\s*>/);
  assert.match(loop, /elsif v_stock >= v_item\.quantity/);
  assert.match(loop, /set stock = v_stock_after/);
});

test("insufficient accessory stock keeps the established PayOS attention and reservation behavior", () => {
  const loop = latestPayosCompletion.slice(latestPayosCompletion.indexOf("for v_item in"), latestPayosCompletion.indexOf("update public.payments"));

  assert.match(loop, /p\.category in \('yarn', 'accessory'\)/);
  assert.match(loop, /if v_stock is null then[\s\S]*v_attention := true/);
  assert.match(loop, /else[\s\S]*v_attention := true[\s\S]*reservation_status = 'cancelled'/);
  assert.doesNotMatch(loop, /raise exception/);
  assert.match(latestPayosCompletion, /update public\.payments[\s\S]*status = 'paid'/);
  assert.match(latestPayosCompletion, /update public\.orders[\s\S]*payment_status = 'paid'[\s\S]*inventory_attention_required/);
  assert.match(inventory, /stock_after is null or stock_after >= 0/);
});

test("mixed yarn and accessory PayOS items retain deterministic per-variant processing", () => {
  assert.match(latestPayosCompletion, /group by oi\.variant_id[\s\S]*order by oi\.variant_id/);
  assert.match(latestPayosCompletion, /on conflict \(reference_key\) do nothing/);
  assert.match(latestPayosCompletion, /payment:%s:variant:%s/);
});

test("COD confirmation consumes yarn or accessory available stock once", () => {
  assert.match(latestAdminConfirm, /if v_order\.payment_method = 'cod'/);
  assert.match(latestAdminConfirm, /reservation_status = 'active'[\s\S]*expires_at > pg_catalog\.clock_timestamp/);
  assert.match(latestAdminConfirm, /v_stock - v_reserved < v_item\.quantity/);
  assert.match(latestAdminConfirm, /'cod_confirm'[\s\S]*-v_item\.quantity/);
  assert.match(latestAdminConfirm, /cod_confirm:%s:variant:%s/);
  assert.match(latestAdminConfirm, /if v_order\.order_status = 'confirmed'[\s\S]*alreadyConfirmed', true/);
});

test("admin cancellation restores consumed managed stock once without faking unmanaged stock", () => {
  assert.match(admin, /movement_type in \('payment_sale', 'cod_confirm'\)/);
  assert.match(admin, /if v_stock is null then[\s\S]*v_attention := true[\s\S]*else[\s\S]*v_stock_after := v_stock \+ v_item\.quantity/);
  assert.match(admin, /'order_cancel_restore'/);
  assert.match(admin, /admin_cancel_restore:%s:variant:%s/);
  assert.match(admin, /on conflict \(reference_key\) do nothing/);
});

test("admin stock adjustment accepts yarn and accessory while rejecting protected categories", () => {
  assert.match(latestAdminAdjustment, /if not found or v_variant\.category not in \('yarn', 'accessory'\) then/);
  assert.doesNotMatch(latestAdminAdjustment, /category = 'yarn'/);
  assert.match(latestAdminAdjustment, /p_new_stock is not null and p_new_stock < 0/);
  assert.match(latestAdminAdjustment, /for update of pv/);
  assert.match(latestAdminAdjustment, /set stock = p_new_stock/);
  assert.match(latestAdminAdjustment, /'admin_adjustment:' \|\| p_request_id::text/);
  assert.match(latestAdminAdjustment, /when v_variant\.stock is null and p_new_stock is not null then 'admin_restock'/);
});

test("accessory inventory migration preserves function security and grants", () => {
  assert.equal(
    (accessoryInventory.match(/security definer[\s\S]*?set search_path = ''/g) || []).length,
    3
  );
  assert.match(accessoryInventory, /revoke all on function public\.complete_guest_payos_payment[\s\S]*from public, anon, authenticated/);
  assert.match(accessoryInventory, /revoke all on function public\.admin_confirm_order[\s\S]*from public, anon, authenticated/);
  assert.match(accessoryInventory, /revoke all on function public\.admin_adjust_variant_stock[\s\S]*from public, anon, authenticated/);
  assert.match(accessoryInventory, /grant execute on function public\.complete_guest_payos_payment[\s\S]*to service_role/);
  assert.match(accessoryInventory, /grant execute on function public\.admin_confirm_order\(text, uuid\) to service_role/);
  assert.match(accessoryInventory, /grant execute on function public\.admin_adjust_variant_stock[\s\S]*to service_role/);
  assert.doesNotMatch(accessoryInventory, /alter table|drop (table|column|constraint)|delete from|create table/i);
});
