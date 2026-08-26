import assert from "node:assert/strict";
import test from "node:test";
import { siteConfig } from "@/data/site";
import {
  getYarnProductStructuredData,
  toAbsoluteUrl
} from "./YarnProductJsonLd";
import type { YarnProduct } from "@/types/yarn-product";

function makeProduct(images: string[]): YarnProduct {
  return {
    id: "product-schema-test",
    slug: "schema-test-yarn",
    name: "Sợi thử nghiệm",
    shortName: "Sợi thử nghiệm",
    category: "milk-cotton",
    description: "Mô tả thử nghiệm.",
    seoDescription: "Mô tả SEO thử nghiệm.",
    price: 42_000,
    weight: "50g",
    material: "Cotton",
    hookSize: "3 mm",
    origin: "Việt Nam",
    image: images[0] || "/images/yarn_collection_800.jpg",
    images,
    status: "available",
    updatedAt: "2026-08-11T00:00:00.000Z",
    variants: [{
      id: "variant-schema-test",
      colorCode: "#ffffff",
      colorName: "Trắng",
      image: images[0] || "/images/yarn_collection_800.jpg",
      hasOwnImage: true,
      stock: null,
      status: "available"
    }],
    wholesaleTiers: []
  };
}

function productNode(data: ReturnType<typeof getYarnProductStructuredData>) {
  const node = data["@graph"].find((entry) => entry["@type"] === "Product");
  assert.ok(node);
  return node as Record<string, unknown>;
}

test("YarnProductJsonLd preserves absolute images and resolves relative images", () => {
  const cloudinaryUrl = "https://res.cloudinary.com/example/image/upload/sample.jpg";
  assert.equal(toAbsoluteUrl(cloudinaryUrl), cloudinaryUrl);
  assert.equal(toAbsoluteUrl("/images/yarn_collection_800.jpg"), `${siteConfig.url}/images/yarn_collection_800.jpg`);
});

test("YarnProductJsonLd only emits supported Product and Offer claims", () => {
  const cloudinaryUrl = "https://res.cloudinary.com/example/image/upload/sample.jpg";
  const product = makeProduct([cloudinaryUrl, "/images/yarn_collection_800.jpg"]);
  const data = getYarnProductStructuredData(product);
  const node = productNode(data);
  const offer = node.offers as Record<string, unknown>;
  const serialized = JSON.stringify(data);

  assert.equal(data["@context"], "https://schema.org");
  assert.equal(node.name, product.name);
  assert.equal(node.url, `${siteConfig.url}/len-soi/${product.slug}`);
  assert.deepEqual(node.image, [cloudinaryUrl, `${siteConfig.url}/images/yarn_collection_800.jpg`]);
  assert.equal(offer.url, node.url);
  assert.equal(offer.price, product.price);
  assert.equal(offer.priceCurrency, "VND");
  assert.equal(offer.availability, "https://schema.org/InStock");
  assert.equal(offer.shippingDetails, undefined);
  assert.equal(offer.hasMerchantReturnPolicy, undefined);
  assert.equal(node.brand, undefined);
  assert.equal(offer.itemCondition, undefined);
  assert.doesNotMatch(serialized, /https:\/\/lentiny\.xyzhttps:\/\//);
});

test("YarnProductJsonLd breadcrumb matches the visible product hierarchy", () => {
  const product = makeProduct(["/images/yarn_collection_800.jpg"]);
  product.shortName = "Tên hiển thị";
  const data = getYarnProductStructuredData(product);
  const breadcrumbs = data["@graph"].find((entry) => entry["@type"] === "BreadcrumbList") as Record<string, unknown>;

  assert.deepEqual(breadcrumbs.itemListElement, [
    { "@type": "ListItem", position: 1, name: "Trang chủ", item: siteConfig.url },
    { "@type": "ListItem", position: 2, name: "Len sợi", item: `${siteConfig.url}/len-soi` },
    { "@type": "ListItem", position: 3, name: product.shortName, item: `${siteConfig.url}/len-soi/${product.slug}` }
  ]);
});
