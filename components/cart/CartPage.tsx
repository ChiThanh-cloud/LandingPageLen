"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  getCommerceCartOptionDescription,
  getCommerceCartStockLabel,
  getCommerceCartSubtotal,
  getCommerceItemAccessibleLabel,
  getCommerceUnitPriceLabel,
  resolveCommerceCartItems,
  type ResolvedCommerceCartItem
} from "@/lib/cart/cart-commerce";
import type { CommerceProduct } from "@/types/commerce-product";
import { useCart } from "./CartProvider";
import styles from "./Cart.module.css";

function CartItemMedia({ entry }: { entry: ResolvedCommerceCartItem }) {
  const label = getCommerceItemAccessibleLabel(entry);
  const content = entry.imageUrl ? (
    <Image src={entry.imageUrl} alt={label} width={144} height={144} sizes="(max-width: 600px) 88px, 120px" />
  ) : (
    <span className={styles.noImage} role="img" aria-label={`${label}, chưa có ảnh`}>Chưa có ảnh</span>
  );

  return entry.detailPath ? (
    <Link href={entry.detailPath} className={styles.itemImage} aria-label={`Xem ${label}`}>{content}</Link>
  ) : (
    <div className={styles.itemImage}>{content}</div>
  );
}

function CartItemName({ entry }: { entry: ResolvedCommerceCartItem }) {
  return entry.detailPath ? (
    <Link href={entry.detailPath} className={styles.itemName}>{entry.productName}</Link>
  ) : (
    <span className={styles.itemName}>{entry.productName}</span>
  );
}

export function CartPage({ products }: { products: CommerceProduct[] }) {
  const { items, hydrated, updateQuantity, removeItem, clearCart } = useCart();
  const [message, setMessage] = useState("");
  const resolvedItems = useMemo(() => resolveCommerceCartItems(items, products), [items, products]);

  // CLIENT TOTAL IS FOR DISPLAY ONLY. Checkout re-queries trusted prices through the order backend.
  const displaySubtotal = getCommerceCartSubtotal(resolvedItems);

  if (!hydrated) {
    return (
      <main className={styles.page}>
        <div className={styles.shell} role="status" aria-live="polite">
          <div className={styles.loading}>Đang tải giỏ hàng…</div>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className={styles.page}>
        <div className={styles.shell}>
          <section className={styles.emptyState}>
            <span className={styles.emptyIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 4h2l2.1 10.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L20 7H6" />
                <circle cx="9.5" cy="19.5" r="1" /><circle cx="17.5" cy="19.5" r="1" />
              </svg>
            </span>
            <p className={styles.eyebrow}>Giỏ hàng Tiny</p>
            <h1>Giỏ hàng của bạn đang trống</h1>
            <p>Chọn len hoặc phụ kiện phù hợp, Tiny sẽ giữ lại lựa chọn của bạn ngay trên thiết bị này.</p>
            <Link href="/len-soi-va-phu-kien" className={styles.primaryLink}>Tiếp tục mua sắm</Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>Giỏ hàng Tiny</p>
            <h1>Giỏ hàng của bạn</h1>
            <p>Kiểm tra lựa chọn và số lượng trước khi tiếp tục.</p>
          </div>
          <button
            type="button"
            className={styles.clearButton}
            onClick={() => {
              if (window.confirm("Bạn muốn xóa toàn bộ sản phẩm khỏi giỏ hàng?")) {
                clearCart();
                setMessage("Đã xóa toàn bộ giỏ hàng.");
              }
            }}
          >
            Xóa toàn bộ
          </button>
        </header>

        <p className={styles.liveMessage} role="status" aria-live="polite">{message}</p>

        <div className={styles.cartLayout}>
          <section className={styles.itemList} aria-label="Sản phẩm trong giỏ hàng">
            {resolvedItems.map((entry) => {
              const { item, productName, variantName, optionLabel, unitLabel, stock, isAvailable, displayPrice } = entry;
              const optionDescription = getCommerceCartOptionDescription(entry);
              const itemDescription = optionDescription ? `${productName} – ${optionDescription}` : productName;
              const atStockLimit = stock !== null && item.quantity >= stock;
              const updateMessage = `Đã cập nhật ${itemDescription}.`;
              return (
                <article className={styles.cartItem} key={`${item.productId}-${item.variantId}`}>
                  <CartItemMedia entry={entry} />

                  <div className={styles.itemDetails}>
                    <CartItemName entry={entry} />
                    {optionDescription ? <p>{optionLabel}: <strong>{variantName}</strong></p> : null}
                    <p className={styles.stockText}>{getCommerceCartStockLabel(entry)}</p>
                    <strong className={styles.mobilePrice}>{getCommerceUnitPriceLabel(displayPrice, unitLabel)}</strong>

                    <div className={styles.itemActions}>
                      <div className={styles.quantityControl} aria-label={`Số lượng ${itemDescription}`}>
                        <button
                          type="button"
                          aria-label={`Giảm số lượng ${itemDescription}`}
                          disabled={item.quantity <= 1}
                          onClick={() => {
                            const result = updateQuantity(item.productId, item.variantId, item.quantity - 1, stock);
                            if (result.code === "updated") setMessage(updateMessage);
                          }}
                        >−</button>
                        <output aria-live="polite">{item.quantity}</output>
                        <button
                          type="button"
                          aria-label={`Tăng số lượng ${itemDescription}`}
                          disabled={!isAvailable || atStockLimit}
                          onClick={() => {
                            const result = updateQuantity(item.productId, item.variantId, item.quantity + 1, stock);
                            if (result.code === "stock-capped" || result.code === "stock-limit") {
                              setMessage(stock !== null && unitLabel
                                ? `Hiện chỉ còn ${stock.toLocaleString("vi-VN")} ${unitLabel}.`
                                : `${itemDescription} đã đạt số lượng hiện có.`);
                            } else if (result.code === "updated") {
                              setMessage(updateMessage);
                            }
                          }}
                        >+</button>
                      </div>
                      <button
                        type="button"
                        className={styles.removeButton}
                        aria-label={`Xóa ${itemDescription} khỏi giỏ hàng`}
                        onClick={() => {
                          removeItem(item.productId, item.variantId);
                          setMessage(`Đã xóa ${itemDescription} khỏi giỏ hàng.`);
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>

                  <div className={styles.itemPrice}>
                    <strong>{(displayPrice * item.quantity).toLocaleString("vi-VN")}đ</strong>
                    <span>{getCommerceUnitPriceLabel(displayPrice, unitLabel)}</span>
                  </div>
                </article>
              );
            })}
          </section>

          <aside className={styles.summary} aria-labelledby="cart-summary-heading">
            <h2 id="cart-summary-heading">Tóm tắt đơn</h2>
            <div className={styles.summaryRow}>
              <span>Tạm tính</span>
              <strong>{displaySubtotal.toLocaleString("vi-VN")}đ</strong>
            </div>
            <p className={styles.summaryNote}>Giá và tình trạng sản phẩm sẽ được kiểm tra lại khi bạn đặt hàng.</p>
            <Link href="/thanh-toan" className={styles.checkoutButton}>Tiến hành thanh toán</Link>
            <p className={styles.checkoutNote}>Bạn sẽ kiểm tra thông tin giao hàng ở bước tiếp theo.</p>
            <Link href="/len-soi-va-phu-kien" className={styles.continueLink}>← Tiếp tục mua sắm</Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
