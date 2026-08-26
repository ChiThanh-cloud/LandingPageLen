import assert from "node:assert/strict";
import test from "node:test";
import type { CartItem } from "../../types/yarn-product";
import type { CommerceProduct } from "../../types/commerce-product";
import { getCommerceCartSubtotal, resolveCommerceCartItems } from "../cart/cart-commerce";
import {
  checkoutFormSchema,
  createCheckoutPayload,
  getCheckoutShippingItems,
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

function product(stock: number | null = 10): CommerceProduct {
  return {
    id: "milk-bo",
    slug: "milk-bo-40",
    name: "Milk Bò",
    category: "yarn",
    subCategory: "milk-cotton",
    description: "Len sợi",
    price: 7200,
    unitLabel: "cuộn",
    optionLabel: "Màu",
    status: "active",
    sortOrder: 1,
    image: cartItem.imageUrl,
    coverImage: null,
    updatedAt: "2026-08-10",
    variants: [{
      id: "01",
      productId: "milk-bo",
      name: "Trắng sữa",
      sku: null,
      price: null,
      stock,
      status: "active",
      sortOrder: 1,
      image: cartItem.imageUrl,
      colorCode: "01",
      colorName: "Trắng sữa",
      colorHex: "#edf5fb"
    }]
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
    const entry = resolveCheckoutItems([cartItem], [product()])[0];
    assert.equal(entry.issue, null);
    assert.equal(entry.optionLabel, "Màu");
    assert.equal(entry.unitLabel, "cuộn");
    assert.equal(entry.displayPrice, 7200);
  });

  await t.test("marks missing product and variant", () => {
    const missingProduct = resolveCheckoutItems([cartItem], [])[0];
    assert.equal(missingProduct.issue, "missing-product");
    const missingVariant = { ...product(), variants: [] };
    const unresolvedVariant = resolveCheckoutItems([cartItem], [missingVariant])[0];
    assert.equal(unresolvedVariant.issue, "missing-variant");
    assert.doesNotMatch(`${missingProduct.issueMessage} ${unresolvedVariant.issueMessage}`, /Mã màu/);
  });

  await t.test("marks out-of-stock and insufficient-stock items", () => {
    assert.equal(resolveCheckoutItems([cartItem], [product(0)])[0].issue, "out-of-stock");
    const insufficient = resolveCheckoutItems([cartItem], [product(2)])[0];
    assert.equal(insufficient.issue, "insufficient-stock");
    assert.match(insufficient.issueMessage || "", /2 cuộn/);
  });

  await t.test("allows unknown stock without inventing availability", () => {
    assert.equal(resolveCheckoutItems([cartItem], [product(null)])[0].issue, null);
  });

  await t.test("blocks an out product and keeps preorder orderable", () => {
    const out = resolveCheckoutItems([cartItem], [{ ...product(), status: "out" }])[0];
    const preorder = resolveCheckoutItems([cartItem], [{ ...product(), status: "preorder" }])[0];

    assert.equal(out.issue, "product-out");
    assert.equal(out.issueMessage, "Sản phẩm hiện đã hết hàng.");
    assert.equal(out.isAvailable, false);
    assert.equal(preorder.issue, null);
    assert.equal(preorder.isAvailable, true);
  });

  await t.test("blocks an out variant and keeps preorder orderable", () => {
    const outProduct = product();
    outProduct.variants[0].status = "out";
    const preorderProduct = product();
    preorderProduct.variants[0].status = "preorder";

    const out = resolveCheckoutItems([cartItem], [outProduct])[0];
    const preorder = resolveCheckoutItems([cartItem], [preorderProduct])[0];

    assert.equal(out.issue, "variant-out");
    assert.equal(out.issueMessage, "Lựa chọn này hiện đã hết hàng.");
    assert.equal(out.isAvailable, false);
    assert.equal(preorder.issue, null);
    assert.equal(preorder.isAvailable, true);
  });

  await t.test("maps shipping identity from resolved live category without changing the POST payload", () => {
    const resolved = resolveCheckoutItems([cartItem], [product()]);
    assert.deepEqual(getCheckoutShippingItems(resolved), [{
      productId: cartItem.productId,
      quantity: cartItem.quantity,
      category: "yarn"
    }]);

    const unresolved = resolveCheckoutItems([cartItem], []);
    assert.deepEqual(getCheckoutShippingItems(unresolved), [{
      productId: cartItem.productId,
      quantity: cartItem.quantity,
      category: undefined
    }]);
  });

  await t.test("resolves accessory option, unit, no-image and the same variant price as cart", () => {
    const accessory: CommerceProduct = {
      ...product(null),
      id: "hook",
      name: "Kim móc cán mềm",
      slug: "kim-moc-can-mem",
      category: "accessory",
      subCategory: "hook",
      image: "",
      price: 25_000,
      unitLabel: "cây",
      optionLabel: "Kích thước",
      variants: [{
        ...product().variants[0],
        id: "hook-25",
        productId: "hook",
        name: "2.5mm",
        price: 27_000,
        stock: null,
        image: "",
        colorCode: null,
        colorName: null,
        colorHex: null
      }]
    };
    const accessoryItem: CartItem = {
      ...cartItem,
      productId: "hook",
      variantId: "hook-25",
      slug: "kim-moc-can-mem",
      productName: "Kim móc",
      variantName: "2.5mm",
      colorCode: "",
      imageUrl: "",
      displayPrice: 1
    };
    const resolved = resolveCheckoutItems([accessoryItem], [accessory]);
    const cartResolved = resolveCommerceCartItems([accessoryItem], [accessory]);

    assert.equal(resolved[0].issue, null);
    assert.equal(resolved[0].optionLabel, "Kích thước");
    assert.equal(resolved[0].unitLabel, "cây");
    assert.equal(resolved[0].imageUrl, "");
    assert.equal(resolved[0].displayPrice, 27_000);
    assert.equal(resolved[0].displayPrice, cartResolved[0].displayPrice);
    assert.equal(getCommerceCartSubtotal(resolved), 81_000);
  });
});
