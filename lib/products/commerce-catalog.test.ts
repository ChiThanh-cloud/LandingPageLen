import assert from "node:assert/strict";
import test from "node:test";
import {
  filterCommerceProducts,
  getCommerceCategoryLabel,
  getCommerceDisplayPrice,
  getMinimumPublicCommercePrice,
  getCommerceOptionSummary,
  getCommercePriceLabel,
  getCommerceProductPath,
  getCommerceStatusLabel
} from "./commerce-catalog";
import type { CommerceProduct } from "@/types/commerce-product";

function product(overrides: Partial<CommerceProduct> = {}): CommerceProduct {
  return {
    id: "product-1",
    name: "Milk Bò",
    slug: "milk-bo",
    category: "yarn",
    subCategory: null,
    description: "",
    image: "https://res.cloudinary.com/tiny/image/upload/milk-bo.jpg",
    coverImage: null,
    price: 10000,
    unitLabel: "cuộn",
    optionLabel: "Màu",
    status: "available",
    sortOrder: 0,
    updatedAt: "2026-08-26T00:00:00.000Z",
    variants: [],
    ...overrides
  };
}

test("catalog filters keep only the requested sellable category", () => {
  const yarn = product();
  const accessory = product({
    id: "accessory-1",
    name: "Kim móc cán mềm",
    slug: "kim-moc-can-mem",
    category: "accessory",
    unitLabel: "cây",
    optionLabel: "Kích thước"
  });
  const products = [yarn, accessory];

  assert.deepEqual(filterCommerceProducts(products, "all"), products);
  assert.deepEqual(filterCommerceProducts(products, "yarn"), [yarn]);
  assert.deepEqual(filterCommerceProducts(products, "accessory"), [accessory]);
  assert.deepEqual(filterCommerceProducts([], "all"), []);
});

test("product detail paths are category-specific without creating a detail route", () => {
  assert.equal(getCommerceProductPath(product({ slug: "milk-bo" })), "/len-soi/milk-bo");
  assert.equal(getCommerceProductPath(product({ category: "accessory", slug: "kim-moc-can-mem" })), "/phu-kien/kim-moc-can-mem");
});

test("display price selects the lowest positive product or variant price", () => {
  assert.deepEqual(getCommerceDisplayPrice(product()), { amount: 10000, isFrom: false });
  assert.deepEqual(getCommerceDisplayPrice(product({ variants: [
    { ...product().variants[0], id: "v-1", productId: "product-1", name: "2.5mm", sku: null, price: 12000, stock: null, status: "available", sortOrder: 0, image: "", colorCode: null, colorName: null, colorHex: null },
    { ...product().variants[0], id: "v-2", productId: "product-1", name: "3mm", sku: null, price: 15000, stock: null, status: "available", sortOrder: 1, image: "", colorCode: null, colorName: null, colorHex: null }
  ] })), { amount: 10000, isFrom: true });
  assert.deepEqual(getCommerceDisplayPrice(product({ price: 20000, variants: [
    { id: "v-3", productId: "product-1", name: "2.5mm", sku: null, price: 15000, stock: null, status: "available", sortOrder: 0, image: "", colorCode: null, colorName: null, colorHex: null },
    { id: "v-4", productId: "product-1", name: "3mm", sku: null, price: 25000, stock: null, status: "available", sortOrder: 1, image: "", colorCode: null, colorName: null, colorHex: null }
  ] })), { amount: 15000, isFrom: true });
});

test("zero, negative, or null variant prices never become a 0đ display price", () => {
  const item = product({ variants: [
    { id: "v-0", productId: "product-1", name: "Mặc định", sku: null, price: 0, stock: null, status: "available", sortOrder: 0, image: "", colorCode: null, colorName: null, colorHex: null },
    { id: "v-negative", productId: "product-1", name: "Mặc định", sku: null, price: -1000, stock: null, status: "available", sortOrder: 1, image: "", colorCode: null, colorName: null, colorHex: null },
    { id: "v-null", productId: "product-1", name: "Mặc định", sku: null, price: null, stock: null, status: "available", sortOrder: 2, image: "", colorCode: null, colorName: null, colorHex: null }
  ] });

  assert.deepEqual(getCommerceDisplayPrice(item), { amount: 10000, isFrom: false });
  assert.equal(getCommercePriceLabel(item), "10.000đ / cuộn");
});

test("store minimum price uses only public orderable products and variants", () => {
  const visible = product({
    price: 20_000,
    variants: [
      { id: "hidden-low", productId: "product-1", name: "Ẩn", sku: null, price: 1_000, stock: 5, status: "hidden", sortOrder: 0, image: "", colorCode: null, colorName: null, colorHex: null },
      { id: "out-low", productId: "product-1", name: "Hết", sku: null, price: 2_000, stock: 5, status: "out", sortOrder: 1, image: "", colorCode: null, colorName: null, colorHex: null },
      { id: "stock-low", productId: "product-1", name: "Hết tồn", sku: null, price: 3_000, stock: 0, status: "available", sortOrder: 2, image: "", colorCode: null, colorName: null, colorHex: null },
      { id: "preorder", productId: "product-1", name: "Đặt trước", sku: null, price: 6_000, stock: null, status: "preorder", sortOrder: 3, image: "", colorCode: null, colorName: null, colorHex: null },
      { id: "invalid", productId: "product-1", name: "Giá lỗi", sku: null, price: Number.NaN, stock: 5, status: "available", sortOrder: 4, image: "", colorCode: null, colorName: null, colorHex: null }
    ]
  });

  assert.equal(getMinimumPublicCommercePrice([
    product({ id: "hidden", status: "hidden", price: 500 }),
    product({ id: "out", status: "out", price: 800 }),
    visible
  ]), 6_000);
  assert.equal(getMinimumPublicCommercePrice([
    product({ status: "out" }),
    product({ variants: [{ id: "only-out", productId: "product-1", name: "Hết", sku: null, price: 1_000, stock: 1, status: "out", sortOrder: 0, image: "", colorCode: null, colorName: null, colorHex: null }] })
  ]), null);

  assert.equal(getMinimumPublicCommercePrice([
    product({
      price: 5_000,
      variants: [
        { id: "available-6k", productId: "product-1", name: "6k", sku: null, price: 6_000, stock: 2, status: "available", sortOrder: 0, image: "", colorCode: null, colorName: null, colorHex: null },
        { id: "available-7k", productId: "product-1", name: "7k", sku: null, price: 7_000, stock: 2, status: "available", sortOrder: 1, image: "", colorCode: null, colorName: null, colorHex: null }
      ]
    })
  ]), 6_000);
});

test("unit and option labels are generic, including no-variant and nullable-stock products", () => {
  const hook = product({
    category: "accessory",
    unitLabel: "cây",
    optionLabel: "Kích thước",
    variants: [{ id: "hook-25", productId: "product-1", name: "2.5mm", sku: null, price: null, stock: null, status: "preorder", sortOrder: 0, image: "", colorCode: null, colorName: null, colorHex: null }]
  });

  assert.equal(getCommercePriceLabel(hook), "10.000đ / cây");
  assert.equal(getCommerceOptionSummary(hook), "1 Kích thước");
  assert.equal(getCommerceOptionSummary(product({ variants: [] })), "Chưa có lựa chọn");
  assert.equal(getCommerceCategoryLabel("yarn"), "Len sợi");
  assert.equal(getCommerceCategoryLabel("accessory"), "Phụ kiện");
  assert.equal(getCommerceStatusLabel("out"), "Hết hàng");
  assert.equal(getCommerceStatusLabel("preorder"), "Đặt trước");
  assert.equal(getCommerceStatusLabel("available"), null);
});
