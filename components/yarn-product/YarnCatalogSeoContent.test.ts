import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { yarnProducts } from "@/lib/products/yarn-products";
import { YarnCatalogSeoContent } from "./YarnCatalogSeoContent";

test("catalog SEO content is server-rendered from public product data", () => {
  const html = renderToStaticMarkup(createElement(YarnCatalogSeoContent, { products: yarnProducts }));

  assert.match(html, /Các loại len sợi đang bán tại Tiny/);
  assert.match(html, /Nên chọn loại len nào cho sản phẩm muốn móc\?/);
  assert.match(html, /Chọn cỡ kim móc theo loại len/);
  assert.match(html, /Bảng màu và giá len/);
  assert.match(html, /Câu hỏi thường gặp khi chọn len/);
  assert.doesNotMatch(html, /FAQPage|application\/ld\+json/);

  for (const product of yarnProducts) {
    assert.match(html, new RegExp(`/len-soi/${product.slug}`));
    assert.match(html, new RegExp(product.name));
    if (product.hookSize) assert.match(html, new RegExp(product.hookSize));
  }
});

test("catalog SEO content stays absent when no public product data is available", () => {
  assert.equal(renderToStaticMarkup(createElement(YarnCatalogSeoContent, { products: [] })), "");
});
