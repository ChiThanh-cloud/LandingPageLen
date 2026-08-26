import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("home and header preserve yarn authority while sending umbrella commerce intent to the generic catalog", () => {
  const header = source("../components/layout/Header.tsx");
  const footer = source("../components/layout/Footer.tsx");
  const homepage = source("../components/home/ProductShowcase.tsx");
  const productInfo = source("../components/yarn-product/ProductInfo.tsx");

  assert.match(header, /href: "\/len-soi", label: "Len sợi"/);
  assert.match(header, /href: "\/len-soi-va-phu-kien", label: "Sản phẩm"/);
  assert.match(footer, /<Link href="\/len-soi">Len sợi &amp; bảng màu<\/Link>/);
  assert.match(homepage, /title: "Cuộn len & phụ kiện"/);
  assert.match(homepage, /detailHref: "\/len-soi-va-phu-kien"/);
  assert.match(homepage, /Xem len & phụ kiện/);
  assert.doesNotMatch(homepage, /href="\/len-soi"|Xem bảng màu và giá len/);
  assert.match(productInfo, /<Link href="\/len-soi">Len sợi<\/Link>/);
});

test("yarn guidance posts include contextual links to the catalog", () => {
  const posts = [
    "../content/blog/chon-kim-moc-bao-nhieu-cho-milk-bo-nhung-dua-nhung-gau-va-mac-den.mdx",
    "../content/blog/len-nhung-dua-la-gi-soi-6mm-100g-dung-kim-moc-bao-nhieu.mdx",
    "../content/blog/nhung-dua-va-nhung-gau-khac-nhau-the-nao.mdx",
    "../content/blog/milk-bo-va-milk-cotton-mac-den-khac-nhau-the-nao.mdx"
  ];

  for (const post of posts) assert.match(source(post), /\[[^\]]+\]\(\/len-soi\)/);
});
