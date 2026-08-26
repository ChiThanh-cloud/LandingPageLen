import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  isCommerceProductOrderable,
  isCommerceVariantOrderable
} from "../../lib/products/commerce-orderability";
import { getCommerceVariantPrice } from "../../lib/products/commerce-pricing";

const actions = readFileSync(new URL("./ProductActions.tsx", import.meta.url), "utf8");
const info = readFileSync(new URL("./ProductInfo.tsx", import.meta.url), "utf8");
const mapper = readFileSync(new URL("../../lib/products/supabase-products.ts", import.meta.url), "utf8");
const selector = readFileSync(new URL("./VariantSelector.tsx", import.meta.url), "utf8");
const page = readFileSync(new URL("./YarnProductPage.tsx", import.meta.url), "utf8");

test("yarn product actions enforce both product and variant status", () => {
  assert.equal(isCommerceProductOrderable("out"), false);
  assert.equal(isCommerceProductOrderable("preorder"), true);
  assert.equal(isCommerceVariantOrderable("out"), false);
  assert.equal(isCommerceVariantOrderable("preorder"), true);
  assert.match(actions, /!isCommerceProductOrderable\(product\.status\)/);
  assert.match(actions, /!isCommerceVariantOrderable\(variant\.status\)/);
  assert.match(actions, /variant\.stock === 0/);
});

test("yarn selector disables and labels out variants while leaving preorder selectable", () => {
  assert.match(selector, /variant\.status === "out"[\s\S]*"Hết hàng"/);
  assert.match(selector, /!isCommerceVariantOrderable\(variant\.status\)/);
  assert.match(selector, /getCommerceStatusLabel\(variant\.status\)/);
  assert.match(selector, /visibleStatus/);
  assert.match(page, /isCommerceVariantOrderable\(variant\.status\)/);
});

test("yarn cart snapshots use the shared positive variant-price priority", () => {
  const product = { price: 20_000 };
  assert.equal(getCommerceVariantPrice(product, { price: 25_000 }), 25_000);
  assert.equal(getCommerceVariantPrice(product, { price: 0 }), 20_000);
  assert.equal(getCommerceVariantPrice(product, { price: -5_000 }), 20_000);
  assert.match(actions, /displayPrice = getCommerceVariantPrice\(product, variant\)/);
  assert.doesNotMatch(actions, /variant\.price \?\? product\.price/);
});

test("yarn mapper and visible product information expose product and variant status", () => {
  assert.equal((mapper.match(/status: row\.status/g) || []).length, 2);
  assert.match(info, /getCommerceStatusLabel\(product\.status\)/);
  assert.match(info, /\{statusLabel\}/);
});
