import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const page = read("./page.tsx");
const catalog = read("../../components/commerce/CommerceCatalog.tsx");
const yarnPage = read("../len-soi/page.tsx");
const yarnCatalog = read("../../components/yarn-product/YarnCatalog.tsx");

test("umbrella catalog uses the generic sellable adapter with the existing yarn visual system", () => {
  assert.match(page, /getAllSellableProducts/);
  assert.doesNotMatch(page, /getAllYarnProducts/);
  assert.match(page, /className="yc-page"/);
  assert.match(page, /<CommerceCatalog products=\{products\} scope="all" heading="Tất cả sản phẩm" \/>/);
  assert.ok(page.includes("const canonical = `${siteConfig.url}/len-soi-va-phu-kien`;"));
  assert.match(page, /alternates: \{ canonical \}/);
});

test("shared catalogs navigate top-level categories by canonical URLs and keep category-specific detail paths", () => {
  for (const source of [catalog, yarnCatalog]) {
    assert.match(source, /href="\/len-soi-va-phu-kien"/);
    assert.match(source, /href="\/len-soi"/);
    assert.match(source, /href="\/phu-kien"/);
  }
  assert.match(catalog, /getCommercePriceLabel\(product\)/);
  assert.match(catalog, /getCommerceOptionSummary\(product\)/);
  assert.match(catalog, /getCommerceProductPath\(product\)/);
  assert.match(catalog, /getAvailabilityCopy\(product\)/);
  assert.doesNotMatch(catalog, /Mã màu: Không có/);
});

test("existing yarn catalog SEO source remains dedicated to yarn", () => {
  assert.ok(yarnPage.includes("const canonical = `${siteConfig.url}/len-soi`;"));
  assert.match(yarnPage, /getAllYarnProducts/);
  assert.match(yarnPage, /YarnCatalogJsonLd/);
  assert.match(yarnPage, /YarnCatalogSeoContent/);
});
