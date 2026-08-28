import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getProductRevalidationPaths } from "./product-revalidation";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const protectedLayout = read("../../app/admin/(protected)/layout.tsx");
const auth = read("./auth.ts");
const actions = read("../../app/admin/(protected)/actions.ts");
const productActions = read("../../app/admin/(protected)/san-pham/actions.ts");
const cloudinarySignRoute = read("../../app/api/admin/cloudinary/sign-upload/route.ts");
const service = read("./admin-service.ts");
const migration = read("../../supabase/migrations/20260810055926_admin_security_and_operations.sql");
const shell = read("../../components/layout/StorefrontShell.tsx");
const navigation = read("../../components/admin/AdminNavigation.tsx");

test("admin pages require a verified server-side session and active allowlist entry", () => {
  assert.match(protectedLayout, /await requireAdminPage\(\)/);
  assert.match(auth, /auth\.getClaims\(\)/);
  assert.match(auth, /from\("admin_users"\)/);
  assert.match(auth, /\.eq\("active", true\)/);
});

test("primary admin navigation disables route prefetch for every destination", () => {
  assert.match(navigation, /navigation\.map/);
  assert.match(navigation, /<Link href=\{item\.href\} prefetch=\{false\}/);
});

test("admin mutations reverify authorization and keep the service role server-only", () => {
  assert.match(actions, /await requireAdminPage\(\)/);
  assert.match(productActions, /await requireAdminPage\(\)/);
  assert.match(productActions, /getSupabaseAdminClient/);
  assert.doesNotMatch(productActions, /NEXT_PUBLIC_SUPABASE|createBrowserClient|localStorage/);
});

test("Cloudinary upload signatures are issued only after the shared active-admin verification", () => {
  assert.match(cloudinarySignRoute, /getVerifiedAdmin/);
  assert.match(cloudinarySignRoute, /if \(!admin\)[\s\S]*status: 401/);
  assert.match(cloudinarySignRoute, /createAdminSignedUpload/);
  assert.match(cloudinarySignRoute, /Cache-Control": "no-store/);
});

test("admin product save keeps both price columns synchronized and revalidates the matching catalog route", () => {
  assert.match(productActions, /price:\s*parsed\.data\.price,\s*base_price:\s*parsed\.data\.price/);
  assert.match(productActions, /select\("id,slug,category"\)/);
  assert.match(productActions, /getProductRevalidationPaths/);
  assert.match(productActions, /revalidateProducts\(data\?\.slug, data\?\.category\)/);
  assert.match(productActions, /slugifyProductName\(parsed\.data\.slug \|\| parsed\.data\.name\)/);
  assert.match(productActions, /insertPayload = \{ \.\.\.payload, slug: stableSlug \}/);
});

test("every yarn mutation revalidates both the yarn catalog and the umbrella catalog", () => {
  const revalidation = productActions.match(/function revalidateProducts[\s\S]*?(?=export async function saveProductAction)/)?.[0] || "";
  assert.match(revalidation, /getProductRevalidationPaths\(\{ slug, category \}, previousProduct\)/);
  assert.match(productActions, /revalidateProducts\(imported\.data\.productSlug, "yarn"\)/);
});

test("accessory mutations revalidate cart, checkout, and accessory catalog routes", () => {
  assert.deepEqual(getProductRevalidationPaths({ slug: "kim-moc", category: "accessory" }), [
    "/admin/san-pham",
    "/gio-hang",
    "/thanh-toan",
    "/",
    "/len-soi-va-phu-kien",
    "/phu-kien",
    "/phu-kien/kim-moc",
    "/sitemap.xml"
  ]);
});

test("every product mutation revalidates cart and checkout even outside online categories", () => {
  for (const category of ["handmade", "set", "gift", null, undefined]) {
    assert.deepEqual(getProductRevalidationPaths({ slug: "protected", category }), [
      "/admin/san-pham", "/gio-hang", "/thanh-toan"
    ]);
  }
});

test("existing product category transitions invalidate both the old and new storefront categories", () => {
  const saveProduct = productActions.match(/export async function saveProductAction[\s\S]*?(?=export async function toggleProductAction)/)?.[0] || "";
  assert.match(saveProduct, /let previousProduct: ProductRevalidationTarget \| null = null/);
  assert.match(saveProduct, /from\("products"\)[\s\S]*select\("slug,category"\)[\s\S]*eq\("id", parsed\.data\.id\)[\s\S]*single\(\)[\s\S]*const request/);
  assert.match(saveProduct, /revalidateProducts\(data\?\.slug, data\?\.category, previousProduct\)/);

  const target = (category: string | null, slug = "new-product") => ({ category, slug });
  assert.deepEqual(getProductRevalidationPaths(target("handmade"), target("yarn", "milk-bo")), [
    "/admin/san-pham", "/gio-hang", "/thanh-toan", "/", "/len-soi-va-phu-kien", "/len-soi", "/len-soi/milk-bo", "/sitemap.xml"
  ]);
  assert.deepEqual(getProductRevalidationPaths(target("handmade"), target("accessory", "kim-moc")), [
    "/admin/san-pham", "/gio-hang", "/thanh-toan", "/", "/len-soi-va-phu-kien", "/phu-kien", "/phu-kien/kim-moc", "/sitemap.xml"
  ]);
  assert.deepEqual(getProductRevalidationPaths(target("accessory", "kim-moi"), target("yarn", "milk-bo")), [
    "/admin/san-pham", "/gio-hang", "/thanh-toan", "/", "/len-soi-va-phu-kien", "/phu-kien", "/phu-kien/kim-moi", "/len-soi", "/len-soi/milk-bo", "/sitemap.xml"
  ]);
  assert.deepEqual(getProductRevalidationPaths(target("yarn", "milk-moi"), target("accessory", "kim-moc")), [
    "/admin/san-pham", "/gio-hang", "/thanh-toan", "/", "/len-soi-va-phu-kien", "/len-soi", "/len-soi/milk-moi", "/phu-kien", "/phu-kien/kim-moc", "/sitemap.xml"
  ]);
  assert.deepEqual(getProductRevalidationPaths(target("gift"), target("handmade", "custom")), [
    "/admin/san-pham", "/gio-hang", "/thanh-toan"
  ]);
  assert.deepEqual(getProductRevalidationPaths(target("yarn", "milk-bo"), target("yarn", "milk-bo")), [
    "/admin/san-pham", "/gio-hang", "/thanh-toan", "/", "/len-soi-va-phu-kien", "/len-soi", "/len-soi/milk-bo", "/sitemap.xml"
  ]);
  assert.deepEqual(getProductRevalidationPaths(target("accessory", "kim-moc"), target("accessory", "kim-moc")), [
    "/admin/san-pham", "/gio-hang", "/thanh-toan", "/", "/len-soi-va-phu-kien", "/phu-kien", "/phu-kien/kim-moc", "/sitemap.xml"
  ]);
});

test("every catalog mutation resolves the product slug before storefront revalidation", () => {
  assert.match(productActions, /toggleProductAction[\s\S]*select\("slug,category"\)\.single\(\)[\s\S]*revalidateProducts\(data\?\.slug, data\?\.category\)/);
  assert.match(productActions, /saveVariantAction[\s\S]*select\("id,category,slug"\)[\s\S]*revalidateProducts\(product\.slug, product\.category\)/);
  assert.match(productActions, /toggleVariantAction[\s\S]*select\("slug,category"\)[\s\S]*revalidateProducts\(product\.slug, product\.category\)/);
  assert.match(productActions, /importVariantsAction[\s\S]*rpc\("admin_import_product_variants"[\s\S]*revalidateProducts\(imported\.data\.productSlug, "yarn"\)/);
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

test("inventory admin is limited to inventory-managed categories and storefront protected sections stay passive", () => {
  assert.match(service, /\.in\("category", \["yarn", "accessory"\]\)/);
  assert.match(shell, /pathname\.startsWith\("\/admin"\)/);
  assert.match(shell, /return children/);
  assert.doesNotMatch(service, /do-moc-dat-rieng|hop-qua|set-tu-moc/);
});
