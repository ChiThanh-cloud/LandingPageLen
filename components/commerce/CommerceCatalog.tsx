"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  filterCommerceProducts,
  getCommerceCategoryLabel,
  getCommerceOptionSummary,
  getCommercePriceLabel,
  getCommerceProductPath,
  getCommerceStatusLabel,
  type CommerceCatalogFilter
} from "@/lib/products/commerce-catalog";
import type { CommerceProduct } from "@/types/commerce-product";
import styles from "./CommerceCatalog.module.css";

const filters: Array<{ value: CommerceCatalogFilter; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "yarn", label: "Len sợi" },
  { value: "accessory", label: "Phụ kiện" }
];

function ProductCard({ product }: { product: CommerceProduct }) {
  const statusLabel = getCommerceStatusLabel(product.status);

  return (
    <Link href={getCommerceProductPath(product)} className={styles.card}>
      <div className={styles.imageFrame}>
        {product.image ? (
          <Image
            src={product.image}
            alt={`Ảnh ${product.name}`}
            width={560}
            height={420}
            sizes="(max-width: 640px) 100vw, (max-width: 980px) 50vw, 33vw"
          />
        ) : <span className={styles.imageEmpty}>Chưa có ảnh</span>}
        {statusLabel ? <span className={styles.status}>{statusLabel}</span> : null}
      </div>
      <div className={styles.cardBody}>
        <span className={styles.category}>{getCommerceCategoryLabel(product.category)}</span>
        <h2>{product.name}</h2>
        <p className={styles.price}>{getCommercePriceLabel(product)}</p>
        <p className={styles.optionSummary}>{getCommerceOptionSummary(product)}</p>
        <span className={styles.cta}>Xem sản phẩm <span aria-hidden="true">→</span></span>
      </div>
    </Link>
  );
}

export function CommerceCatalog({ products }: { products: CommerceProduct[] }) {
  const [filter, setFilter] = useState<CommerceCatalogFilter>("all");
  const visibleProducts = useMemo(() => filterCommerceProducts(products, filter), [filter, products]);

  return (
    <section className={styles.catalog} aria-labelledby="commerce-catalog-heading">
      <div className={styles.toolbar}>
        <div>
          <p className={styles.eyebrow}>Danh mục sản phẩm</p>
          <h2 id="commerce-catalog-heading">Chọn sản phẩm phù hợp</h2>
        </div>
        <div className={styles.filters} aria-label="Lọc loại sản phẩm">
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={filter === item.value}
              className={filter === item.value ? styles.filterActive : undefined}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <p className={styles.count} aria-live="polite">{visibleProducts.length} sản phẩm đang hiển thị</p>
      {visibleProducts.length > 0 ? (
        <div className={styles.grid}>
          {visibleProducts.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : (
        <div className={styles.empty}>
          <h2>Hiện Tiny chưa có sản phẩm đang hiển thị.</h2>
          <p>Hãy quay lại sau hoặc chọn một bộ lọc khác.</p>
        </div>
      )}
    </section>
  );
}
