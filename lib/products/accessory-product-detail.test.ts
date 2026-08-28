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
  getInitialAccessoryVariantId,
  shouldShowAccessoryVariantSelector
} from "./accessory-product-detail";
import { getCommerceVariantPrice } from "./commerce-pricing";
import {
  getAccessoryAvailability,
  getAccessoryProductCanonical,
  getAccessoryProductDescription,
  getAccessoryProductPageMetadata,
  getAccessoryProductStructuredData,
  toAbsoluteAccessoryImageUrl
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
  assert.equal(
    getAccessoryProductDescription(accessory({ description: "" })),
    `${product.name} là phụ kiện móc len tại ${siteConfig.name}, bán theo cây. Xem giá và các lựa chọn kích thước đang hiển thị.`
  );
});

test("accessory Product JSON-LD uses only factual commerce fields and the visible breadcrumb hierarchy", () => {
  const product = accessory({
    variants: [
      variant({ id: "public", price: 25_000, stock: 2, image: "/images/yarn_collection_800.jpg" }),
      variant({ id: "hidden", status: "hidden", price: 1, stock: 100, image: "/images/hidden.jpg" })
    ]
  });
  const data = getAccessoryProductStructuredData(product);
  assert.ok(data);
  const productNode = data["@graph"].find((entry) => entry["@type"] === "Product") as Record<string, unknown>;
  const breadcrumbNode = data["@graph"].find((entry) => entry["@type"] === "BreadcrumbList") as Record<string, unknown>;
  const offer = productNode.offers as Record<string, unknown>;
  const canonical = `${siteConfig.url}/phu-kien/${product.slug}`;
  const serialized = JSON.stringify(data);

  assert.equal(productNode.name, product.name);
  assert.equal(productNode.url, canonical);
  assert.deepEqual(productNode.image, [
    product.image,
    `${siteConfig.url}/images/yarn_collection_800.jpg`
  ]);
  assert.equal(offer.price, 25_000);
  assert.equal(offer.priceCurrency, "VND");
  assert.equal(offer.availability, "https://schema.org/InStock");
  assert.deepEqual(breadcrumbNode.itemListElement, [
    { "@type": "ListItem", position: 1, name: "Trang chủ", item: siteConfig.url },
    { "@type": "ListItem", position: 2, name: "Phụ kiện", item: `${siteConfig.url}/phu-kien` },
    { "@type": "ListItem", position: 3, name: product.name, item: canonical }
  ]);
  assert.doesNotMatch(serialized, /aggregateRating|review|gtin|mpn|itemCondition|sku/i);
  assert.doesNotMatch(serialized, /hidden\.jpg/);
  assert.equal(toAbsoluteAccessoryImageUrl(product.image), product.image);
});

test("accessory Offer price uses only the variants represented by its purchasable availability", () => {
  const cases = [
    {
      product: accessory({
        price: 20_000,
        variants: [
          variant({ id: "out-low", status: "out", price: 1_000, stock: 3 }),
          variant({ id: "available", status: "available", price: 25_000, stock: 3 })
        ]
      }),
      price: 25_000,
      availability: "https://schema.org/InStock"
    },
    {
      product: accessory({
        price: 20_000,
        variants: [
          variant({ id: "available", status: "available", price: 25_000, stock: 3 }),
          variant({ id: "preorder-low", status: "preorder", price: 6_000, stock: null })
        ]
      }),
      price: 25_000,
      availability: "https://schema.org/InStock"
    },
    {
      product: accessory({
        price: 20_000,
        variants: [
          variant({ id: "zero-stock", status: "available", price: 2_000, stock: 0 }),
          variant({ id: "preorder", status: "preorder", price: 6_000, stock: null })
        ]
      }),
      price: 6_000,
      availability: "https://schema.org/PreOrder"
    },
    {
      product: accessory({
        price: 20_000,
        variants: [variant({ id: "fallback", status: "available", price: null, stock: 1 })]
      }),
      price: 20_000,
      availability: "https://schema.org/InStock"
    }
  ] as const;

  for (const item of cases) {
    const data = getAccessoryProductStructuredData(item.product);
    assert.ok(data);
    const productNode = data["@graph"].find((entry) => entry["@type"] === "Product") as Record<string, unknown>;
    const offer = productNode.offers as Record<string, unknown>;
    assert.equal(offer.price, item.price);
    assert.equal(offer.availability, item.availability);
  }
});

test("accessory availability reflects product, variant, stock, preorder, and hidden states", () => {
  assert.equal(getAccessoryAvailability(accessory()), "InStock");
  assert.equal(getAccessoryAvailability(accessory({ status: "out" })), "OutOfStock");
  assert.equal(getAccessoryAvailability(accessory({ status: "preorder" })), "PreOrder");
  assert.equal(getAccessoryAvailability(accessory({ variants: [variant({ stock: 0 })] })), "OutOfStock");
  assert.equal(getAccessoryAvailability(accessory({ variants: [variant({ status: "preorder" })] })), "PreOrder");
  assert.equal(getAccessoryAvailability(accessory({ status: "hidden" })), null);
  assert.equal(getAccessoryProductStructuredData(accessory({ status: "hidden" })), null);
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

test("accessory detail renders Product JSON-LD and a breadcrumb matching /phu-kien", () => {
  assert.match(routeSource, /AccessoryProductJsonLd product=\{product\}/);
  assert.match(detailSource, /<Link href="\/phu-kien">Phụ kiện<\/Link>/);
  assert.doesNotMatch(detailSource, /<Link href="\/len-soi-va-phu-kien">Cuộn len/);
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

test("singleton accessory hides its selector while multiple options require a choice", () => {
  const first = variant({ id: "hook-20", name: "2.0mm" });
  const second = variant({ id: "hook-25", name: "2.5mm" });

  assert.equal(shouldShowAccessoryVariantSelector([]), false);
  assert.equal(shouldShowAccessoryVariantSelector([first]), false);
  assert.equal(getInitialAccessoryVariantId([first]), first.id);
  assert.equal(shouldShowAccessoryVariantSelector([first, second]), true);
  assert.equal(getInitialAccessoryVariantId([first, second]), null);
  assert.match(detailSource, /showVariantSelector \? \([\s\S]*?<fieldset className=\{styles\.variants\}/);
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

test("accessory product status blocks out and preserves preorder ordering", () => {
  const out = accessory({ status: "out" });
  const preorder = accessory({ status: "preorder" });
  const selected = variant({ stock: null });

  assert.equal(canAddAccessoryToCart(out, selected), false);
  assert.equal(createAccessoryCartItem(out, selected, 1), null);
  assert.equal(canAddAccessoryToCart(preorder, selected), true);
  assert.ok(createAccessoryCartItem(preorder, selected, 1));
  assert.match(detailSource, /getCommerceStatusLabel\(product\.status\)/);
  assert.match(detailSource, /disabled=\{!canAdd\}/);
});

test("accessory variant status blocks out, permits preorder, and keeps zero-stock priority", () => {
  const product = accessory();
  const out = variant({ status: "out", stock: 3 });
  const preorder = variant({ status: "preorder", stock: 3 });
  const preorderWithoutStock = variant({ status: "preorder", stock: 0 });

  assert.equal(canAddAccessoryToCart(product, out), false);
  assert.equal(createAccessoryCartItem(product, out, 1), null);
  assert.equal(canAddAccessoryToCart(product, preorder), true);
  assert.ok(createAccessoryCartItem(product, preorder, 1));
  assert.equal(canAddAccessoryToCart(product, preorderWithoutStock), false);
  assert.equal(getAccessoryOptionStatusLabel(0, "preorder"), "Hết hàng");
  assert.match(detailSource, /!isCommerceVariantOrderable\(variant\.status\)/);
  assert.match(detailSource, /disabled=\{isOutOfStock\}/);
});

test("TASK 8 preserves TASK 7 accessory detail behavior while making cart and checkout generic", () => {
  assert.match(cartSource, /CommerceProduct\[\]/);
  assert.match(checkoutSource, /getAllSellableProducts/);
  assert.match(yarnRouteSource, /getYarnProductBySlug/);
  assert.equal(getCommerceProductPath(accessory()), "/phu-kien/kim-moc-can-mem");
  assert.match(detailSource, /createAccessoryCartItem/);
});
