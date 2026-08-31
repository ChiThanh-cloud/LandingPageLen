"use client";

import Image from "next/image";
import { useDeferredValue, useMemo, useState } from "react";
import type { AdminInventoryProduct, AdminInventoryVariant } from "@/lib/admin/admin-service";
import {
  getInventoryCategoryCounts,
  getInventoryCategoryGroups,
  type InventoryFilter
} from "@/lib/admin/catalog-organization";
import {
  getInventoryOptionLabel,
  getInventoryStockText,
  getInventoryUnitLabel,
  getInventoryVariantValue
} from "@/lib/admin/inventory-presentation";
import { StockEditor } from "./StockEditor";
import styles from "./Admin.module.css";

type InventoryCatalogProps = {
  products: AdminInventoryProduct[];
  variants: AdminInventoryVariant[];
};

const inventoryFilters: Array<{ value: InventoryFilter; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "yarn", label: "Len sợi" },
  { value: "accessory", label: "Phụ kiện" },
  { value: "unmanaged", label: "Chưa quản lý" }
];

function getProductSummary(product: AdminInventoryProduct, variants: AdminInventoryVariant[]) {
  const managedVariants = variants.filter((variant) => variant.stock !== null);
  const unmanagedCount = variants.length - managedVariants.length;
  const totalStock = managedVariants.reduce((total, variant) => total + (variant.stock || 0), 0);
  const variantNoun = product.category === "yarn" ? "mã màu" : "lựa chọn";
  const parts = [
    `${variants.length} ${variantNoun}`,
    `${managedVariants.length} đang quản lý`
  ];

  if (unmanagedCount) parts.push(`${unmanagedCount} chưa quản lý`);
  if (managedVariants.length) parts.push(`tổng ${totalStock.toLocaleString("vi-VN")} ${getInventoryUnitLabel(product)}`);
  return parts.join(" · ");
}

export function InventoryCatalog({ products, variants }: InventoryCatalogProps) {
  const [activeFilter, setActiveFilter] = useState<InventoryFilter>("all");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const counts = useMemo(() => getInventoryCategoryCounts(products, variants), [products, variants]);
  const groups = useMemo(
    () => getInventoryCategoryGroups(products, variants, deferredQuery, activeFilter),
    [activeFilter, deferredQuery, products, variants]
  );
  const visibleVariantCount = useMemo(
    () => groups.reduce(
      (categoryTotal, categoryGroup) => categoryTotal + categoryGroup.productGroups.reduce(
        (productTotal, productGroup) => productTotal + productGroup.variants.length,
        0
      ),
      0
    ),
    [groups]
  );

  return (
    <section className={styles.inventoryCatalog} aria-label="Danh mục tồn kho">
      <div className={styles.catalogToolbar}>
        <div className={styles.filterScroller} role="group" aria-label="Lọc tồn kho">
          {inventoryFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={activeFilter === filter.value ? styles.filterChipActive : styles.filterChip}
              aria-pressed={activeFilter === filter.value}
              onClick={() => setActiveFilter(filter.value)}
            >
              <span>{filter.label}</span>
              <strong>{counts[filter.value].toLocaleString("vi-VN")}</strong>
            </button>
          ))}
        </div>
        <label className={styles.catalogSearch}>
          <span className={styles.srOnly}>Tìm trong tồn kho</span>
          <input
            type="search"
            placeholder="Tìm sản phẩm, màu, size hoặc SKU..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>

      <p className={styles.srOnly} aria-live="polite">Đang hiển thị {visibleVariantCount} SKU</p>
      <div className={styles.inventoryCategories}>
        {groups.map((categoryGroup) => {
          const categoryVariantCount = categoryGroup.productGroups.reduce((total, group) => total + group.variants.length, 0);
          return (
            <section className={styles.inventoryCategory} key={categoryGroup.value} aria-labelledby={`inventory-${categoryGroup.value}`}>
              <header className={styles.inventoryCategoryHeader}>
                <span className={styles.categorySymbol} aria-hidden="true">{categoryGroup.symbol}</span>
                <div>
                  <h2 id={`inventory-${categoryGroup.value}`}>{categoryGroup.label}</h2>
                  <p>{categoryGroup.description}</p>
                </div>
                <span className={styles.categoryCount}>{categoryVariantCount.toLocaleString("vi-VN")} SKU</span>
              </header>

              <div className={styles.inventoryProductGroups}>
                {categoryGroup.productGroups.map(({ product, variants: productVariants }) => {
                  const headingId = `inventory-product-${product.id}`;
                  const optionLabel = getInventoryOptionLabel(product);
                  const unitLabel = getInventoryUnitLabel(product);
                  return (
                    <section className={styles.inventoryProductGroup} key={String(product.id)} aria-labelledby={headingId}>
                      <header className={styles.inventoryProductHeader}>
                        <h3 id={headingId}>{product.name || "Sản phẩm chưa đặt tên"}</h3>
                        <p>{getProductSummary(product, productVariants)}</p>
                      </header>
                      <div className={styles.inventoryGrid}>
                        {productVariants.map((variant) => {
                          const variantValue = getInventoryVariantValue(product, variant);
                          return (
                            <article className={styles.inventoryCard} key={String(variant.id)}>
                              <div className={styles.inventoryVisual}>
                                {variant.image_url ? (
                                  <Image
                                    src={variant.image_url}
                                    alt={`${product.name || "Sản phẩm"} – ${variantValue}`}
                                    width={84}
                                    height={84}
                                    sizes="84px"
                                  />
                                ) : <span className={styles.imagePlaceholder}>Chưa có ảnh</span>}
                              </div>
                              <div className={styles.inventoryInfo}>
                                <strong>{optionLabel}: {variantValue}</strong>
                                <span>SKU: {variant.sku || "—"}</span>
                                <span>Trạng thái: {variant.status || "—"}</span>
                                <span className={variant.stock === null ? styles.stockUnmanaged : styles.stockManaged}>
                                  {getInventoryStockText(variant.stock, unitLabel)}
                                </span>
                              </div>
                              <StockEditor variantId={String(variant.id)} stock={variant.stock} />
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            </section>
          );
        })}
        {!groups.length ? <p className={styles.empty}>Không tìm thấy SKU phù hợp.</p> : null}
      </div>
    </section>
  );
}
