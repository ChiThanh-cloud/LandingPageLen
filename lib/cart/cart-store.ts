import type { CartItem } from "@/types/yarn-product";

export const CART_STORAGE_KEY = "lentiny_cart_v2";
export const CART_STORAGE_VERSION = 2;

type PersistedCart = {
  version: typeof CART_STORAGE_VERSION;
  items: CartItem[];
};

export type CartMutationCode =
  | "added"
  | "updated"
  | "stock-capped"
  | "stock-limit"
  | "out-of-stock"
  | "invalid-quantity"
  | "not-found";

export type CartMutationResult = {
  items: CartItem[];
  code: CartMutationCode;
  acceptedQuantity: number;
  quantity: number;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    isNonEmptyString(item.productId) &&
    isNonEmptyString(item.variantId) &&
    Number.isInteger(item.quantity) &&
    Number(item.quantity) > 0 &&
    isNonEmptyString(item.slug) &&
    isNonEmptyString(item.productName) &&
    isNonEmptyString(item.variantName) &&
    typeof item.colorCode === "string" &&
    typeof item.imageUrl === "string" &&
    typeof item.displayPrice === "number" &&
    Number.isFinite(item.displayPrice) &&
    item.displayPrice >= 0
  );
}

function sanitizeItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  const unique = new Map<string, CartItem>();

  for (const candidate of value) {
    if (!isCartItem(candidate)) continue;
    const item = { ...candidate };
    const key = cartItemKey(item.productId, item.variantId);
    const existing = unique.get(key);
    unique.set(key, existing ? { ...item, quantity: existing.quantity + item.quantity } : item);
  }

  return [...unique.values()];
}

export function parseCartStorage(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return [];
    const persisted = value as Partial<PersistedCart>;
    if (persisted.version !== CART_STORAGE_VERSION) return [];
    return sanitizeItems(persisted.items);
  } catch {
    return [];
  }
}

export function serializeCart(items: CartItem[]): string {
  const payload: PersistedCart = {
    version: CART_STORAGE_VERSION,
    items: sanitizeItems(items)
  };
  return JSON.stringify(payload);
}

export function cartItemKey(productId: string, variantId: string) {
  return `${productId}::${variantId}`;
}

export function getTotalCartQuantity(items: CartItem[]) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

function normalizedStock(stock: number | null) {
  if (stock === null) return null;
  if (!Number.isFinite(stock)) return 0;
  return Math.max(0, Math.floor(stock));
}

export function addCartItem(
  items: CartItem[],
  item: CartItem,
  availableStock: number | null
): CartMutationResult {
  if (!Number.isInteger(item.quantity) || item.quantity < 1) {
    return { items, code: "invalid-quantity", acceptedQuantity: 0, quantity: 0 };
  }

  const stock = normalizedStock(availableStock);
  if (stock === 0) {
    return { items, code: "out-of-stock", acceptedQuantity: 0, quantity: 0 };
  }

  const key = cartItemKey(item.productId, item.variantId);
  const existing = items.find((candidate) => cartItemKey(candidate.productId, candidate.variantId) === key);
  const currentQuantity = existing?.quantity ?? 0;

  if (stock !== null && currentQuantity >= stock) {
    return { items, code: "stock-limit", acceptedQuantity: 0, quantity: currentQuantity };
  }

  const requestedQuantity = currentQuantity + item.quantity;
  const nextQuantity = stock === null ? requestedQuantity : Math.min(requestedQuantity, stock);
  const nextItem = { ...item, quantity: nextQuantity };
  const nextItems = existing
    ? items.map((candidate) => cartItemKey(candidate.productId, candidate.variantId) === key ? nextItem : candidate)
    : [...items, nextItem];
  const wasCapped = stock !== null && requestedQuantity > stock;

  return {
    items: nextItems,
    code: wasCapped ? "stock-capped" : existing ? "updated" : "added",
    acceptedQuantity: nextQuantity - currentQuantity,
    quantity: nextQuantity
  };
}

export function updateCartItemQuantity(
  items: CartItem[],
  productId: string,
  variantId: string,
  quantity: number,
  availableStock: number | null
): CartMutationResult {
  const key = cartItemKey(productId, variantId);
  const existing = items.find((item) => cartItemKey(item.productId, item.variantId) === key);
  if (!existing) return { items, code: "not-found", acceptedQuantity: 0, quantity: 0 };
  if (!Number.isInteger(quantity) || quantity < 1) {
    return { items, code: "invalid-quantity", acceptedQuantity: 0, quantity: existing.quantity };
  }

  if (quantity < existing.quantity) {
    const nextItems = items.map((item) =>
      cartItemKey(item.productId, item.variantId) === key ? { ...item, quantity } : item
    );
    return {
      items: nextItems,
      code: "updated",
      acceptedQuantity: quantity - existing.quantity,
      quantity
    };
  }

  const stock = normalizedStock(availableStock);
  if (stock === 0) {
    return { items, code: "out-of-stock", acceptedQuantity: 0, quantity: existing.quantity };
  }

  const nextQuantity = stock === null ? quantity : Math.min(quantity, stock);
  const nextItems = items.map((item) =>
    cartItemKey(item.productId, item.variantId) === key ? { ...item, quantity: nextQuantity } : item
  );

  return {
    items: nextItems,
    code: stock !== null && quantity > stock ? "stock-capped" : "updated",
    acceptedQuantity: nextQuantity - existing.quantity,
    quantity: nextQuantity
  };
}

export function removeCartItem(items: CartItem[], productId: string, variantId: string) {
  const key = cartItemKey(productId, variantId);
  return items.filter((item) => cartItemKey(item.productId, item.variantId) !== key);
}

export function clearCartItems(): CartItem[] {
  return [];
}
