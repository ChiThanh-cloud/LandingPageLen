import assert from "node:assert/strict";
import test from "node:test";
import {
  addCartItem,
  CART_STORAGE_VERSION,
  clearCartItems,
  getTotalCartQuantity,
  parseCartStorage,
  removeCartItem,
  serializeCart,
  updateCartItemQuantity
} from "./cart-store";
import type { CartItem } from "../../types/yarn-product";

function item(variantId: string, quantity: number): CartItem {
  return {
    productId: "milk-bo",
    variantId,
    quantity,
    slug: "milk-bo-40",
    productName: "Milk Bò",
    variantName: variantId,
    colorCode: "#edf5fb",
    imageUrl: "https://res.cloudinary.com/demo/image/upload/milk-bo.jpg",
    displayPrice: 7200
  };
}

test("cart store", async (t) => {
  await t.test("adds the same variant by productId and variantId", () => {
    const first = addCartItem([], item("01", 1), 10);
    const second = addCartItem(first.items, item("01", 2), 10);
    assert.equal(second.code, "updated");
    assert.equal(second.items.length, 1);
    assert.equal(second.items[0].quantity, 3);
  });

  await t.test("keeps different variants as separate items and totals quantities", () => {
    const first = addCartItem([], item("01", 3), 10);
    const second = addCartItem(first.items, item("08", 2), 10);
    assert.equal(second.items.length, 2);
    assert.equal(getTotalCartQuantity(second.items), 5);
  });

  await t.test("caps aggregate quantity at current stock in the cart layer", () => {
    const current = [item("01", 8)];
    const result = addCartItem(current, item("01", 5), 10);
    assert.equal(result.code, "stock-capped");
    assert.equal(result.acceptedQuantity, 2);
    assert.equal(result.quantity, 10);
    assert.equal(result.items[0].quantity, 10);

    const blocked = addCartItem(result.items, item("01", 1), 10);
    assert.equal(blocked.code, "stock-limit");
    assert.equal(blocked.acceptedQuantity, 0);
    assert.equal(blocked.items[0].quantity, 10);
  });

  await t.test("caps quantity updates and never accepts quantity below one", () => {
    const current = [item("01", 3)];
    const capped = updateCartItemQuantity(current, "milk-bo", "01", 12, 10);
    assert.equal(capped.code, "stock-capped");
    assert.equal(capped.items[0].quantity, 10);

    const invalid = updateCartItemQuantity(capped.items, "milk-bo", "01", 0, 10);
    assert.equal(invalid.code, "invalid-quantity");
    assert.equal(invalid.items[0].quantity, 10);
  });

  await t.test("keeps null stock unmanaged, blocks zero and caps positive stock", () => {
    const current = [item("01", 3)];

    assert.equal(updateCartItemQuantity(current, "milk-bo", "01", 20, null).items[0].quantity, 20);
    const blocked = updateCartItemQuantity(current, "milk-bo", "01", 20, 0);
    assert.equal(blocked.code, "out-of-stock");
    assert.equal(blocked.items[0].quantity, 3);
    assert.equal(updateCartItemQuantity(current, "milk-bo", "01", 20, 5).items[0].quantity, 5);
  });

  await t.test("allows quantity to decrease when current stock is zero", () => {
    const result = updateCartItemQuantity([item("01", 4)], "milk-bo", "01", 3, 0);

    assert.equal(result.code, "updated");
    assert.equal(result.acceptedQuantity, -1);
    assert.equal(result.quantity, 3);
    assert.equal(result.items[0].quantity, 3);
  });

  await t.test("removes only the matching product and variant pair", () => {
    const current = [item("01", 1), item("08", 2)];
    const result = removeCartItem(current, "milk-bo", "01");
    assert.deepEqual(result.map((entry) => entry.variantId), ["08"]);
  });

  await t.test("clears every cart item", () => {
    assert.deepEqual(clearCartItems(), []);
  });

  await t.test("round-trips the versioned persistence schema", () => {
    const current = [item("01", 3)];
    const raw = serializeCart(current);
    assert.deepEqual(JSON.parse(raw), { version: CART_STORAGE_VERSION, items: current });
    assert.deepEqual(parseCartStorage(raw), current);
  });

  await t.test("round-trips a valid accessory snapshot without an image or color", () => {
    const accessoryItem: CartItem = {
      productId: "hook",
      variantId: "hook-25",
      quantity: 1,
      slug: "kim-moc-can-mem",
      productName: "Kim móc cán mềm",
      variantName: "2.5mm",
      colorCode: "",
      imageUrl: "",
      displayPrice: 25_000
    };

    assert.deepEqual(parseCartStorage(serializeCart([accessoryItem])), [accessoryItem]);
  });

  await t.test("handles corrupt, old, and partially invalid storage safely", () => {
    assert.deepEqual(parseCartStorage("not-json"), []);
    assert.deepEqual(parseCartStorage(JSON.stringify([item("01", 1)])), []);
    assert.deepEqual(parseCartStorage(JSON.stringify({ version: 1, items: [item("01", 1)] })), []);
    assert.deepEqual(
      parseCartStorage(JSON.stringify({ version: CART_STORAGE_VERSION, items: [item("01", 1), { quantity: -1 }] })),
      [item("01", 1)]
    );
    assert.deepEqual(
      parseCartStorage(JSON.stringify({ version: CART_STORAGE_VERSION, items: [{ ...item("01", 1), imageUrl: null }] })),
      []
    );
  });
});
