"use client";

import styles from "./YarnProductDetail.module.css";

export function QuantitySelector({ quantity, stock, onChange }: { quantity: number; stock: number | null; onChange: (quantity: number) => void }) {
  return (
    <div className={styles.quantityRow}>
      <span className={styles.quantityLabel}>Số lượng</span>
      <div className={styles.quantity} aria-label="Chọn số lượng">
        <button type="button" onClick={() => onChange(Math.max(1, quantity - 1))} disabled={quantity <= 1} aria-label="Giảm số lượng">−</button>
        <output aria-live="polite">{quantity}</output>
        <button type="button" onClick={() => onChange(stock === null ? quantity + 1 : Math.min(stock, quantity + 1))} disabled={stock !== null && quantity >= stock} aria-label="Tăng số lượng">+</button>
      </div>
      <small className={styles.stock}>{stock === null ? "Liên hệ Tiny để xác nhận số lượng lớn." : stock > 0 ? `Còn hàng: ${stock.toLocaleString("vi-VN")} cuộn` : "Hết hàng"}</small>
    </div>
  );
}
