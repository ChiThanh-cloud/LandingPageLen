import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { siteConfig } from "@/data/site";
import { metadata } from "./page";
import { getAccessoryCatalogStructuredData } from "@/components/commerce/AccessoryCatalogJsonLd";
import type { CommerceProduct } from "@/types/commerce-product";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

test("/phu-kien is an indexable accessory category using the shared catalog layout", () => {
  assert.equal(metadata.alternates?.canonical, `${siteConfig.url}/phu-kien`);
  assert.match(String(metadata.title), /Phụ kiện móc len/);
  assert.match(String(metadata.description), /kim móc|bông gòn|mắt thú/i);
  assert.match(source, /getAllAccessoryProducts/);
  assert.match(source, /className="yc-page"/);
  assert.match(source, /<CommerceCatalog products=\{products\} scope="accessory" heading="Phụ kiện đang bán" \/>/);
  assert.match(source, /<AccessoryCatalogJsonLd products=\{products\} \/>/);
  assert.match(source, /<h1>Phụ kiện móc len – kim móc, bông gòn và dụng cụ<\/h1>/);
  assert.equal(source.match(/<h1(?:\s[^>]*)?>/g)?.length, 1);
});

test("/phu-kien category JSON-LD lists only public accessory URLs without product claims", () => {
  const base: CommerceProduct = {
    id: "hook",
    name: "Kim móc",
    slug: "kim-moc",
    category: "accessory",
    subCategory: null,
    description: "",
    image: "",
    coverImage: null,
    price: 20_000,
    unitLabel: "cây",
    optionLabel: "Kích thước",
    status: "available",
    sortOrder: 0,
    updatedAt: "2026-08-26T00:00:00.000Z",
    variants: []
  };
  const data = getAccessoryCatalogStructuredData([
    base,
    { ...base, id: "hidden", slug: "an", status: "hidden" },
    { ...base, id: "yarn", slug: "len", category: "yarn" }
  ]);
  const itemList = data["@graph"].find((entry) => entry["@type"] === "ItemList") as Record<string, unknown>;
  const serialized = JSON.stringify(data);

  assert.equal(itemList.numberOfItems, 1);
  assert.deepEqual(itemList.itemListElement, [{
    "@type": "ListItem",
    position: 1,
    name: "Kim móc",
    url: `${siteConfig.url}/phu-kien/kim-moc`
  }]);
  assert.doesNotMatch(serialized, /aggregateRating|review|availability/i);
  assert.doesNotMatch(serialized, /\/phu-kien\/an|\/phu-kien\/len/);
});
