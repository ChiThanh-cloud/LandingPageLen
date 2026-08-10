import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const customerFiles = [
  "../../components/yarn-product/ProductActions.tsx",
  "../../components/yarn-product/QuantitySelector.tsx",
  "../../components/yarn-product/VariantSelector.tsx",
  "../../components/cart/CartPage.tsx",
  "../../components/checkout/CheckoutPage.tsx",
  "../../components/orders/OrderCancellation.tsx",
  "../../components/payments/PayOSPayment.tsx",
  "../../app/tra-cuu-don-hang/OrderLookupPage.tsx",
  "../../app/dat-hang-thanh-cong/[orderCode]/page.tsx"
];

const customerSource = customerFiles
  .map((path) => readFileSync(new URL(path, import.meta.url), "utf8"))
  .join("\n");

test("customer ecommerce copy excludes known implementation wording", () => {
  for (const forbiddenCopy of [
    "Guest checkout",
    "Đang tải thông tin checkout",
    "backend kiểm tra",
    "Physical stock",
    "stock vật lý",
    "stock xác định",
    "reservation tự",
    "không dùng reservation",
    "Shop sẽ xác nhận",
    "Đơn vẫn được lưu để Tiny đối soát",
    "dữ liệu đơn hàng nào bị xóa",
    "Tổng thanh toán cuối cùng sẽ được xác nhận"
  ]) {
    assert.equal(
      customerSource.toLocaleLowerCase("vi").includes(forbiddenCopy.toLocaleLowerCase("vi")),
      false,
      `Customer copy still contains: ${forbiddenCopy}`
    );
  }
});

test("success page uses stored shipping and total with historical null fallback", () => {
  const successPage = readFileSync(
    new URL("../../app/dat-hang-thanh-cong/[orderCode]/page.tsx", import.meta.url),
    "utf8"
  );

  assert.match(successPage, /order\.shippingFee === null[\s\S]*"Chưa xác định"/);
  assert.match(successPage, /formatCurrency\(order\.shippingFee\)/);
  assert.match(successPage, /order\.total === null[\s\S]*"Chưa xác định"/);
  assert.match(successPage, /formatCurrency\(order\.total\)/);
  assert.doesNotMatch(successPage, /FIXED_SHIPPING_FEE_VND/);
});

test("customer stock copy uses Tiny wording and shows exact managed stock", () => {
  assert.match(customerSource, /Liên hệ Tiny để xác nhận số lượng/);
  assert.match(customerSource, /Còn hàng: \$\{stock\.toLocaleString\("vi-VN"\)\} cuộn/);
  assert.match(customerSource, /Còn hàng: \$\{variant\.stock\.toLocaleString\("vi-VN"\)\} cuộn/);
  assert.match(customerSource, /Hết hàng/);
  assert.doesNotMatch(customerSource, /giới hạn tồn kho/i);
});
