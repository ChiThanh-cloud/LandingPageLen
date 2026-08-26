import assert from "node:assert/strict";
import test from "node:test";
import { siteConfig } from "@/data/site";
import type { YarnProduct } from "@/types/yarn-product";
import { getYarnCatalogStructuredData } from "./YarnCatalogJsonLd";

function makeProduct(overrides: Partial<YarnProduct>): YarnProduct {
  return {
    id: "catalog-item",
    slug: "catalog-item",
    name: "Len thử nghiệm",
    shortName: "Len thử nghiệm",
    category: "milk-cotton",
    description: "Mô tả thử nghiệm.",
    seoDescription: "Mô tả thử nghiệm.",
    price: 20_000,
    image: "/images/yarn_collection_800.jpg",
    images: ["/images/yarn_collection_800.jpg"],
    status: "available",
    updatedAt: "2026-08-11T00:00:00.000Z",
    variants: [],
    wholesaleTiers: [],
    ...overrides
  };
}

function graphNode(data: ReturnType<typeof getYarnCatalogStructuredData>, type: string) {
  return data["@graph"].find((entry) => entry["@type"] === type) as Record<string, unknown> | undefined;
}

test("YarnCatalogJsonLd builds an ItemList from the public rendered products", () => {
  const products = [
    makeProduct({ id: "first", slug: "milk-bo", name: "Milk Bò" }),
    makeProduct({ id: "second", slug: "nhung-dua", name: "Nhung Đũa" })
  ];
  const data = getYarnCatalogStructuredData(products);
  const itemList = graphNode(data, "ItemList");
  const breadcrumbs = graphNode(data, "BreadcrumbList");

  assert.equal(data["@context"], "https://schema.org");
  assert.ok(itemList);
  assert.equal(itemList.numberOfItems, products.length);
  assert.deepEqual(itemList.itemListElement, [
    { "@type": "ListItem", position: 1, name: "Milk Bò", url: `${siteConfig.url}/len-soi/milk-bo` },
    { "@type": "ListItem", position: 2, name: "Nhung Đũa", url: `${siteConfig.url}/len-soi/nhung-dua` }
  ]);
  assert.deepEqual(breadcrumbs?.itemListElement, [
    { "@type": "ListItem", position: 1, name: "Trang chủ", item: siteConfig.url },
    { "@type": "ListItem", position: 2, name: "Len sợi", item: `${siteConfig.url}/len-soi` }
  ]);
  assert.doesNotMatch(JSON.stringify(itemList), /aggregateRating|review|availability/i);
});

test("YarnCatalogJsonLd omits ItemList for an empty public catalog", () => {
  const data = getYarnCatalogStructuredData([]);

  assert.equal(graphNode(data, "ItemList"), undefined);
});
