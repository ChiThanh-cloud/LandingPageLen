import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const cartRoute = read("./gio-hang/page.tsx");
const checkoutRoute = read("./thanh-toan/page.tsx");
const cartPage = read("../components/cart/CartPage.tsx");
const cartHeaderLink = read("../components/cart/CartHeaderLink.tsx");
const checkoutPage = read("../components/checkout/CheckoutPage.tsx");
const resolver = read("../lib/cart/cart-commerce.ts");
const checkoutSchema = read("../lib/checkout/checkout-schema.ts");

test("cart and checkout load the generic sellable catalog", () => {
  for (const source of [cartRoute, checkoutRoute]) {
    assert.match(source, /getAllSellableProducts/);
    assert.doesNotMatch(source, /getAllYarnProducts/);
  }
  assert.match(cartPage, /CommerceProduct\[\]/);
  assert.match(checkoutPage, /CommerceProduct\[\]/);
  assert.match(checkoutSchema, /CommerceProduct\[\]/);
});

test("cart and checkout share commerce resolution and price semantics", () => {
  assert.match(cartPage, /resolveCommerceCartItems/);
  assert.match(checkoutSchema, /resolveCommerceCartItems/);
  assert.match(cartPage, /getCommerceCartSubtotal/);
  assert.match(checkoutPage, /getCommerceCartSubtotal/);
  assert.match(resolver, /getCommerceItemDisplayPrice/);
  assert.match(resolver, /getCommerceProductPath/);
  assert.doesNotMatch(cartPage, /`\/len-soi\/\$\{/);
  assert.doesNotMatch(checkoutPage, /`\/len-soi\/\$\{/);
});

test("customer-facing cart and checkout copy is category-neutral", () => {
  const customerSources = [cartPage, checkoutPage];
  for (const source of customerSources) {
    assert.doesNotMatch(source, /Mã màu|Tiếp tục mua len|\/ cuộn/);
  }
  assert.match(cartPage, /entry\.optionLabel|optionLabel/);
  assert.match(checkoutPage, /entry\.optionLabel/);
  assert.match(cartPage, /entry\.unitLabel|unitLabel/);
  assert.match(checkoutPage, /entry\.unitLabel/);
});

test("empty commerce images use local accessible placeholders", () => {
  assert.match(cartPage, /entry\.imageUrl \? \(/);
  assert.match(checkoutPage, /entry\.imageUrl \? \(/);
  assert.match(cartPage, /chưa có ảnh/);
  assert.match(checkoutPage, /chưa có ảnh/);
  assert.doesNotMatch(cartPage, /<Image\s+src=""/);
  assert.doesNotMatch(checkoutPage, /<Image\s+src=""/);
});

test("checkout payload remains identity-only", () => {
  assert.match(checkoutSchema, /items\.map\(\(\{ productId, variantId, quantity \}\) => \(\{ productId, variantId, quantity \}\)\)/);
  assert.doesNotMatch(checkoutSchema, /items\.map[\s\S]{0,180}(?:displayPrice|subtotal|shippingFee|paymentStatus|orderStatus)/);
});

test("cart header scope includes accessory category and detail routes", () => {
  assert.match(cartHeaderLink, /pathname\.startsWith\("\/phu-kien"\)/);
});

test("unavailable cart items can decrease but cannot increase", () => {
  assert.match(cartPage, /disabled=\{item\.quantity <= 1\}/);
  assert.doesNotMatch(cartPage, /disabled=\{!isAvailable \|\| item\.quantity <= 1\}/);
  assert.match(cartPage, /disabled=\{!isAvailable \|\| atStockLimit\}/);
});
