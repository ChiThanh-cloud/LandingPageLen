import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  ADMIN_PRODUCT_CATEGORIES,
  getInventoryCategoryCounts,
  getInventoryCategoryGroups,
  getProductCategoryCounts,
  getProductCategoryGroups
} from "./catalog-organization";

const products = [
  { id: 2, name: "Kim móc", slug: "kim-moc", category: "accessory", sort_order: 1 },
  { id: 1, name: "Milk Bò", slug: "milk-bo", category: "yarn", sort_order: 2 },
  { id: 3, name: "Nhung Gấu", slug: "nhung-gau", category: "yarn", sort_order: 1 },
  { id: 4, name: "Bé thỏ", slug: "be-tho", category: "handmade", sort_order: 1 },
  { id: 5, name: "Set hoa", slug: "set-hoa", category: "set", sort_order: 1 },
  { id: 6, name: "Hộp quà", slug: "hop-qua", category: "gift", sort_order: 1 }
];

const variants = [
  { id: 13, product_id: 1, name: "Đỏ", color_name: "Đỏ đô", color_code: "15", sku: "MILK-15", stock: 0, sort_order: 2 },
  { id: 11, product_id: 3, name: "Xanh", color_name: "Xanh lá", color_code: "02", sku: "NHUNG-02", stock: 5, sort_order: 2 },
  { id: 14, product_id: 2, name: "2.5 mm", color_name: null, color_code: null, sku: "HOOK-25", stock: null, sort_order: 1 },
  { id: 12, product_id: 3, name: "Kem", color_name: "Kem", color_code: "01", sku: "NHUNG-01", stock: null, sort_order: 1 }
];

test("inventory separates categories and keeps product variants together in explicit sort order", () => {
  const groups = getInventoryCategoryGroups(products, variants, "", "all");
  assert.deepEqual(groups.map((group) => group.value), ["yarn", "accessory"]);
  assert.deepEqual(groups[0].productGroups.map(({ product }) => product.name), ["Nhung Gấu", "Milk Bò"]);
  assert.deepEqual(groups[0].productGroups[0].variants.map((variant) => variant.id), [12, 11]);
  assert.deepEqual(groups[0].productGroups[0].variants.map((variant) => variant.product_id), [3, 3]);
});

test("inventory unmanaged filter uses null only and search matches SKU, product, color, and size", () => {
  const counts = getInventoryCategoryCounts(products, variants);
  assert.deepEqual(counts, { all: 4, yarn: 3, accessory: 1, unmanaged: 2 });
  assert.deepEqual(getInventoryCategoryGroups(products, variants, "", "unmanaged").flatMap((group) => group.productGroups.flatMap((item) => item.variants.map((variant) => variant.id))), [12, 14]);
  assert.deepEqual(getInventoryCategoryGroups(products, variants, "MILK-15", "all")[0].productGroups[0].variants.map((variant) => variant.id), [13]);
  assert.equal(getInventoryCategoryGroups(products, variants, "milk bo", "all")[0].productGroups[0].product.name, "Milk Bò");
  assert.equal(getInventoryCategoryGroups(products, variants, "xanh la", "all")[0].productGroups[0].variants[0].id, 11);
  assert.equal(getInventoryCategoryGroups(products, variants, "2.5 mm", "accessory")[0].productGroups[0].variants[0].id, 14);
});

test("product category labels, counts, grouping, and composed search follow the admin contract", () => {
  assert.deepEqual(ADMIN_PRODUCT_CATEGORIES.map(({ label }) => label), ["Đồ móc", "Len sợi", "Phụ kiện", "Set tự móc", "Quà tặng"]);
  assert.deepEqual(getProductCategoryCounts(products), { all: 6, handmade: 1, yarn: 2, accessory: 1, set: 1, gift: 1 });
  assert.deepEqual(getProductCategoryGroups(products, "", "all").map((group) => group.value), ["handmade", "yarn", "accessory", "set", "gift"]);
  const filtered = getProductCategoryGroups(products, "milk", "yarn");
  assert.equal(filtered.length, 1);
  assert.deepEqual(filtered[0].products.map((product) => product.name), ["Milk Bò"]);
  assert.equal(getProductCategoryGroups(products, "milk", "accessory").length, 0);
});

test("grouped admin UIs preserve StockEditor and product editing actions", () => {
  const inventoryCatalog = readFileSync(new URL("../../components/admin/InventoryCatalog.tsx", import.meta.url), "utf8");
  const productManager = readFileSync(new URL("../../components/admin/ProductManager.tsx", import.meta.url), "utf8");
  assert.match(inventoryCatalog, /<StockEditor variantId=\{String\(variant\.id\)\} stock=\{variant\.stock\}/);
  for (const action of ["chooseProduct(product)", "toggleProductAction", "generateCaptionAction", "deleteProductAction", "saveProductAction", "saveVariantAction", "importVariantsAction"]) {
    assert.ok(productManager.includes(action), action);
  }
  assert.match(productManager, /selectedId === String\(product\.id\) \? styles\.selectedItem/);
});

test("admin catalog visually-hidden labels remain available to assistive technology", () => {
  const adminStyles = readFileSync(new URL("../../components/admin/Admin.module.css", import.meta.url), "utf8");
  const srOnlyBlock = adminStyles.match(/\.srOnly\s*\{([\s\S]*?)\}/)?.[1] || "";
  assert.match(srOnlyBlock, /position:\s*absolute/);
  assert.match(srOnlyBlock, /width:\s*1px/);
  assert.match(srOnlyBlock, /height:\s*1px/);
  assert.match(srOnlyBlock, /margin:\s*-1px/);
  assert.match(srOnlyBlock, /clip:\s*rect\(0, 0, 0, 0\)/);
  assert.doesNotMatch(srOnlyBlock, /display:\s*none|visibility:\s*hidden/);
});
