"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";
import {
  isCommerceProductOrderable,
  isCommerceVariantOrderable
} from "@/lib/products/commerce-orderability";
import { getCommerceVariantPrice } from "@/lib/products/commerce-pricing";
import type { YarnProduct, YarnVariant } from "@/types/yarn-product";
import styles from "./YarnProductDetail.module.css";

export function ProductActions({ product, variant, quantity }: { product: YarnProduct; variant: YarnVariant; quantity: number }) {
  const [message, setMessage] = useState("");
  const { addItem } = useCart();
  const router = useRouter();
  const displayPrice = getCommerceVariantPrice(product, variant);
  const disabled = !isCommerceProductOrderable(product.status)
    || !isCommerceVariantOrderable(variant.status)
    || variant.stock === 0
    || displayPrice === null;
  return (
    <div className={styles.actionsWrap}>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.addButton}
          disabled={disabled}
          onClick={() => {
            if (disabled || displayPrice === null) return;
            const result = addItem({
              productId: product.id,
              variantId: variant.id,
              quantity,
              slug: product.slug,
              productName: product.name,
              variantName: variant.colorName,
              colorCode: variant.colorCode,
              imageUrl: variant.image || product.image,
              displayPrice
            }, variant.stock);

            if (result.code === "stock-capped") {
              setMessage(`Đã thêm ${result.acceptedQuantity} cuộn ${product.name} - màu ${variant.colorName}. Giỏ hàng đã đạt số lượng hiện có.`);
            } else if (result.code === "stock-limit") {
              setMessage(`${product.name} - màu ${variant.colorName} đã đạt số lượng hiện có trong giỏ hàng.`);
            } else if (result.code === "out-of-stock") {
              setMessage(`${product.name} - màu ${variant.colorName} hiện đã hết hàng.`);
            } else if (result.code === "invalid-quantity") {
              setMessage("Số lượng cần ít nhất là 1.");
            } else {
              setMessage(`Đã thêm ${product.name} - màu ${variant.colorName} vào giỏ hàng.`);
            }
          }}
        >
          Thêm vào giỏ hàng
        </button>
        <button
          type="button"
          className={`${styles.buyButton} ${disabled ? styles.disabledAction : ""}`}
          disabled={disabled}
          onClick={() => {
            if (disabled || displayPrice === null) return;
            addItem({
              productId: product.id,
              variantId: variant.id,
              quantity,
              slug: product.slug,
              productName: product.name,
              variantName: variant.colorName,
              colorCode: variant.colorCode,
              imageUrl: variant.image || product.image,
              displayPrice
            }, variant.stock);
            router.push("/gio-hang");
          }}
        >
          Mua ngay
        </button>
      </div>
      <p className={styles.actionMessage} role="status">{message}</p>
    </div>
  );
}
