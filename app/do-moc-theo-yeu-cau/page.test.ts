import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("custom crochet service has one canonical route and keeps commerce out", () => {
  const page = source("./page.tsx");
  const header = source("../../components/layout/Header.tsx");
  const homepage = source("../../components/home/ProductShowcase.tsx");
  const redirects = source("../../next.config.mjs");
  const productRoute = source("../san-pham/[slug]/page.tsx");

  assert.match(page, /const canonicalPath = "\/do-moc-theo-yeu-cau"/);
  assert.match(page, /getHandmadePortfolio/);
  assert.match(page, /const portfolio = await getHandmadePortfolio\(\)/);
  assert.match(page, /portfolio\.slice\(0, 3\)/);
  assert.doesNotMatch(page, /portfolio\.slice\(0, 4\)/);
  assert.match(page, /<HandmadePortfolioGallery items=\{portfolio\} \/>/);
  assert.match(page, /width: 800,[\s\S]*?height: 600/);
  assert.doesNotMatch(page, /Thêm vào giỏ|Mua ngay|priceCurrency|offers:/);

  assert.match(header, /href: "\/do-moc-theo-yeu-cau", label: "Đặt theo yêu cầu"/);
  assert.match(homepage, /detailHref: "\/do-moc-theo-yeu-cau"/);
  assert.match(homepage, /product\.type === "yarn" \|\| product\.type === "handmade"/);

  assert.match(
    redirects,
    /source: "\/san-pham\/thu-len-theo-yeu-cau"[\s\S]*?destination: "\/do-moc-theo-yeu-cau"[\s\S]*?permanent: true/
  );
  assert.match(productRoute, /product\.slug !== "thu-len-theo-yeu-cau"/);
});
