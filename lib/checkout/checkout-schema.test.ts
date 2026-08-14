import assert from "node:assert/strict";
import test from "node:test";
import type { CartItem, YarnProduct } from "../../types/yarn-product";
import {
  checkoutFormSchema,
  createCheckoutPayload,
  resolveCheckoutItems
} from "./checkout-schema";

const validForm = {
  customerName: " Nguyễn Văn An ",
  phone: "090 123 4567",
  email: "",
  province: "TP. Hồ Chí Minh",
  district: "Quận 1",
  ward: "Phường Bến Nghé",
  addressLine: "12 Nguyễn Huệ",
  shippingNote: "Gọi trước khi giao",
  paymentMethod: "cod" as const
};

const cartItem: CartItem = {
  productId: "milk-bo",
  variantId: "01",
  quantity: 3,
  slug: "milk-bo-40",
  productName: "Milk Bò",
  variantName: "01",
  colorCode: "#edf5fb",
  imageUrl: "https://res.cloudinary.com/demo/image/upload/milk-bo.jpg",
  displayPrice: 7200
};

function product(stock: number | null = 10): YarnProduct {
  return {
    id: "milk-bo",
    slug: "milk-bo-40",
    name: "Milk Bò",
    shortName: "Milk Bò",
    category: "milk-cotton",
    description: "Len sợi",
    seoDescription: "Len sợi",
    price: 7200,
    weight: "40g",
    material: "Len sợi",
    hookSize: "2.5mm",
    origin: "Chưa cập nhật",
    image: cartItem.imageUrl,
    images: [cartItem.imageUrl],
    updatedAt: "2026-08-10",
    variants: [{ id: "01", colorCode: "#edf5fb", colorName: "01", image: cartItem.imageUrl, hasOwnImage: true, stock }],
    wholesaleTiers: []
  };
}

test("checkout form schema", async (t) => {
  await t.test("rejects empty required fields", () => {
    const result = checkoutFormSchema.safeParse({
      ...validForm,
      customerName: " ",
      phone: "",
      province: "",
      district: "",
      ward: "",
      addressLine: ""
    });
    assert.equal(result.success, false);
  });

  await t.test("rejects invalid phone and accepts a reasonable Vietnamese phone", () => {
    assert.equal(checkoutFormSchema.safeParse({ ...validForm, phone: "123" }).success, false);
    assert.equal(checkoutFormSchema.safeParse(validForm).success, true);
    assert.equal(checkoutFormSchema.safeParse({ ...validForm, phone: "+84 901 234 567" }).success, true);
  });

  await t.test("allows empty email but rejects an invalid email", () => {
    assert.equal(checkoutFormSchema.safeParse(validForm).success, true);
    assert.equal(checkoutFormSchema.safeParse({ ...validForm, email: "khong-phai-email" }).success, false);
    assert.equal(checkoutFormSchema.safeParse({ ...validForm, email: "an@example.com" }).success, true);
  });

  await t.test("accepts both COD and bank transfer payment selections", () => {
    assert.equal(checkoutFormSchema.safeParse({ ...validForm, paymentMethod: "cod" }).success, true);
    assert.equal(checkoutFormSchema.safeParse({ ...validForm, paymentMethod: "bank_transfer" }).success, true);
  });

  await t.test("prepares identity-only items without trusted totals or statuses", () => {
    const parsed = checkoutFormSchema.parse(validForm);
    const payload = createCheckoutPayload(parsed, [cartItem]);
    assert.deepEqual(payload.items, [{ productId: "milk-bo", variantId: "01", quantity: 3 }]);
    assert.equal(payload.customer.name, "Nguyễn Văn An");
    assert.equal("price" in payload, false);
    assert.equal("subtotal" in payload, false);
    assert.equal("shippingFee" in payload, false);
    assert.equal("total" in payload, false);
    assert.equal("paymentStatus" in payload, false);
    assert.equal("orderStatus" in payload, false);
  });
});

test("checkout cart revalidation", async (t) => {
  await t.test("accepts an available product and exact variant", () => {
    assert.equal(resolveCheckoutItems([cartItem], [product()])[0].issue, null);
  });

  await t.test("marks missing product and variant", () => {
    assert.equal(resolveCheckoutItems([cartItem], [])[0].issue, "missing-product");
    const missingVariant = { ...product(), variants: [] };
    assert.equal(resolveCheckoutItems([cartItem], [missingVariant])[0].issue, "missing-variant");
  });

  await t.test("marks out-of-stock and insufficient-stock items", () => {
    assert.equal(resolveCheckoutItems([cartItem], [product(0)])[0].issue, "out-of-stock");
    assert.equal(resolveCheckoutItems([cartItem], [product(2)])[0].issue, "insufficient-stock");
  });

  await t.test("allows unknown stock without inventing availability", () => {
    assert.equal(resolveCheckoutItems([cartItem], [product(null)])[0].issue, null);
  });
});
