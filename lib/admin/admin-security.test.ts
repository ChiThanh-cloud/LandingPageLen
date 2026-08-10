import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const protectedLayout = read("../../app/admin/(protected)/layout.tsx");
const auth = read("./auth.ts");
const actions = read("../../app/admin/(protected)/actions.ts");
const productActions = read("../../app/admin/(protected)/san-pham/actions.ts");
const service = read("./admin-service.ts");
const migration = read("../../supabase/migrations/20260810055926_admin_security_and_operations.sql");
const shell = read("../../components/layout/StorefrontShell.tsx");

test("admin pages require a verified server-side session and active allowlist entry", () => {
  assert.match(protectedLayout, /await requireAdminPage\(\)/);
  assert.match(auth, /auth\.getClaims\(\)/);
  assert.match(auth, /from\("admin_users"\)/);
  assert.match(auth, /\.eq\("active", true\)/);
});

test("admin mutations reverify authorization and keep the service role server-only", () => {
  assert.match(actions, /await requireAdminPage\(\)/);
  assert.match(productActions, /await requireAdminPage\(\)/);
  assert.match(productActions, /getSupabaseAdminClient/);
  assert.doesNotMatch(productActions, /NEXT_PUBLIC_SUPABASE|createBrowserClient|localStorage/);
});

test("browser roles cannot directly mutate catalog or inventory", () => {
  assert.match(migration, /revoke insert, update, delete on table public\.products from authenticated/);
  assert.match(migration, /revoke insert, update, delete on table public\.product_variants from authenticated/);
  assert.match(migration, /revoke insert, update, delete on table public\.content_posts from authenticated/);
  assert.match(migration, /revoke all on function public\.admin_adjust_variant_stock[\s\S]*from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.admin_adjust_variant_stock[\s\S]*to service_role/);
});

test("admin order list and detail load server-side order data", () => {
  assert.match(service, /export async function getAdminOrders/);
  assert.match(service, /order_code,customer_name,phone,subtotal,shipping_fee,total/);
  assert.match(service, /export async function getAdminOrder/);
  assert.match(service, /order_items\(id,product_id,variant_id/);
});

test("admin confirm, transitions, and cancellation use secured atomic RPCs", () => {
  assert.match(actions, /admin_confirm_order/);
  assert.match(actions, /admin_transition_order/);
  assert.match(actions, /admin_cancel_order/);
  for (const name of ["admin_confirm_order", "admin_transition_order", "admin_cancel_order"]) {
    assert.match(migration, new RegExp(`function public\\.${name}`));
  }
  assert.match(migration, /if v_order\.order_status = 'cancelled'[\s\S]*alreadyCancelled', true/);
  assert.match(migration, /paymentStatus', v_order\.payment_status/);
  assert.doesNotMatch(migration, /set\s+payment_status\s*=\s*'refunded'/i);
});

test("inventory admin is limited to yarn and storefront protected sections stay passive", () => {
  assert.match(service, /\.eq\("category", "yarn"\)/);
  assert.match(shell, /pathname\.startsWith\("\/admin"\)/);
  assert.match(shell, /return children/);
  assert.doesNotMatch(service, /do-moc-dat-rieng|hop-qua|set-tu-moc/);
});

