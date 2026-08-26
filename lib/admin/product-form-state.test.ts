import assert from "node:assert/strict";
import test from "node:test";
import { getProductFormLabels } from "./product-form-state";

test("new product category changes reset labels and restore yarn defaults", () => {
  assert.deepEqual(getProductFormLabels("handmade"), { unitLabel: "", optionLabel: "" });
  assert.deepEqual(getProductFormLabels("yarn"), { unitLabel: "cuộn", optionLabel: "Màu" });
  assert.deepEqual(getProductFormLabels("accessory"), { unitLabel: "", optionLabel: "" });
  assert.deepEqual(getProductFormLabels("yarn"), { unitLabel: "cuộn", optionLabel: "Màu" });
});

test("existing products load their own labels without hard-coding accessory defaults", () => {
  assert.deepEqual(getProductFormLabels("accessory", {
    category: "accessory",
    unit_label: "cặp",
    option_label: "Kích thước"
  }), { unitLabel: "cặp", optionLabel: "Kích thước" });
  assert.deepEqual(getProductFormLabels("yarn", {
    category: "yarn",
    unit_label: "cuộn 50g",
    option_label: "Màu len"
  }), { unitLabel: "cuộn 50g", optionLabel: "Màu len" });
  assert.deepEqual(getProductFormLabels("yarn", {
    category: "yarn",
    unit_label: null,
    option_label: "  "
  }), { unitLabel: "cuộn", optionLabel: "Màu" });
});
