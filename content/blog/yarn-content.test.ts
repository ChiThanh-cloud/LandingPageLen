import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getAllPostMetadata } from "@/lib/blog/get-all-posts";

const yarnPostSlugs = [
  "nguoi-moi-hoc-moc-len-nen-chon-loai-len-nao",
  "len-nhung-dua-la-gi-soi-6mm-100g-dung-kim-moc-bao-nhieu",
  "nhung-dua-va-nhung-gau-khac-nhau-the-nao",
  "milk-bo-va-milk-cotton-mac-den-khac-nhau-the-nao",
  "chon-kim-moc-bao-nhieu-cho-milk-bo-nhung-dua-nhung-gau-va-mac-den",
  "huong-dan-dat-len-tren-website-tiem-len-nha-tiny"
];

test("yarn blog cluster has valid public metadata and descriptive internal links", () => {
  const posts = getAllPostMetadata(new Date("2026-12-31T00:00:00+07:00"));
  const matching = posts.filter((post) => yarnPostSlugs.includes(post.slug));
  assert.equal(matching.length, yarnPostSlugs.length);
  assert.equal(new Set(matching.map((post) => post.slug)).size, yarnPostSlugs.length);
  assert.ok(matching.every((post) => post.status === "published" && post.description.trim() && post.h1.trim()));

  for (const slug of yarnPostSlugs) {
    const source = readFileSync(new URL(`./${slug}.mdx`, import.meta.url), "utf8");
    assert.match(source, /^---[\s\S]+?---/);
    assert.match(source, /\]\(\/len-soi(?:\/[^)]*)?\)/);
    assert.doesNotMatch(source, /ratingValue|aggregateRating|reviewCount/i);
  }
});

test("checkout guide reflects the live yarn checkout path without claiming a different flow", () => {
  const source = readFileSync(new URL("./huong-dan-dat-len-tren-website-tiem-len-nha-tiny.mdx", import.meta.url), "utf8");
  assert.match(source, /\]\(\/gio-hang\)/);
  assert.match(source, /\]\(\/thanh-toan\)/);
  assert.match(source, /thanh toán khi nhận hàng \(COD\)/i);
  assert.match(source, /chuyển khoản ngân hàng/i);
  assert.match(source, /đặt đơn thành công/i);
  assert.match(source, /mã đơn hàng/i);
  assert.match(source, /\]\(\/tra-cuu-don-hang\)/);
  assert.match(source, /mã đơn hàng và số điện thoại đặt hàng/i);
});
