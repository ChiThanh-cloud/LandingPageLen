import assert from "node:assert/strict";
import test from "node:test";
import { orderRequestSchema } from "./order-schema";

const validOrderRequest = {
  customer: {
    name: "Nguyễn Văn An",
    phone: "090 123 4567",
    email: ""
  },
  shipping: {
    province: "TP. Hồ Chí Minh",
    district: "Quận 1",
    ward: "Phường Bến Nghé",
    addressLine: "12 Nguyễn Huệ",
    note: "Gọi trước khi giao"
  },
  items: [{ productId: "40", variantId: "101", quantity: 3 }],
  paymentMethod: "cod"
};

test("server order request validation", async (t) => {
  await t.test("accepts identity-only COD and bank-transfer payloads", () => {
    assert.equal(orderRequestSchema.safeParse(validOrderRequest).success, true);
    assert.equal(orderRequestSchema.safeParse({
      ...validOrderRequest,
      paymentMethod: "bank_transfer"
    }).success, true);
  });

  await t.test("rejects trusted price, total, and status fields from the client", () => {
    for (const field of ["price", "subtotal", "shippingFee", "total", "paymentStatus", "orderStatus"]) {
      assert.equal(orderRequestSchema.safeParse({
        ...validOrderRequest,
        [field]: field === "price" ? 1 : "tampered"
      }).success, false);
    }

    assert.equal(orderRequestSchema.safeParse({
      ...validOrderRequest,
      shippingFee: 0
    }).success, false);
    assert.equal(orderRequestSchema.safeParse({
      ...validOrderRequest,
      total: 1
    }).success, false);
  });

  await t.test("rejects invalid IDs, quantities, and payment methods", () => {
    assert.equal(orderRequestSchema.safeParse({
      ...validOrderRequest,
      items: [{ productId: "milk-bo", variantId: "101", quantity: 3 }]
    }).success, false);
    assert.equal(orderRequestSchema.safeParse({
      ...validOrderRequest,
      items: [{ productId: "40", variantId: "101", quantity: 0 }]
    }).success, false);
    assert.equal(orderRequestSchema.safeParse({
      ...validOrderRequest,
      paymentMethod: "paid"
    }).success, false);
  });

  await t.test("rejects duplicate product and variant identities", () => {
    assert.equal(orderRequestSchema.safeParse({
      ...validOrderRequest,
      items: [
        { productId: "40", variantId: "101", quantity: 2 },
        { productId: "40", variantId: "101", quantity: 3 }
      ]
    }).success, false);
  });

  await t.test("accepts different variants of the same product", () => {
    assert.equal(orderRequestSchema.safeParse({
      ...validOrderRequest,
      items: [
        { productId: "40", variantId: "101", quantity: 8 },
        { productId: "40", variantId: "102", quantity: 6 },
        { productId: "40", variantId: "103", quantity: 6 }
      ]
    }).success, true);
  });

  await t.test("rejects malformed contact and address data", () => {
    assert.equal(orderRequestSchema.safeParse({
      ...validOrderRequest,
      customer: { ...validOrderRequest.customer, phone: "123" }
    }).success, false);
    assert.equal(orderRequestSchema.safeParse({
      ...validOrderRequest,
      shipping: { ...validOrderRequest.shipping, addressLine: "" }
    }).success, false);
  });
});
