"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { YarnProduct } from "@/types/yarn-product";
import { useCart } from "./CartProvider";
import styles from "./Cart.module.css";

export function CartPage({ products }: { products: YarnProduct[] }) {
  const { items, hydrated, updateQuantity, removeItem, clearCart } = useCart();
  const [message, setMessage] = useState("");

  const resolvedItems = useMemo(() => items.map((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    const variant = product?.variants.find((candidate) => candidate.id === item.variantId);
    return {
      item,
      product,
      variant,
      isAvailable: Boolean(product && variant && variant.stock !== 0),
      displayPrice: product?.price ?? item.displayPrice,
      imageUrl: variant?.image || product?.image || item.imageUrl
    };
  }), [items, products]);

  // CLIENT TOTAL IS FOR DISPLAY ONLY. Checkout must re-query trusted prices from Supabase.
  const displaySubtotal = resolvedItems.reduce((total, entry) => total + entry.displayPrice * entry.item.quantity, 0);

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
            <p>Chọn dòng len và mã màu phù hợp, Tiny sẽ giữ lại lựa chọn của bạn ngay trên thiết bị này.</p>
            <Link href="/len-soi" className={styles.primaryLink}>Tiếp tục mua len</Link>
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
            <p>Kiểm tra mã màu và số lượng trước khi tiếp tục.</p>
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
            {resolvedItems.map(({ item, product, variant, isAvailable, displayPrice, imageUrl }) => {
              const productName = product?.name || item.productName;
              const variantName = variant?.colorName || item.variantName;
              const stock = variant?.stock ?? null;
              const atStockLimit = stock !== null && item.quantity >= stock;
              return (
                <article className={styles.cartItem} key={`${item.productId}-${item.variantId}`}>
                  <Link href={`/len-soi/${product?.slug || item.slug}`} className={styles.itemImage} aria-label={`Xem ${productName}, màu ${variantName}`}>
                    <Image src={imageUrl} alt={`${productName}, màu ${variantName}`} width={144} height={144} sizes="(max-width: 600px) 88px, 120px" />
                  </Link>

                  <div className={styles.itemDetails}>
                    <Link href={`/len-soi/${product?.slug || item.slug}`} className={styles.itemName}>{productName}</Link>
                    <p>Mã màu: <strong>{variantName}</strong></p>
                    <p className={styles.stockText}>
                      {!product || !variant ? "Sản phẩm hoặc mã màu không còn khả dụng" : variant.stock === null ? "Liên hệ Tiny để xác nhận số lượng lớn" : variant.stock > 0 ? `Còn hàng: ${variant.stock.toLocaleString("vi-VN")} cuộn` : "Hết hàng"}
                    </p>
                    <strong className={styles.mobilePrice}>{displayPrice.toLocaleString("vi-VN")}đ / cuộn</strong>

                    <div className={styles.itemActions}>
                      <div className={styles.quantityControl} aria-label={`Số lượng ${productName}, màu ${variantName}`}>
                        <button
                          type="button"
                          aria-label={`Giảm số lượng ${productName}, màu ${variantName}`}
                          disabled={!isAvailable || item.quantity <= 1}
                          onClick={() => {
                            const result = updateQuantity(item.productId, item.variantId, item.quantity - 1, stock);
                            if (result.code === "updated") setMessage(`Đã cập nhật ${productName} - màu ${variantName}.`);
                          }}
                        >−</button>
                        <output aria-live="polite">{item.quantity}</output>
                        <button
                          type="button"
                          aria-label={`Tăng số lượng ${productName}, màu ${variantName}`}
                          disabled={!isAvailable || atStockLimit}
                          onClick={() => {
                            const result = updateQuantity(item.productId, item.variantId, item.quantity + 1, stock);
                            if (result.code === "stock-capped" || result.code === "stock-limit") {
                              setMessage(`${productName} - màu ${variantName} đã đạt số lượng hiện có.`);
                            } else if (result.code === "updated") {
                              setMessage(`Đã cập nhật ${productName} - màu ${variantName}.`);
                            }
                          }}
                        >+</button>
                      </div>
                      <button
                        type="button"
                        className={styles.removeButton}
                        aria-label={`Xóa ${productName} màu ${variantName} khỏi giỏ hàng`}
                        onClick={() => {
                          removeItem(item.productId, item.variantId);
                          setMessage(`Đã xóa ${productName} - màu ${variantName} khỏi giỏ hàng.`);
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>

                  <div className={styles.itemPrice}>
                    <strong>{(displayPrice * item.quantity).toLocaleString("vi-VN")}đ</strong>
                    <span>{displayPrice.toLocaleString("vi-VN")}đ / cuộn</span>
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
            <Link href="/len-soi" className={styles.continueLink}>← Tiếp tục mua len</Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
