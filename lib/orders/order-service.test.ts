import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  notificationItemSnapshotsFromRows,
  parseDatabaseOrderError
} from "./order-service";

const orderServiceSource = readFileSync(new URL("./order-service.ts", import.meta.url), "utf8");

test("new-order notification snapshots use persisted product and variant values", () => {
  assert.match(orderServiceSource, /select\("product_name_snapshot, variant_name_snapshot, color_code_snapshot, quantity, orders!inner\(order_code\)"\)/);
  assert.doesNotMatch(orderServiceSource, /from\("product_variants"\)/);

  assert.deepEqual(notificationItemSnapshotsFromRows([{
    product_name_snapshot: "Kim móc cán mềm",
    variant_name_snapshot: "2.5mm",
    color_code_snapshot: null,
    quantity: 2
  }]), [{
    productName: "Kim móc cán mềm",
    variantName: "2.5mm",
    colorCode: null,
    quantity: 2
  }]);
});

test("VARIANT_UNAVAILABLE preserves its code and status with generic customer copy", () => {
  const error = parseDatabaseOrderError("VARIANT_UNAVAILABLE|42|84");

  assert.equal(error.code, "VARIANT_UNAVAILABLE");
  assert.equal(error.status, 409);
  assert.equal(error.message, "Lựa chọn này hiện chưa thể đặt. Vui lòng chọn lựa chọn khác.");
  assert.doesNotMatch(error.message, /Mã màu/);
});
