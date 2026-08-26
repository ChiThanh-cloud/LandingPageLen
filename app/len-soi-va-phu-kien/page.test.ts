import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const page = read("./page.tsx");
const catalog = read("../../components/commerce/CommerceCatalog.tsx");
const yarnPage = read("../len-soi/page.tsx");

test("umbrella catalog route uses only the generic sellable-products adapter", () => {
  assert.match(page, /getAllSellableProducts/);
  assert.doesNotMatch(page, /getAllYarnProducts/);
  assert.match(page, /<h1>Cuộn len & phụ kiện<\/h1>/);
  assert.ok(page.includes("const canonical = `${siteConfig.url}/len-soi-va-phu-kien`;"));
  assert.match(page, /alternates: \{ canonical \}/);
});

test("umbrella catalog has accessible client-side sellable category filters and generic card wording", () => {
  for (const label of ["Tất cả", "Len sợi", "Phụ kiện"]) assert.match(catalog, new RegExp(`label: "${label}"`));
  assert.match(catalog, /aria-pressed=\{filter === item\.value\}/);
  assert.match(catalog, /filterCommerceProducts\(products, filter\)/);
  assert.match(catalog, /getCommercePriceLabel\(product\)/);
  assert.match(catalog, /getCommerceOptionSummary\(product\)/);
  assert.match(catalog, /getCommerceProductPath\(product\)/);
  assert.doesNotMatch(catalog, /Mã màu: Không có/);
});

test("existing yarn catalog SEO source remains unchanged by the umbrella route", () => {
  assert.ok(yarnPage.includes("const canonical = `${siteConfig.url}/len-soi`;"));
  assert.match(yarnPage, /getAllYarnProducts/);
  assert.match(yarnPage, /YarnCatalogJsonLd/);
});
