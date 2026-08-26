"use client";

import Image from "next/image";
import { getCommerceStatusLabel } from "@/lib/products/commerce-catalog";
import { isCommerceVariantOrderable } from "@/lib/products/commerce-orderability";
import type { YarnVariant } from "@/types/yarn-product";
import styles from "./YarnProductDetail.module.css";

export function VariantSelector({ variants, selected, onSelect }: { variants: YarnVariant[]; selected: YarnVariant; onSelect: (variant: YarnVariant) => void }) {
  return (
    <fieldset className={styles.variants}>
      <legend>Mã màu: <strong>{selected.colorName}</strong></legend>
      <div className={styles.swatchGrid}>
        {variants.map((variant) => {
          const visibleStatus = variant.stock === 0 || variant.status === "out"
            ? "Hết hàng"
            : getCommerceStatusLabel(variant.status);
          const disabled = variant.stock === 0 || !isCommerceVariantOrderable(variant.status);
          const availabilityLabel = visibleStatus
            ? `, ${visibleStatus.toLocaleLowerCase("vi-VN")}`
            : variant.stock === null
              ? ", liên hệ Tiny để xác nhận số lượng lớn"
              : `, còn hàng ${variant.stock.toLocaleString("vi-VN")} cuộn`;

          return (
            <button
              key={variant.id}
              type="button"
              className={`${styles.swatch} ${variant.id === selected.id ? styles.swatchActive : ""}`}
              onClick={() => onSelect(variant)}
              disabled={disabled}
              aria-label={`${variant.colorName}${availabilityLabel}`}
              aria-pressed={variant.id === selected.id}
              title={variant.colorName}
            >
              <span className={styles.swatchImage}>
                <Image src={variant.image} alt="" width={32} height={32} sizes="32px" />
              </span>
              <small>{variant.colorName}{visibleStatus ? ` · ${visibleStatus}` : ""}</small>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
