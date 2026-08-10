"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import {
  addCartItem,
  CART_STORAGE_KEY,
  clearCartItems,
  getTotalCartQuantity,
  parseCartStorage,
  removeCartItem,
  serializeCart,
  updateCartItemQuantity,
  type CartMutationResult
} from "@/lib/cart/cart-store";
import type { CartItem } from "@/types/yarn-product";

type CartState = {
  items: CartItem[];
  hydrated: boolean;
};

type CartAction =
  | { type: "hydrate"; items: CartItem[] }
  | { type: "replace"; items: CartItem[] };

type CartContextValue = CartState & {
  totalQuantity: number;
  addItem: (item: CartItem, availableStock: number | null) => CartMutationResult;
  updateQuantity: (productId: string, variantId: string, quantity: number, availableStock: number | null) => CartMutationResult;
  removeItem: (productId: string, variantId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function cartReducer(state: CartState, action: CartAction): CartState {
  if (action.type === "hydrate") return { items: action.items, hydrated: true };
  return { ...state, items: action.items };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], hydrated: false });
  const itemsRef = useRef<CartItem[]>([]);
  const skipNextWriteRef = useRef(false);

  const replaceItems = useCallback((items: CartItem[]) => {
    itemsRef.current = items;
    dispatch({ type: "replace", items });
  }, []);

  useEffect(() => {
    let items: CartItem[] = [];
    try {
      items = parseCartStorage(window.localStorage.getItem(CART_STORAGE_KEY));
    } catch {
      items = [];
    }
    itemsRef.current = items;
    dispatch({ type: "hydrate", items });
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    if (skipNextWriteRef.current) {
      skipNextWriteRef.current = false;
      return;
    }
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, serializeCart(state.items));
    } catch {
      // Cart remains usable in memory when storage is unavailable or full.
    }
  }, [state.hydrated, state.items]);

  useEffect(() => {
    const syncAcrossTabs = (event: StorageEvent) => {
      if (event.key !== CART_STORAGE_KEY) return;
      const items = parseCartStorage(event.newValue);
      skipNextWriteRef.current = true;
      itemsRef.current = items;
      dispatch({ type: "replace", items });
    };
    window.addEventListener("storage", syncAcrossTabs);
    return () => window.removeEventListener("storage", syncAcrossTabs);
  }, []);

  const addItem = useCallback((item: CartItem, availableStock: number | null) => {
    const result = addCartItem(itemsRef.current, item, availableStock);
    if (result.items !== itemsRef.current) replaceItems(result.items);
    return result;
  }, [replaceItems]);

  const updateQuantity = useCallback((productId: string, variantId: string, quantity: number, availableStock: number | null) => {
    const result = updateCartItemQuantity(itemsRef.current, productId, variantId, quantity, availableStock);
    if (result.items !== itemsRef.current) replaceItems(result.items);
    return result;
  }, [replaceItems]);

  const removeItem = useCallback((productId: string, variantId: string) => {
    replaceItems(removeCartItem(itemsRef.current, productId, variantId));
  }, [replaceItems]);

  const clearCart = useCallback(() => replaceItems(clearCartItems()), [replaceItems]);

  const value = useMemo<CartContextValue>(() => ({
    ...state,
    totalQuantity: getTotalCartQuantity(state.items),
    addItem,
    updateQuantity,
    removeItem,
    clearCart
  }), [addItem, clearCart, removeItem, state, updateQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
