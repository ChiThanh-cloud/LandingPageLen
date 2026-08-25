import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const servicePath = new URL("./admin-service.ts", import.meta.url);
const serviceCode = readFileSync(servicePath, "utf8");
const productPageCode = readFileSync(new URL("../../app/admin/(protected)/san-pham/page.tsx", import.meta.url), "utf8");
const productManagerCode = readFileSync(new URL("../../components/admin/ProductManager.tsx", import.meta.url), "utf8");
const inventoryPageCode = readFileSync(new URL("../../app/admin/(protected)/ton-kho/page.tsx", import.meta.url), "utf8");

test("Dashboard metric RPC output mapping đúng", () => {
  // Check RPC usage
  assert.match(serviceCode, /\.rpc\("get_admin_dashboard_metrics"\)/);
  
  // Check mapping logic
  assert.match(serviceCode, /pendingConfirmation:\s*Number\(value\.pendingConfirmation\s*\?\?\s*0\)/);
  assert.match(serviceCode, /pendingPayment:\s*Number\(value\.pendingPayment\s*\?\?\s*0\)/);
  assert.match(serviceCode, /confirmed:\s*Number\(value\.confirmed\s*\?\?\s*0\)/);
  assert.match(serviceCode, /ordersToday:\s*Number\(value\.ordersToday\s*\?\?\s*0\)/);
  assert.match(serviceCode, /paidRevenueToday:\s*Number\(value\.paidRevenueToday\s*\?\?\s*0\)/);
});

test("getAdminDashboard không fetch toàn bộ orders nữa", () => {
  // We want to make sure getAdminDashboard doesn't contain .from("orders")
  // Let's extract the function body first
  const match = serviceCode.match(/export async function getAdminDashboard\(\)[\s\S]*?return \{/);
  assert.ok(match, "Found getAdminDashboard function");
  assert.doesNotMatch(match[0], /\.from\("orders"\)/);
});

test("order pagination remains database-side with a default of 25 rows", () => {
  assert.match(serviceCode, /ADMIN_ORDER_PAGE_SIZE = 25/);
  assert.match(serviceCode, /Math\.min\(50,\s*Math\.max\(10,\s*filters\.pageSize\s*\|\|\s*ADMIN_ORDER_PAGE_SIZE\)\)/);
  assert.match(serviceCode, /const\s+from\s*=\s*\(page\s*-\s*1\)\s*\*\s*pageSize;/);
  assert.match(serviceCode, /const\s+to\s*=\s*from\s*\+\s*pageSize\s*-\s*1;/);
  assert.match(serviceCode, /\.range\(from,\s*to\)/);
  assert.match(serviceCode, /\{ count:\s*"exact"\s*\}/);
  assert.match(serviceCode, /Math\.ceil\(total\s*\/\s*pageSize\)/);
  assert.match(serviceCode, /rows:\s*\(data\s*\|\|\s*\[\]\)/);
  assert.match(serviceCode, /filters\.status\s*&&\s*filters\.status\s*!==\s*"all"/);
  assert.match(serviceCode, /filters\.paymentMethod\s*&&\s*filters\.paymentMethod\s*!==\s*"all"/);
  assert.match(serviceCode, /filters\.paymentStatus\s*&&\s*filters\.paymentStatus\s*!==\s*"all"/);
});

test("product list uses server pagination, search, category filters, and a lightweight projection", () => {
  assert.match(serviceCode, /ADMIN_PRODUCT_PAGE_SIZE = 25/);
  assert.match(serviceCode, /select\("id,name,category,sub_category,image_url,price,status,sort_order,created_at", \{ count: "exact" \}\)/);
  assert.match(serviceCode, /query = query\.ilike\("name", `%\$\{safe\}%`\)/);
  assert.match(serviceCode, /query = query\.eq\("category", filters\.category\)/);
  assert.match(serviceCode, /buildProductQuery\(requestedPage\)/);
  assert.match(serviceCode, /buildProductQuery\(window\.pagination\.page\)/);
  assert.doesNotMatch(serviceCode, /from\("products"\)\.select\("\*"\)/);
  assert.match(productPageCode, /query, category, page: normalizeAdminPage\(value\("page"\)\), editId/);
  assert.match(productManagerCode, /name="q"[\s\S]*name="category"[\s\S]*type="submit"/);
  assert.match(productManagerCode, /hrefWith\(\{ edit: selectedId, page: pagination\.page [+-] 1 \}\)/);
});

test("selected product detail and variants are fetched only for the exact edit id", () => {
  assert.match(serviceCode, /const editId = filters\.editId[\s\S]*\? filters\.editId : null/);
  assert.match(serviceCode, /select\("id,name,category,sub_category,image_url,full_image_url,weight,yarn_size,material,crochet_hook,origin,description,price,status,sort_order,created_at"\)/);
  assert.match(serviceCode, /selectedProductPromise = editId[\s\S]*\.eq\("id", editId\)[\s\S]*\.maybeSingle\(\)/);
  assert.match(serviceCode, /selectedVariantsPromise = editId[\s\S]*from\("product_variants"\)[\s\S]*\.eq\("product_id", editId\)/);
  assert.match(serviceCode, /Promise\.resolve\(\{ data: null, error: null \}\)/);
  assert.match(serviceCode, /Promise\.resolve\(\{ data: \[\], error: null \}\)/);
  assert.doesNotMatch(serviceCode, /from\("product_variants"\)\.select\("\*"\)/);
});

test("inventory variants and movements are independently paginated and filtered in the database", () => {
  assert.match(serviceCode, /ADMIN_INVENTORY_PAGE_SIZE = 40/);
  assert.match(serviceCode, /ADMIN_MOVEMENT_PAGE_SIZE = 25/);
  assert.match(serviceCode, /query = query\.eq\("product_id", filters\.productId\)/);
  assert.match(serviceCode, /query = query\.or\(`name\.ilike/);
  assert.match(serviceCode, /filters\.stock === "in-stock"[\s\S]*\.gt\("stock", 0\)/);
  assert.match(serviceCode, /filters\.stock === "out-of-stock"[\s\S]*\.eq\("stock", 0\)/);
  assert.match(serviceCode, /filters\.stock === "unmanaged"[\s\S]*\.is\("stock", null\)/);
  assert.match(serviceCode, /buildVariantQuery\(requestedPage\)/);
  assert.match(serviceCode, /buildMovementQuery\(requestedMovementPage\)/);
  assert.match(serviceCode, /variant:product_variants!inventory_movements_variant_id_fkey/);
  assert.doesNotMatch(serviceCode, /\.limit\(200\)/);
  assert.match(inventoryPageCode, /name="product"[\s\S]*name="stock"[\s\S]*movementPage/);
  assert.match(inventoryPageCode, /new Map\(movements\.map/);
  assert.doesNotMatch(inventoryPageCode, /variants\.find\(/);
});
