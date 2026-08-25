import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { siteConfig } from "@/data/site";
import { metadata } from "./page";

function stringValue(value: unknown) {
  assert.equal(typeof value, "string");
  return value as string;
}

test("/len-soi metadata stays stable and resolves the site brand once", () => {
  const layoutSource = readFileSync(new URL("../layout.tsx", import.meta.url), "utf8");
  const pageSource = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
  const title = stringValue(metadata.title);
  const description = stringValue(metadata.description);
  const openGraph = metadata.openGraph as { title?: unknown; description?: unknown; url?: unknown };
  const openGraphTitle = stringValue(openGraph.title);
  const openGraphDescription = stringValue(openGraph.description);
  const robots = metadata.robots as { index?: unknown; follow?: unknown };
  const canonical = `${siteConfig.url}/len-soi`;
  const finalTitle = `${title} | ${siteConfig.name}`;

  assert.match(layoutSource, /template:\s*`%s \| \$\{siteConfig\.name\}`/);
  assert.equal(title, "Len Sợi Đan Móc – Bảng Màu & Giá Len");
  assert.doesNotMatch(title, new RegExp(siteConfig.name));
  assert.equal(finalTitle.split(siteConfig.name).length - 1, 1);
  assert.equal(openGraphTitle, finalTitle);
  assert.equal(openGraphTitle.split(siteConfig.name).length - 1, 1);
  assert.equal(openGraph.url, canonical);
  assert.equal(metadata.alternates?.canonical, canonical);
  assert.equal(openGraphDescription, description);
  assert.ok(description.length >= 140 && description.length <= 160);
  assert.equal(robots.index, true);
  assert.equal(robots.follow, true);
  assert.equal(metadata.twitter, undefined);
  assert.match(pageSource, /<h1>Len sợi đan móc – bảng màu, giá và các loại len đang bán<\/h1>/);
  assert.equal(pageSource.match(/<h1(?:\s[^>]*)?>/g)?.length, 1);

  for (const value of [description, openGraphDescription]) {
    assert.match(value, /Milk Bò|Milk Cotton Mác Đen|Nhung Đũa|Nhung Gấu/);
    assert.doesNotMatch(value, /rẻ nhất|chính hãng|số 1|giao toàn quốc|an toàn cho trẻ em/i);
  }
});
