import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getProductRevalidationPaths } from "./product-revalidation";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const actions = read("../../app/admin/(protected)/san-pham/actions.ts");
const productManager = read("../../components/admin/ProductManager.tsx");

test("admin category contract accepts accessory without dropping existing categories", () => {
  assert.match(actions, /z\.enum\(\["handmade", "yarn", "accessory", "set", "gift"\]\)/);
  assert.match(productManager, /accessory: "Phụ kiện"/);
});

test("online product labels are required, trimmed, and yarn keeps null-safe defaults", () => {
  assert.match(actions, /unitLabel: z\.string\(\)\.trim\(\)\.max\(80\)\.nullable\(\)/);
  assert.match(actions, /optionLabel: z\.string\(\)\.trim\(\)\.max\(120\)\.nullable\(\)/);
  assert.match(actions, /if \(isOnlineProduct && \(!unitLabel \|\| !optionLabel\)\)/);
  assert.match(actions, /parsed\.data\.unitLabel \|\| "cuộn"/);
  assert.match(actions, /parsed\.data\.optionLabel \|\| "Màu"/);
  assert.match(actions, /unit_label: unitLabel,[\s\S]*option_label: optionLabel/);
  assert.match(productManager, /Đơn vị bán/);
  assert.match(productManager, /Tên lựa chọn/);
  assert.match(productManager, /Milk Bò\/Nhung Gấu: cuộn; kim móc\/kim khâu: cây; bông gòn: Kg; mắt thú: cặp/);
});

test("new accessory slugs are stable while existing product slugs are never regenerated", () => {
  assert.match(actions, /if \(parsed\.data\.id === "" && isOnlineProduct\)/);
  assert.match(actions, /slugifyProductName\(parsed\.data\.slug \|\| parsed\.data\.name\)/);
  assert.match(actions, /insertPayload = \{ \.\.\.payload, slug: stableSlug \}/);
  assert.match(actions, /: client\.from\("products"\)\.update\(payload\)\.eq\("id", parsed\.data\.id\)/);
  assert.match(productManager, /name="slug"[\s\S]*readOnly=\{Boolean\(selected\)\}/);
});

test("variant editor allows yarn and accessory but keeps protected categories out", () => {
  assert.match(productManager, /selected\?\.category === "yarn" \|\| selected\?\.category === "accessory"/);
  assert.match(actions, /return category === "yarn" \|\| category === "accessory"/);
  assert.match(actions, /Chỉ sản phẩm bán online có phiên bản\/SKU mới được quản lý tại đây/);
  assert.match(productManager, /isYarnProduct \? <label>Mã màu/);
  assert.match(productManager, /!isYarnProduct \? <label>Giá phiên bản/);
});

test("accessory variants use generic values and do not bypass inventory movements with opening stock", () => {
  assert.match(productManager, /Tên phiên bản \/ giá trị lựa chọn/);
  assert.match(productManager, /Lưu lựa chọn/);
  assert.match(actions, /color_code: null,[\s\S]*color_name: null,[\s\S]*color_hex: null/);
  assert.match(actions, /price: parsed\.data\.price/);
  assert.doesNotMatch(productManager, /name="stock"/);
  assert.doesNotMatch(actions, /stock:\s*parsed\.data\.stock/);
  assert.match(actions, /name: z\.string\(\)\.trim\(\)\.min\(1\)\.max\(120\)/);
  assert.doesNotMatch(actions, /Mặc định.*(?:reject|invalid|forbidden)/i);
});

test("accessory variant prices are blank or positive, never a zero or negative override", () => {
  const variantActions = actions.slice(actions.indexOf("const variantSchema"));
  assert.match(variantActions, /price: z\.number\(\)\.positive\(\)\.nullable\(\)/);
  assert.doesNotMatch(variantActions, /price: z\.number\(\)\.nonnegative\(\)\.nullable\(\)/);
  assert.match(actions, /function parseVariantPrice[\s\S]*if \(raw\.includes\("-"\)\) return Number\.NaN/);
  assert.match(actions, /const price = parseVariantPrice\(formData\.get\("price"\)\)/);
});

test("accessory form keeps generic fields but contains yarn-only specs inside the yarn branch", () => {
  const yarnOnlyStart = productManager.indexOf('{productCategory === "yarn" ? (');
  const originStart = productManager.indexOf("<label>Xuất xứ (nếu có)");
  assert.ok(yarnOnlyStart >= 0);
  assert.ok(originStart > yarnOnlyStart);
  const yarnOnlySection = productManager.slice(yarnOnlyStart, originStart);
  for (const label of ["Độ dày sợi (len sợi)", "Thành phần (len sợi)", "Kim móc khuyên dùng (len sợi)"]) {
    assert.ok(yarnOnlySection.includes(label));
    assert.equal(productManager.split(label).length - 1, 1);
  }
  assert.match(productManager.slice(originStart), /<label>Xuất xứ \(nếu có\)/);
});

test("product label fields are controlled by the category-aware form state", () => {
  assert.match(productManager, /getProductFormLabels\(nextCategory, product\)/);
  assert.match(productManager, /setProductLabels\(getProductFormLabels\(nextCategory\)\)/);
  assert.match(productManager, /value=\{productLabels\.unitLabel\}/);
  assert.match(productManager, /value=\{productLabels\.optionLabel\}/);
});

test("accessory product edits prepare future routes without adding public catalog code", () => {
  assert.deepEqual(getProductRevalidationPaths({ slug: "kim-moc", category: "accessory" }), [
    "/admin/san-pham",
    "/len-soi-va-phu-kien",
    "/phu-kien/kim-moc"
  ]);
  assert.doesNotMatch(actions, /inventory_movements|admin_adjust_variant_stock/);
  assert.doesNotMatch(productManager, /\/phu-kien\//);
});
