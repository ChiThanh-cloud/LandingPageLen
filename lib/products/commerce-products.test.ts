import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  applyCommerceFallbackGuard,
  commerceProductFromRows,
  findProductByCategoryAndSlug,
  getCommerceOptionLabel,
  getCommerceUnitLabel,
  getProductsForCategory,
  normalizeVariantPrice
} from "./commerce-products";
import type { CommerceProduct } from "@/types/commerce-product";
import type { SupabaseProductRow, SupabaseVariantRow } from "@/types/supabase-product";

const commerceAdapter = readFileSync(new URL("./commerce-products.ts", import.meta.url), "utf8");
const yarnAdapter = readFileSync(new URL("./supabase-products.ts", import.meta.url), "utf8");

function productRow(overrides: Partial<SupabaseProductRow> = {}): SupabaseProductRow {
  return {
    id: 1,
    name: "Sản phẩm thử nghiệm",
    slug: "san-pham-thu-nghiem",
    category: "accessory",
    sub_category: null,
    unit_label: null,
    option_label: null,
    description: "Mô tả",
    cover_image: "https://example.com/cover.jpg",
    image_url: null,
    full_image_url: null,
    base_price: null,
    price: 10000,
    weight: null,
    yarn_size: null,
    material: null,
    knitting_needle: null,
    crochet_hook: null,
    origin: null,
    status: "available",
    sort_order: 4,
    created_at: "2026-08-01T00:00:00.000Z",
    updated_at: "2026-08-02T00:00:00.000Z",
    ...overrides
  };
}

function variantRow(overrides: Partial<SupabaseVariantRow> = {}): SupabaseVariantRow {
  return {
    id: 10,
    product_id: 1,
    sku: "SKU-10",
    name: "Mặc định",
    color_code: null,
    color_name: null,
    color_hex: null,
    image_url: null,
    full_image_url: null,
    price: 12500,
    stock: null,
    status: "available",
    sort_order: 2,
    ...overrides
  };
}

function mappedProduct(overrides: Partial<SupabaseProductRow> = {}): CommerceProduct {
  const product = commerceProductFromRows(productRow(overrides), []);
  assert.ok(product);
  return product;
}

test("generic sellable query includes yarn and accessory while excluding protected categories", () => {
  assert.match(commerceAdapter, /\.in\("category", \["yarn", "accessory"\]\)/);
  assert.match(commerceAdapter, /\.neq\("status", "hidden"\)/);
  assert.equal(commerceProductFromRows(productRow({ category: "handmade" }), []), null);
  assert.equal(commerceProductFromRows(productRow({ category: "set" }), []), null);
  assert.equal(commerceProductFromRows(productRow({ category: "gift" }), []), null);
});

test("generic mapper preserves yarn labels, color behavior, variant price, and NULL stock", () => {
  const yarn = commerceProductFromRows(
    productRow({ id: 2, category: "yarn", unit_label: null, option_label: null }),
    [variantRow({ product_id: 2, name: "Xanh lá", color_code: null, color_name: null, price: 15000, stock: null })]
  );
  assert.ok(yarn);
  assert.equal(yarn.category, "yarn");
  assert.equal(yarn.unitLabel, "cuộn");
  assert.equal(yarn.optionLabel, "Màu");
  assert.equal(yarn.variants[0].colorCode, "Xanh lá");
  assert.equal(yarn.variants[0].colorName, "Xanh lá");
  assert.equal(yarn.variants[0].price, 15000);
  assert.equal(yarn.variants[0].stock, null);
});

test("accessory labels come from database fields and variants do not need color data", () => {
  for (const [name, unitLabel, optionLabel] of [
    ["Kim móc", "cây", "Kích thước"],
    ["Bông gòn", "Kg", "Khối lượng"],
    ["Mắt thú", "cặp", "Kích thước"],
    ["Kim khâu", "cây", "Phân loại"]
  ]) {
    const product = commerceProductFromRows(productRow({ name, unit_label: unitLabel, option_label: optionLabel }), []);
    assert.ok(product);
    assert.equal(product.unitLabel, unitLabel, name);
    assert.equal(product.optionLabel, optionLabel, name);
  }

  const accessory = commerceProductFromRows(productRow(), [variantRow()]);
  assert.ok(accessory);
  assert.equal(accessory.category, "accessory");
  assert.equal(accessory.variants[0].name, "Mặc định");
  assert.equal(accessory.variants[0].colorCode, null);
  assert.equal(accessory.variants[0].colorName, null);
  assert.equal(accessory.variants[0].colorHex, null);
  assert.equal(accessory.variants[0].price, 12500);
  assert.equal(accessory.variants[0].stock, null);
});

test("variant display prices use the same positive-override semantics as order pricing", () => {
  assert.equal(normalizeVariantPrice(null), null);
  assert.equal(normalizeVariantPrice(25000), 25000);
  assert.equal(normalizeVariantPrice(0), null);
  assert.equal(normalizeVariantPrice(-25000), null);

  const accessory = commerceProductFromRows(productRow({ price: 10000 }), [
    variantRow({ id: 11, price: null }),
    variantRow({ id: 12, price: 25000 }),
    variantRow({ id: 13, price: 0 }),
    variantRow({ id: 14, price: -25000 })
  ]);
  assert.ok(accessory);
  assert.equal(accessory.price, 10000);
  assert.deepEqual(accessory.variants.map((variant) => variant.price), [null, 25000, null, null]);
});

test("product price is strictly positive and precedes base_price with invalid values falling back", () => {
  assert.equal(mappedProduct({ price: 18_000, base_price: 20_000 }).price, 18_000);
  assert.equal(mappedProduct({ price: null, base_price: 20_000 }).price, 20_000);
  assert.equal(mappedProduct({ price: 0, base_price: 20_000 }).price, 20_000);
  assert.equal(mappedProduct({ price: -5_000, base_price: 20_000 }).price, 20_000);
  assert.equal(mappedProduct({ price: "invalid", base_price: 20_000 }).price, 20_000);
  assert.equal(commerceProductFromRows(productRow({ price: 0, base_price: 0 }), []), null);
});

test("generic mapping filters only hidden status and preserves out or preorder semantics", () => {
  const product = commerceProductFromRows(
    productRow({ status: "preorder" }),
    [
      variantRow({ id: 11, status: "out" }),
      variantRow({ id: 12, status: "preorder" }),
      variantRow({ id: 13, status: "hidden" })
    ]
  );

  assert.ok(product);
  assert.equal(product.status, "preorder");
  assert.deepEqual(product.variants.map((variant) => variant.status), ["out", "preorder"]);
});

test("accessory helpers cannot resolve a yarn product, even for a duplicate fixture slug", () => {
  const yarn = mappedProduct({ id: 3, category: "yarn", slug: "kim-moc" });
  const accessory = mappedProduct({ id: 4, category: "accessory", slug: "kim-moc" });
  const products = [yarn, accessory];
  assert.deepEqual(getProductsForCategory(products, "yarn"), [yarn]);
  assert.deepEqual(getProductsForCategory(products, "accessory"), [accessory]);
  assert.equal(findProductByCategoryAndSlug(products, "accessory", "kim-moc"), accessory);
  assert.notEqual(findProductByCategoryAndSlug([yarn], "accessory", "kim-moc"), yarn);
  assert.match(commerceAdapter, /export const getAllAccessoryProducts[\s\S]*getProductsForCategory\(await getAllSellableProducts\(\), "accessory"\)/);
  assert.match(commerceAdapter, /getAccessoryProductBySlug[\s\S]*findProductByCategoryAndSlug\(await getAllSellableProducts\(\), "accessory", slug\)/);
});

test("label fallbacks are category-safe when TASK 1 migration is not applied", () => {
  assert.equal(getCommerceUnitLabel(productRow({ category: "yarn", unit_label: null })), "cuộn");
  assert.equal(getCommerceOptionLabel(productRow({ category: "yarn", option_label: null })), "Màu");
  assert.equal(getCommerceUnitLabel(productRow({ category: "accessory", unit_label: null })), "sản phẩm");
  assert.equal(getCommerceOptionLabel(productRow({ category: "accessory", option_label: null })), "Phân loại");
});

test("generic fallback remains fail-closed in production and never manufactures accessories", () => {
  const saved = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = "production";
    assert.throws(() => applyCommerceFallbackGuard(null), /Refusing to serve static data on production/);

    process.env.NODE_ENV = "test";
    const fallback = applyCommerceFallbackGuard(null);
    assert.ok(fallback.length > 0);
    assert.ok(fallback.every((product) => product.category === "yarn"));
  } finally {
    process.env.NODE_ENV = saved;
  }
});

test("existing yarn adapter remains yarn-only and keeps its public contract", () => {
  assert.match(yarnAdapter, /import type \{ YarnCategory, YarnProduct, YarnVariant \}/);
  assert.match(yarnAdapter, /\.eq\("category", "yarn"\)/);
  assert.match(yarnAdapter, /export const getAllYarnProducts/);
  assert.match(yarnAdapter, /export async function getYarnProductBySlug/);
  assert.doesNotMatch(yarnAdapter, /\.in\("category", \["yarn", "accessory"\]\)/);
});
