import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getYarnProductStructuredData } from "@/components/yarn-product/YarnProductJsonLd";
import { siteConfig } from "@/data/site";
import { yarnProducts } from "@/lib/products/yarn-products";
import type { YarnProduct } from "@/types/yarn-product";
import {
  getPrimaryYarnNavigationLinks,
  getRelatedYarnProducts,
  getYarnProductSeoContent
} from "./yarn-product-content";
import {
  getYarnProductHeading,
  getYarnProductGalleryImageAlt,
  getYarnProductImageAlt,
  getYarnCatalogStartingPrice,
  getYarnProductPageMetadata,
  getYarnProductSeoMetadata,
  getYarnProductStartingPrice,
  getYarnProductVisibleColorCount
} from "./yarn-product-seo";

function product(overrides: Partial<YarnProduct> = {}): YarnProduct {
  return {
    id: "future-yarn",
    slug: "future-yarn",
    name: "Sợi Thử Nghiệm",
    shortName: "Sợi Thử Nghiệm",
    category: "len-dac-biet",
    description: "Thông số do catalog công bố.",
    seoDescription: "Thông số do catalog công bố.",
    price: 12_000,
    weight: "75g ±3g",
    yarnSize: "3mm",
    material: "100% Cotton",
    hookSize: "3–4mm",
    image: "/images/yarn_collection_800.jpg",
    images: ["/images/yarn_collection_800.jpg"],
    updatedAt: "2026-08-14T00:00:00.000Z",
    variants: [],
    wholesaleTiers: [],
    ...overrides
  };
}

test("four static fallback yarn products retain only the owner-approved facts", () => {
  const facts = yarnProducts.map((item) => [item.slug, item.name, item.weight, item.yarnSize, item.material, item.hookSize]);
  assert.deepEqual(facts, [
    ["milk-bo", "Milk Bò", "50g ±2g", "2.5mm", "80% Cotton + 20% Milk Protein", "2.5–3mm"],
    ["nhung-dua", "Nhung Đũa", "100g ±10g", "6mm", "100% Polyester", "6–9mm"],
    ["nhung-gau", "Nhung Gấu", "50g ±2g", "2.5mm", "100% Polyester", "2.5–3mm"],
    ["mac-den", "Milk Cotton Mác Đen 50g", "50g ±2g", "2mm", "80% Cotton + 20% Milk Protein", "2.5–3mm"]
  ]);
  assert.ok(yarnProducts.every((item) => item.origin === undefined));
  const descriptions = yarnProducts.map((item) => getYarnProductSeoMetadata(item).description);
  assert.equal(new Set(descriptions).size, yarnProducts.length);
  assert.ok(descriptions.every((description) => description.length <= 160));
});

test("yarn size and material are distinct fields and optional specifications are omitted", () => {
  const item = product({ yarnSize: "3mm", material: "100% Cotton", origin: null });
  assert.notEqual(item.yarnSize, item.material);
  const source = readFileSync(new URL("../../components/yarn-product/ProductDescription.tsx", import.meta.url), "utf8");
  assert.match(source, /\["Độ dày sợi", product\.yarnSize\]/);
  assert.match(source, /\["Thành phần", product\.material\]/);
  assert.match(source, /product\.origin\?\.trim\(\)/);
});

test("H1 helper is data driven, keeps the exact four headings, and has no duplicate Len prefix", () => {
  const headings = yarnProducts.map(getYarnProductHeading);
  assert.deepEqual(headings, [
    "Len Milk Bò 50g 2.5mm – Bảng màu & Giá",
    "Len Nhung Đũa 100g 6mm – Bảng màu & Giá",
    "Len Nhung Gấu 50g 2.5mm – Bảng màu & Giá",
    "Len Milk Cotton Mác Đen 50g 2mm – Bảng màu & Giá"
  ]);
  assert.deepEqual(getYarnProductHeading(product()), "Len Sợi Thử Nghiệm 75g 3mm – Bảng màu & Giá");
  assert.equal(getYarnProductImageAlt(yarnProducts[3]), "Len Milk Cotton Mác Đen 50g 2mm");
  assert.ok(headings.every((heading) => !heading.includes("Len Len")));
});

test("H1 helper avoids duplicate weight and yarn-size facts, including spaced units", () => {
  assert.equal(
    getYarnProductHeading(product({ name: "Sợi Baby 3mm", shortName: "Sợi Baby 3mm", weight: null, yarnSize: "3 mm" })),
    "Len Sợi Baby 3mm – Bảng màu & Giá"
  );
  assert.equal(
    getYarnProductHeading(product({ name: "Sợi Baby 50 g", shortName: "Sợi Baby 50 g", weight: "50g ±2g", yarnSize: null })),
    "Len Sợi Baby 50 g – Bảng màu & Giá"
  );
  assert.equal(
    getYarnProductHeading(product({ name: "Sợi Baby 50g 3 mm", shortName: "Sợi Baby", weight: "50g ±2g", yarnSize: "3mm" })),
    "Len Sợi Baby 50g 3 mm – Bảng màu & Giá"
  );
  assert.equal(
    getYarnProductHeading(product({ name: "Sợi Baby", shortName: "Sợi Baby", weight: "50g ±2g", yarnSize: "3mm" })),
    "Len Sợi Baby 50g 3mm – Bảng màu & Giá"
  );
});

test("visible color count is derived from public variants, not a hard-coded catalog number", () => {
  const item = product({ variants: [
    { id: "a", colorCode: "A", colorName: "A", image: "/a.jpg", hasOwnImage: true, stock: 1 },
    { id: "b", colorCode: "B", colorName: "B", image: "/b.jpg", hasOwnImage: true, stock: 0 },
    { id: "c", colorCode: "C", colorName: "C", image: "/c.jpg", hasOwnImage: true, stock: null }
  ] });
  assert.equal(getYarnProductVisibleColorCount(item), 3);
  assert.match(getYarnProductSeoMetadata(item).description, /3 mã màu đang hiển thị/);
});

test("purchasable starting price excludes unavailable variants and falls back per purchasable variant", () => {
  const item = product({ variants: [
    { id: "available", colorCode: "A", colorName: "Màu A", image: "/a.jpg", hasOwnImage: true, price: 17_000, stock: 1 },
    { id: "unavailable", colorCode: "B", colorName: "Màu B", image: "/b.jpg", hasOwnImage: true, price: 16_000, stock: 0 },
    { id: "unknown-stock", colorCode: "C", colorName: "Màu C", image: "/c.jpg", hasOwnImage: true, price: 18_000, stock: null }
  ] });
  const fallbackItem = product({ variants: [
    { id: "fallback", colorCode: "F", colorName: "Màu F", image: "/f.jpg", hasOwnImage: true, price: null, stock: 1 }
  ] });

  assert.equal(getYarnProductStartingPrice(item), 17_000);
  assert.equal(getYarnProductStartingPrice(fallbackItem), fallbackItem.price);
});

test("starting-price display uses only public retail variants and handles unavailable products truthfully", () => {
  const availableItem = product({ variants: [
    { id: "lower", colorCode: "L", colorName: "Màu L", image: "/l.jpg", hasOwnImage: true, price: 9_000, stock: 2 }
  ], wholesaleTiers: [{ minQuantity: 20, price: 1_000, label: "Giá sỉ" }] });
  const unavailableItem = product({ variants: [
    { id: "sold-out", colorCode: "S", colorName: "Màu S", image: "/s.jpg", hasOwnImage: true, price: 9_000, stock: 0 }
  ] });
  const adapterSource = readFileSync(new URL("./supabase-products.ts", import.meta.url), "utf8");

  assert.equal(getYarnProductStartingPrice(availableItem), 9_000);
  assert.equal(getYarnProductStartingPrice(unavailableItem), null);
  assert.match(adapterSource, /\.filter\(\(variant\) => variant\.status !== "hidden"\)/);
  assert.doesNotMatch(JSON.stringify(getYarnProductSeoMetadata(unavailableItem)), /Giá từ\s*\d/i);

  const unavailableStructuredData = getYarnProductStructuredData(unavailableItem);
  const unavailableProductNode = unavailableStructuredData["@graph"].find((entry) => entry["@type"] === "Product") as Record<string, unknown>;
  const unavailableOffer = unavailableProductNode.offers as Record<string, unknown>;
  assert.equal(unavailableOffer.price, unavailableItem.price);
  assert.equal(unavailableOffer.availability, "https://schema.org/OutOfStock");
});

test("metadata and Product JSON-LD share the factual description and the same purchasable starting price", () => {
  const item = product({ variants: [
    { id: "lower", colorCode: "L", colorName: "Màu L", image: "/l.jpg", hasOwnImage: true, price: 9_000, stock: 2 }
  ] });
  const seo = getYarnProductSeoMetadata(item);
  const metadata = getYarnProductPageMetadata(item);
  const structuredData = getYarnProductStructuredData(item);
  const productNode = structuredData["@graph"].find((entry) => entry["@type"] === "Product") as Record<string, unknown>;
  const offer = productNode.offers as Record<string, unknown>;

  assert.equal(getYarnProductStartingPrice(item), 9_000);
  assert.match(seo.description, /Giá từ 9\.000đ\/cuộn/);
  assert.equal(productNode.description, seo.description);
  assert.equal(offer.price, 9_000);
  assert.equal(offer.availability, "https://schema.org/InStock");
  assert.equal(productNode.material, "100% Cotton");
  assert.equal(JSON.stringify(structuredData).match(/AggregateRating|Review/g), null);
  assert.equal(metadata.description, seo.description);
  assert.ok(!/mềm|xốp|thú bông|đứng form/i.test(seo.description));
});

test("catalog price is derived from purchasable product prices and no catalog copy hard-codes 7.000đ", () => {
  const available = product({ variants: [
    { id: "available", colorCode: "A", colorName: "Màu A", image: "/a.jpg", hasOwnImage: true, price: 17_000, stock: 1 }
  ] });
  const lowerButUnavailable = product({ id: "sold-out", slug: "sold-out", variants: [
    { id: "sold-out-variant", colorCode: "S", colorName: "Màu S", image: "/s.jpg", hasOwnImage: true, price: 7_000, stock: 0 }
  ] });
  const source = readFileSync(new URL("../../app/len-soi/page.tsx", import.meta.url), "utf8");

  assert.equal(getYarnCatalogStartingPrice([available, lowerButUnavailable]), 17_000);
  assert.equal(getYarnCatalogStartingPrice([lowerButUnavailable]), null);
  assert.match(source, /getYarnCatalogStartingPrice\(products\)/);
  assert.doesNotMatch(source, /7\.000đ/);
});

test("variant gallery alt uses color metadata only for its displayed own image", () => {
  const item = product();
  assert.equal(getYarnProductImageAlt(item, { colorCode: "A12", colorName: "Hồng phấn" }), "Len Sợi Thử Nghiệm 75g 3mm – mã màu A12");
  assert.equal(getYarnProductImageAlt(item, { colorCode: "", colorName: "Hồng phấn" }), "Len Sợi Thử Nghiệm 75g 3mm – Hồng phấn");
  assert.equal(getYarnProductImageAlt(item), "Len Sợi Thử Nghiệm 75g 3mm");

  const ownVariant = { id: "17", colorCode: "17", colorName: "Hồng", image: "/images/variant-17.webp", hasOwnImage: true, stock: 1 };
  const fallbackVariant = { id: "18", colorCode: "18", colorName: "Kem", image: item.image, hasOwnImage: false, stock: 1 };

  assert.equal(getYarnProductGalleryImageAlt(item, ownVariant.image, ownVariant), "Len Sợi Thử Nghiệm 75g 3mm – mã màu 17");
  assert.equal(getYarnProductGalleryImageAlt(item, item.image, fallbackVariant), "Len Sợi Thử Nghiệm 75g 3mm");
  assert.equal(getYarnProductGalleryImageAlt(item, "/images/another-gallery.webp", ownVariant), "Len Sợi Thử Nghiệm 75g 3mm");
});

test("Next metadata uses the title template once and product route calls production helper", () => {
  const metadata = getYarnProductPageMetadata(product());
  const title = metadata.title as string;
  const finalTitle = `${title} | ${siteConfig.name}`;
  assert.equal(finalTitle.split(siteConfig.name).length - 1, 1);
  assert.equal((metadata.openGraph as { title: string }).title, finalTitle);

  const routeSource = readFileSync(new URL("../../app/len-soi/[slug]/page.tsx", import.meta.url), "utf8");
  assert.match(routeSource, /return getYarnProductPageMetadata\(product\);/);
});

test("page copy, related products, and product images stay crawlable and data driven", () => {
  const seoContent = readFileSync(new URL("../../components/yarn-product/ProductSeoContent.tsx", import.meta.url), "utf8");
  const related = readFileSync(new URL("../../components/yarn-product/RelatedProducts.tsx", import.meta.url), "utf8");
  const gallery = readFileSync(new URL("../../components/yarn-product/ProductGallery.tsx", import.meta.url), "utf8");
  assert.match(seoContent, /getYarnProductVisibleColorCount/);
  assert.match(seoContent, /getYarnProductSeoContent/);
  assert.match(seoContent, /<Link href=\{article\.href\}>/);
  assert.match(related, /<Link href=\{`\/len-soi\/\$\{product\.slug\}`\}/);
  assert.match(gallery, /getYarnProductGalleryImageAlt\(product, mainImage, selectedVariant\)/);
});

test("each approved yarn product receives its own contextual blog links", () => {
  const linksBySlug = Object.fromEntries(
    yarnProducts.map((item) => [item.slug, getYarnProductSeoContent(item).articles.map((article) => article.href)])
  );

  assert.deepEqual(linksBySlug["nhung-dua"], [
    "/blog/len-nhung-dua-la-gi-soi-6mm-100g-dung-kim-moc-bao-nhieu",
    "/blog/nhung-dua-va-nhung-gau-khac-nhau-the-nao",
    "/blog/chon-kim-moc-bao-nhieu-cho-milk-bo-nhung-dua-nhung-gau-va-mac-den"
  ]);
  assert.deepEqual(linksBySlug["nhung-gau"], [
    "/blog/nhung-dua-va-nhung-gau-khac-nhau-the-nao",
    "/blog/chon-kim-moc-bao-nhieu-cho-milk-bo-nhung-dua-nhung-gau-va-mac-den",
    "/blog/nguoi-moi-hoc-moc-len-nen-chon-loai-len-nao"
  ]);
  assert.deepEqual(linksBySlug["milk-bo"], [
    "/blog/milk-bo-va-milk-cotton-mac-den-khac-nhau-the-nao",
    "/blog/chon-kim-moc-bao-nhieu-cho-milk-bo-nhung-dua-nhung-gau-va-mac-den",
    "/blog/nguoi-moi-hoc-moc-len-nen-chon-loai-len-nao"
  ]);
  assert.deepEqual(linksBySlug["mac-den"], [
    "/blog/milk-bo-va-milk-cotton-mac-den-khac-nhau-the-nao",
    "/blog/chon-kim-moc-bao-nhieu-cho-milk-bo-nhung-dua-nhung-gau-va-mac-den"
  ]);
});

test("related yarn products rank same category, then same material, then catalog fallback", () => {
  const nhungDua = yarnProducts.find((item) => item.slug === "nhung-dua");
  const milkBo = yarnProducts.find((item) => item.slug === "milk-bo");
  assert.ok(nhungDua);
  assert.ok(milkBo);

  assert.deepEqual(getRelatedYarnProducts(nhungDua, yarnProducts).map((item) => item.slug), [
    "nhung-gau",
    "milk-bo",
    "mac-den"
  ]);
  assert.deepEqual(getRelatedYarnProducts(milkBo, yarnProducts).map((item) => item.slug), [
    "mac-den",
    "nhung-dua",
    "nhung-gau"
  ]);

  const futurePolyester = product({ category: "len-baby", material: "100% Polyester" });
  assert.deepEqual(getRelatedYarnProducts(futurePolyester, yarnProducts, 2).map((item) => item.slug), [
    "nhung-dua",
    "nhung-gau"
  ]);
});

test("footer product links are limited to catalog products that actually exist", () => {
  assert.deepEqual(getPrimaryYarnNavigationLinks(yarnProducts), [
    { href: "/len-soi/nhung-dua", label: "Len Nhung Đũa" },
    { href: "/len-soi/nhung-gau", label: "Len Nhung Gấu" },
    { href: "/len-soi/milk-bo", label: "Len Milk Bò" },
    { href: "/len-soi/mac-den", label: "Milk Cotton Mác Đen" }
  ]);
  assert.deepEqual(getPrimaryYarnNavigationLinks(yarnProducts.filter((item) => item.slug === "milk-bo")), [
    { href: "/len-soi/milk-bo", label: "Len Milk Bò" }
  ]);
});
