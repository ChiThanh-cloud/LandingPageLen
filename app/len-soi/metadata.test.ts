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
  const title = stringValue(metadata.title);
  const description = stringValue(metadata.description);
  const openGraph = metadata.openGraph as { title?: unknown; description?: unknown; url?: unknown };
  const openGraphTitle = stringValue(openGraph.title);
  const openGraphDescription = stringValue(openGraph.description);
  const finalTitle = `${title} | ${siteConfig.name}`;

  assert.match(layoutSource, /template:\s*`%s \| \$\{siteConfig\.name\}`/);
  assert.doesNotMatch(title, new RegExp(siteConfig.name));
  assert.equal(finalTitle.split(siteConfig.name).length - 1, 1);
  assert.equal(openGraphTitle.split(siteConfig.name).length - 1, 1);
  assert.equal(openGraph.url, "/len-soi");
  assert.equal(metadata.alternates?.canonical, "/len-soi");
  assert.equal(metadata.twitter, undefined);

  for (const value of [description, openGraphDescription]) {
    assert.doesNotMatch(value, /Milk Cotton|Nhung Gấu|Cotton Việt Nam|24 màu|từ 18\.000|7\.000/i);
  }
});
