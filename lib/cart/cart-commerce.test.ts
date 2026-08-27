import assert from "node:assert/strict";
import test from "node:test";
import type { CartItem } from "../../types/yarn-product";
import type { CommerceProduct, CommerceVariant } from "../../types/commerce-product";
import {
  getCommerceCartOptionDescription,
  getCommerceCartStockLabel,
  getCommerceCartSubtotal,
  getCommerceItemAccessibleLabel,
  getCommerceUnitPriceLabel,
  resolveCommerceCartItems
} from "./cart-commerce";

function variant(overrides: Partial<CommerceVariant> = {}): CommerceVariant {
  return {
    id: "01",
    productId: "milk-bo",
    name: "Trắng sữa",
    sku: null,
    price: null,
    stock: 10,
    status: "active",
    sortOrder: 1,
    image: "https://res.cloudinary.com/demo/image/upload/milk-bo-01.jpg",
    colorCode: "01",
    colorName: "Trắng sữa",
    colorHex: "#edf5fb",
    ...overrides
  };
}

function product(overrides: Partial<CommerceProduct> = {}): CommerceProduct {
  return {
    id: "milk-bo",
    name: "Milk Bò",
    slug: "milk-bo-40",
    category: "yarn",
    subCategory: "milk-cotton",
    description: "Len sợi",
    image: "https://res.cloudinary.com/demo/image/upload/milk-bo.jpg",
    coverImage: null,
    price: 7_200,
    unitLabel: "cuộn",
    optionLabel: "Màu",
    status: "active",
    sortOrder: 1,
    updatedAt: "2026-08-10",
    variants: [variant()],
    ...overrides
  };
}

function cartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    productId: "milk-bo",
    variantId: "01",
    quantity: 2,
    slug: "milk-bo-40",
    productName: "Milk Bò snapshot",
    variantName: "01 snapshot",
    colorCode: "#edf5fb",
    imageUrl: "https://res.cloudinary.com/demo/image/upload/snapshot.jpg",
    displayPrice: 6_000,
    ...overrides
  };
}

test("generic cart commerce resolution", async (t) => {
  await t.test("resolves live yarn labels, route, image, stock and base price", () => {
    const [entry] = resolveCommerceCartItems([cartItem()], [product()]);

    assert.equal(entry.productName, "Milk Bò");
    assert.equal(entry.variantName, "Trắng sữa");
    assert.equal(entry.optionLabel, "Màu");
    assert.equal(entry.unitLabel, "cuộn");
    assert.equal(entry.detailPath, "/len-soi/milk-bo-40");
    assert.equal(entry.displayPrice, 7_200);
    assert.equal(entry.stock, 10);
    assert.equal(entry.isAvailable, true);
  });

  await t.test("resolves accessory labels and central accessory route", () => {
    const hook = product({
      id: "hook",
      name: "Kim móc cán mềm",
      slug: "kim-moc-can-mem",
      category: "accessory",
      subCategory: "hook",
      image: "",
      price: 25_000,
      unitLabel: "cây",
      optionLabel: "Kích thước",
      variants: [variant({
        id: "hook-25",
        productId: "hook",
        name: "2.5mm",
        price: 27_000,
        stock: null,
        image: "",
        colorCode: null,
        colorName: null,
        colorHex: null
      })]
    });
    const [entry] = resolveCommerceCartItems([
      cartItem({
        productId: "hook",
        variantId: "hook-25",
        slug: "kim-moc-can-mem",
        productName: "Kim móc",
        variantName: "2.5mm",
        imageUrl: "",
        colorCode: "",
        displayPrice: 1
      })
    ], [hook]);

    assert.equal(entry.detailPath, "/phu-kien/kim-moc-can-mem");
    assert.equal(entry.optionLabel, "Kích thước");
    assert.equal(entry.variantName, "2.5mm");
    assert.equal(entry.unitLabel, "cây");
    assert.equal(entry.displayPrice, 27_000);
    assert.equal(entry.imageUrl, "");
    assert.equal(entry.stock, null);
    assert.equal(entry.isAvailable, true);
    assert.equal(getCommerceCartStockLabel(entry), "Liên hệ Tiny để xác nhận số lượng lớn");
    assert.equal(getCommerceUnitPriceLabel(entry.displayPrice, entry.unitLabel), "27.000đ / cây");

    const stuffing = product({
      id: "stuffing",
      name: "Bông gòn",
      slug: "bong-gon",
      category: "accessory",
      subCategory: "stuffing",
      price: 80_000,
      unitLabel: "Kg",
      optionLabel: "Khối lượng",
      variants: [variant({
        id: "stuffing-500",
        productId: "stuffing",
        name: "500g",
        stock: 3,
        image: ""
      })]
    });
    const [stuffingEntry] = resolveCommerceCartItems([
      cartItem({ productId: "stuffing", variantId: "stuffing-500", imageUrl: "" })
    ], [stuffing]);
    assert.equal(stuffingEntry.optionLabel, "Khối lượng");
    assert.equal(stuffingEntry.variantName, "500g");
    assert.equal(stuffingEntry.unitLabel, "Kg");
    assert.equal(getCommerceUnitPriceLabel(stuffingEntry.displayPrice, stuffingEntry.unitLabel), "80.000đ / Kg");
  });

  await t.test("uses positive variant override and falls back to positive product price", () => {
    const prices = [
      resolveCommerceCartItems([cartItem()], [product({ variants: [variant({ price: 8_500 })] })])[0].displayPrice,
      resolveCommerceCartItems([cartItem()], [product({ variants: [variant({ price: 6_500 })] })])[0].displayPrice,
      resolveCommerceCartItems([cartItem()], [product({ variants: [variant({ price: 0 })] })])[0].displayPrice,
      resolveCommerceCartItems([cartItem()], [product({ variants: [variant({ price: -5 })] })])[0].displayPrice,
      resolveCommerceCartItems([cartItem()], [product({ variants: [variant({ price: null })] })])[0].displayPrice
    ];

    assert.deepEqual(prices, [8_500, 6_500, 7_200, 7_200, 7_200]);
  });

  await t.test("uses a safe snapshot only when live identity or valid live price is unavailable", () => {
    const missingProduct = resolveCommerceCartItems([cartItem({ displayPrice: 6_100 })], [])[0];
    const missingVariant = resolveCommerceCartItems([cartItem({ displayPrice: 6_200 })], [product({ variants: [] })])[0];
    const invalidPrices = resolveCommerceCartItems(
      [cartItem({ displayPrice: Number.NaN })],
      [product({ price: 0, variants: [variant({ price: null })] })]
    )[0];

    assert.equal(missingProduct.displayPrice, 6_100);
    assert.equal(missingProduct.detailPath, null);
    assert.equal(missingProduct.isAvailable, false);
    assert.equal(missingVariant.displayPrice, 6_200);
    assert.equal(missingVariant.detailPath, "/len-soi/milk-bo-40");
    assert.equal(missingVariant.isAvailable, false);
    assert.equal(invalidPrices.displayPrice, 0);
  });

  await t.test("distinguishes unmanaged, zero and positive stock with the product unit", () => {
    const entries = [null, 0, 3].map((stock) => resolveCommerceCartItems(
      [cartItem()],
      [product({ unitLabel: "Kg", variants: [variant({ stock })] })]
    )[0]);

    assert.equal(entries[0].isAvailable, true);
    assert.equal(entries[1].isAvailable, false);
    assert.equal(entries[2].isAvailable, true);
    assert.equal(getCommerceCartStockLabel(entries[1]), "Hết hàng");
    assert.equal(getCommerceCartStockLabel(entries[2]), "Còn hàng: 3 Kg");
  });

  await t.test("blocks an out product and keeps preorder orderable when stock allows", () => {
    const out = resolveCommerceCartItems([cartItem()], [product({ status: "out" })])[0];
    const preorder = resolveCommerceCartItems([cartItem()], [product({ status: "preorder" })])[0];

    assert.equal(out.isAvailable, false);
    assert.equal(getCommerceCartStockLabel(out), "Hết hàng");
    assert.equal(preorder.isAvailable, true);
  });

  await t.test("blocks an out variant and keeps preorder orderable when stock allows", () => {
    const out = resolveCommerceCartItems(
      [cartItem()],
      [product({ variants: [variant({ status: "out", stock: 3 })] })]
    )[0];
    const preorder = resolveCommerceCartItems(
      [cartItem()],
      [product({ variants: [variant({ status: "preorder", stock: 3 })] })]
    )[0];

    assert.equal(out.isAvailable, false);
    assert.equal(getCommerceCartStockLabel(out), "Hết hàng");
    assert.equal(preorder.isAvailable, true);
    assert.equal(getCommerceCartStockLabel(preorder), "Còn hàng: 3 cuộn");
  });

  await t.test("calculates subtotal from resolved prices and keeps accessible labels generic", () => {
    const resolved = resolveCommerceCartItems(
      [cartItem({ quantity: 2 }), cartItem({ variantId: "02", quantity: 3 })],
      [product({ variants: [variant({ price: 8_000 }), variant({ id: "02", name: "Xám", price: 9_000 })] })]
    );

    assert.equal(getCommerceCartSubtotal(resolved), 43_000);
    assert.equal(getCommerceItemAccessibleLabel(resolved[1]), "Milk Bò, Màu Xám");
  });

  await t.test("hides only singleton accessory options from cart copy", () => {
    const singletonAccessory = product({ category: "accessory" });
    const multiOptionAccessory = product({
      category: "accessory",
      variants: [variant(), variant({ id: "02", name: "Xám" })]
    });
    const [yarnEntry] = resolveCommerceCartItems([cartItem()], [product()]);
    const [singletonEntry] = resolveCommerceCartItems([cartItem()], [singletonAccessory]);
    const [multiOptionEntry] = resolveCommerceCartItems([cartItem()], [multiOptionAccessory]);
    const [staleVariantEntry] = resolveCommerceCartItems([
      cartItem({ variantId: "old-option", variantName: "Lựa chọn cũ" })
    ], [singletonAccessory]);

    assert.equal(getCommerceCartOptionDescription(yarnEntry), "Màu Trắng sữa");
    assert.equal(getCommerceCartOptionDescription(singletonEntry), null);
    assert.equal(getCommerceItemAccessibleLabel(singletonEntry), "Milk Bò");
    assert.equal(getCommerceCartOptionDescription(multiOptionEntry), "Màu Trắng sữa");
    assert.equal(staleVariantEntry.variant, undefined);
    assert.equal(getCommerceCartOptionDescription(staleVariantEntry), "Màu Lựa chọn cũ");
  });
});
