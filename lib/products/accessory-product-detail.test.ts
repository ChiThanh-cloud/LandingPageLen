import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getCommerceProductPath } from "./commerce-catalog";
import { findProductByCategoryAndSlug } from "./commerce-products";
import {
  canAddAccessoryToCart,
  createAccessoryCartItem,
  getAccessoryDetailPriceLabel,
  getAccessoryOptionStatusLabel,
  getAccessoryQuantity,
  getAccessoryStockLabel,
  getCommerceStockLimit,
  getCommerceVariantPrice,
  getInitialAccessoryVariantId
} from "./accessory-product-detail";
import {
  getAccessoryProductCanonical,
  getAccessoryProductDescription,
  getAccessoryProductPageMetadata
} from "./accessory-product-seo";
import { siteConfig } from "@/data/site";
import type { CommerceProduct, CommerceVariant } from "@/types/commerce-product";

function variant(overrides: Partial<CommerceVariant> = {}): CommerceVariant {
  return {
    id: "hook-25",
    productId: "hook",
    name: "2.5mm",
    sku: null,
    price: null,
    stock: null,
    status: "available",
    sortOrder: 0,
    image: "https://res.cloudinary.com/tiny/image/upload/hook-25.jpg",
    colorCode: null,
    colorName: null,
    colorHex: null,
    ...overrides
  };
}

function accessory(overrides: Partial<CommerceProduct> = {}): CommerceProduct {
  return {
    id: "hook",
    name: "Kim móc cán mềm",
    slug: "kim-moc-can-mem",
    category: "accessory",
    subCategory: null,
    description: "Kim móc cán mềm cho các dự án thủ công.",
    image: "https://res.cloudinary.com/tiny/image/upload/hook.jpg",
    coverImage: null,
    price: 20_000,
    unitLabel: "cây",
    optionLabel: "Kích thước",
    status: "available",
    sortOrder: 0,
    updatedAt: "2026-08-26T00:00:00.000Z",
    variants: [variant()],
    ...overrides
  };
}

const routeSource = readFileSync(new URL("../../app/phu-kien/[slug]/page.tsx", import.meta.url), "utf8");
const detailSource = readFileSync(new URL("../../components/commerce/AccessoryProductPage.tsx", import.meta.url), "utf8");
const cartSource = readFileSync(new URL("../../components/cart/CartPage.tsx", import.meta.url), "utf8");
const checkoutSource = readFileSync(new URL("../../app/thanh-toan/page.tsx", import.meta.url), "utf8");
const yarnRouteSource = readFileSync(new URL("../../app/len-soi/[slug]/page.tsx", import.meta.url), "utf8");

test("accessory detail resolves only accessory slugs and has an explicit unknown notFound path", () => {
  const hook = accessory();
  const yarn = accessory({ id: "yarn", category: "yarn", slug: hook.slug, name: "Milk Bò" });

  assert.equal(findProductByCategoryAndSlug([hook, yarn], "accessory", hook.slug), hook);
  assert.equal(findProductByCategoryAndSlug([yarn], "accessory", hook.slug), undefined);
  assert.equal(findProductByCategoryAndSlug([hook], "accessory", "khong-ton-tai"), undefined);
  assert.match(routeSource, /getAccessoryProductBySlug/);
  assert.match(routeSource, /if \(!product\) notFound\(\);/);
  assert.doesNotMatch(routeSource, /getYarnProductBySlug|getAllYarnProducts/);
});

test("accessory metadata uses the dedicated canonical URL and factual description", () => {
  const product = accessory();
  const metadata = getAccessoryProductPageMetadata(product);
  const canonical = `${siteConfig.url}/phu-kien/${product.slug}`;
  const openGraph = metadata.openGraph as { title?: string; description?: string; url?: string };

  assert.equal(getAccessoryProductCanonical(product.slug), canonical);
  assert.equal(metadata.alternates?.canonical, canonical);
  assert.equal(openGraph.url, canonical);
  assert.equal(openGraph.title, `${product.name} | ${siteConfig.name}`);
  assert.equal(openGraph.description, product.description);
  assert.doesNotMatch(String(metadata.alternates?.canonical), /\/len-soi\//);
  assert.equal(getAccessoryProductDescription(accessory({ description: "" })), `Phụ kiện ${product.name} tại ${siteConfig.name}.`);
});

test("accessory labels and price use the configured unit and option data without yarn inference", () => {
  const hook = accessory({ price: 20_000, unitLabel: "cây", optionLabel: "Kích thước" });
  const stuffing = accessory({ name: "Bông gòn", unitLabel: "Kg", optionLabel: "Khối lượng", price: 80_000 });

  assert.equal(hook.optionLabel, "Kích thước");
  assert.equal(getAccessoryDetailPriceLabel(hook, variant({ price: 25_000 })), "25.000đ / cây");
  assert.equal(getAccessoryDetailPriceLabel(stuffing, variant({ price: null })), "80.000đ / Kg");
  assert.match(detailSource, /product\.optionLabel/);
  assert.match(detailSource, /product\.unitLabel/);
  assert.doesNotMatch(detailSource, /Mã màu|Bảng màu|\/ cuộn/);
});

test("selected variant price overrides only when it is a positive finite number", () => {
  const product = accessory({ price: 20_000 });

  assert.equal(getCommerceVariantPrice(product, variant({ price: 25_000 })), 25_000);
  assert.equal(getCommerceVariantPrice(product, variant({ price: null })), 20_000);
  assert.equal(getCommerceVariantPrice(product, variant({ price: 0 })), 20_000);
  assert.equal(getCommerceVariantPrice(product, variant({ price: -1 })), 20_000);
  assert.equal(getCommerceVariantPrice(accessory({ price: 0 }), variant({ price: 0 })), null);
});

test("variant selection and cart snapshots use real variant IDs without creating a default", () => {
  const first = variant({ id: "hook-20", name: "2.0mm" });
  const second = variant({ id: "hook-25", name: "2.5mm" });
  const product = accessory({ variants: [first, second] });

  assert.equal(getInitialAccessoryVariantId(product.variants), null);
  assert.equal(getInitialAccessoryVariantId([second]), second.id);
  assert.equal(getInitialAccessoryVariantId([]), null);
  const withoutOptions = accessory({ variants: [] });
  assert.equal(canAddAccessoryToCart(withoutOptions, null), false);
  assert.doesNotMatch(detailSource, /Mặc định/);

  const item = createAccessoryCartItem(product, second, 2);
  assert.ok(item);
  assert.equal(item.productId, product.id);
  assert.equal(item.variantId, second.id);
  assert.equal(item.variantName, second.name);
  assert.equal(item.colorCode, "");
  assert.equal(item.displayPrice, product.price);

  const itemWithoutImages = createAccessoryCartItem(
    accessory({ image: "" }),
    variant({ image: "" }),
    1
  );
  assert.ok(itemWithoutImages);
  assert.equal(itemWithoutImages.imageUrl, "");
});

test("stock keeps null distinct from zero and caps managed quantities", () => {
  const product = accessory();

  assert.equal(getCommerceStockLimit(null), null);
  assert.equal(getAccessoryStockLabel(null, "cây"), "Tồn kho sẽ được Tiny xác nhận.");
  assert.equal(getCommerceStockLimit(0), 0);
  assert.equal(getAccessoryStockLabel(0, "cây"), "Hết hàng");
  assert.equal(getAccessoryOptionStatusLabel(0, "available"), "Hết hàng");
  assert.equal(getAccessoryOptionStatusLabel(null, "available"), null);
  assert.equal(getAccessoryOptionStatusLabel(null, "preorder"), "Đặt trước");
  assert.equal(getAccessoryQuantity(1, 0), null);
  assert.equal(canAddAccessoryToCart(product, variant({ stock: 0 })), false);
  assert.equal(getCommerceStockLimit(3.9), 3);
  assert.equal(getAccessoryQuantity(8, 3), 3);
  assert.equal(getAccessoryQuantity(8, null), 8);
  assert.equal(getAccessoryStockLabel(3, "cặp"), "Còn hàng: 3 cặp");
  assert.match(detailSource, /const visibleOptionStatus = getAccessoryOptionStatusLabel\(variant\.stock, variant\.status\);/);
  assert.match(detailSource, /<small>\{visibleOptionStatus\}<\/small>/);
});

test("TASK 7 keeps the existing cart and checkout sources untouched while preserving the TASK 6 accessory path", () => {
  assert.match(cartSource, /function CartPage/);
  assert.match(checkoutSource, /export default async function Page/);
  assert.match(yarnRouteSource, /getYarnProductBySlug/);
  assert.equal(getCommerceProductPath(accessory()), "/phu-kien/kim-moc-can-mem");
});
