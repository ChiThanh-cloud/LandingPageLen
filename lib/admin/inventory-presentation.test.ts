import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getInventoryOptionLabel, getInventoryStockText, getInventoryUnitLabel, getInventoryVariantValue } from "./inventory-presentation";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const service = read("./admin-service.ts");
const inventoryPage = read("../../app/admin/(protected)/ton-kho/page.tsx");
const stockEditor = read("../../components/admin/StockEditor.tsx");
const actions = read("../../app/admin/(protected)/actions.ts");

test("inventory query loads yarn and accessory while excluding protected categories", () => {
  assert.match(service, /\.in\("category", \["yarn", "accessory"\]\)/);
  assert.match(service, /id,name,category,slug,unit_label,option_label,status,sort_order/);
  assert.match(service, /id,product_id,name,sku,color_name,color_code,image_url,stock,status,sort_order/);
  assert.match(service, /\.in\("variant_id", variantIds\)/);
  assert.doesNotMatch(service, /\.eq\("category", "yarn"\)/);
  assert.doesNotMatch(service, /["']handmade["']|["']set["']|["']gift["']/);
});

test("inventory presentation uses business units and generic option labels", () => {
  const yarn = { category: "yarn", unit_label: null, option_label: null };
  assert.equal(getInventoryUnitLabel(yarn), "cuộn");
  assert.equal(getInventoryOptionLabel(yarn), "Màu");

  for (const [name, unitLabel, optionLabel] of [
    ["Milk Bò", "cuộn", "Màu"],
    ["Nhung Gấu", "cuộn", "Màu"],
    ["Kim móc", "cây", "Kích thước"],
    ["Bông gòn", "Kg", "Khối lượng"],
    ["Mắt thú", "cặp", "Kích thước"],
    ["Kim khâu", "cây", "Phân loại"]
  ]) {
    const product = { category: name === "Milk Bò" || name === "Nhung Gấu" ? "yarn" : "accessory", unit_label: unitLabel, option_label: optionLabel };
    assert.equal(getInventoryUnitLabel(product), unitLabel, name);
    assert.equal(getInventoryOptionLabel(product), optionLabel, name);
  }

  assert.equal(getInventoryUnitLabel({ category: "accessory", unit_label: null, option_label: null }), "sản phẩm");
  assert.equal(getInventoryOptionLabel({ category: "accessory", unit_label: null, option_label: null }), "Phân loại");
});

test("inventory rows keep yarn colors, accessory option values, and NULL stock semantics", () => {
  assert.equal(getInventoryVariantValue({ category: "yarn" }, { name: "Xanh lá", color_code: "12", color_name: "Xanh lá" }), "12");
  assert.equal(getInventoryVariantValue({ category: "accessory" }, { name: "2.5mm", color_code: null, color_name: null }), "2.5mm");
  assert.equal(getInventoryVariantValue({ category: "accessory" }, { name: null, color_code: null, color_name: null }), "Mặc định");
  assert.equal(getInventoryStockText(null, "cây"), "Chưa quản lý");
  assert.equal(getInventoryStockText(15, "cây"), "Tồn: 15 cây");
  assert.match(inventoryPage, /Quản lý tồn kho len sợi và phụ kiện\./);
  assert.doesNotMatch(inventoryPage, /Mã màu: Không có/);
});

test("accessory adjustment uses the existing protected server action and RPC", () => {
  assert.match(inventoryPage, /<StockEditor variantId=\{String\(variant\.id\)\} stock=\{variant\.stock\}/);
  assert.match(actions, /export async function adjustStockAction[\s\S]*callAdminRpc\("admin_adjust_variant_stock"/);
  assert.match(actions, /Không tìm thấy phiên bản thuộc khu vực quản lý tồn kho/);
  assert.match(stockEditor, /chuyển phiên bản sang “Chưa quản lý tồn”/);
});
