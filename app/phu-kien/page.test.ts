import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { siteConfig } from "@/data/site";
import { metadata } from "./page";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

test("/phu-kien is an indexable accessory category using the shared catalog layout", () => {
  assert.equal(metadata.alternates?.canonical, `${siteConfig.url}/phu-kien`);
  assert.match(String(metadata.title), /Phụ kiện móc len/);
  assert.match(String(metadata.description), /kim móc|bông gòn|mắt thú/i);
  assert.match(source, /getAllAccessoryProducts/);
  assert.match(source, /className="yc-page"/);
  assert.match(source, /<CommerceCatalog products=\{products\} scope="accessory" heading="Phụ kiện đang bán" \/>/);
  assert.match(source, /<h1>Phụ kiện móc len – kim móc, bông gòn và dụng cụ<\/h1>/);
  assert.equal(source.match(/<h1(?:\s[^>]*)?>/g)?.length, 1);
});
