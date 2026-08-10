"use client";

import Image from "next/image";
import type { YarnVariant } from "@/types/yarn-product";
import styles from "./YarnProductDetail.module.css";

export function VariantSelector({ variants, selected, onSelect }: { variants: YarnVariant[]; selected: YarnVariant; onSelect: (variant: YarnVariant) => void }) {
  return (
    <fieldset className={styles.variants}>
      <legend>Mã màu: <strong>{selected.colorName}</strong></legend>
      <div className={styles.swatchGrid}>
        {variants.map((variant) => (
          <button
            key={variant.id}
            type="button"
            className={`${styles.swatch} ${variant.id === selected.id ? styles.swatchActive : ""}`}
            onClick={() => onSelect(variant)}
            disabled={variant.stock === 0}
            aria-label={`${variant.colorName}${variant.stock === 0 ? ", hết hàng" : variant.stock === null ? ", liên hệ Tiny để xác nhận số lượng" : `, còn hàng ${variant.stock.toLocaleString("vi-VN")} cuộn`}`}
            aria-pressed={variant.id === selected.id}
            title={variant.colorName}
          >
            <span className={styles.swatchImage}>
              <Image src={variant.image} alt="" width={32} height={32} sizes="32px" />
            </span>
            <small>{variant.colorName}</small>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
