import assert from "node:assert/strict";
import test from "node:test";
import {
  isCommerceProductOrderable,
  isCommerceVariantOrderable
} from "./commerce-orderability";

test("product orderability follows the launch status contract", () => {
  assert.equal(isCommerceProductOrderable("out"), false);
  assert.equal(isCommerceProductOrderable("preorder"), true);
  assert.equal(isCommerceProductOrderable("available"), true);
  assert.equal(isCommerceProductOrderable(null), true);
  assert.equal(isCommerceProductOrderable("hidden"), false);
});

test("variant orderability follows the locked launch status contract", () => {
  assert.equal(isCommerceVariantOrderable("out"), false);
  assert.equal(isCommerceVariantOrderable("preorder"), true);
  assert.equal(isCommerceVariantOrderable("available"), true);
  assert.equal(isCommerceVariantOrderable(null), true);
  assert.equal(isCommerceVariantOrderable("hidden"), false);
});
