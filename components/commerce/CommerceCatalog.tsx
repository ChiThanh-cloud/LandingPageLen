"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  getCommerceCategoryLabel,
  getCommerceDisplayPrice,
  getCommerceOptionSummary,
  getCommercePriceLabel,
  getCommerceProductPath
} from "@/lib/products/commerce-catalog";
import type { CommerceProduct } from "@/types/commerce-product";

type CatalogScope = "all" | "accessory";
type YarnSubcategory = "milk-cotton" | "len-nhung" | "len-cotton" | "len-baby" | "len-acrylic" | "len-dac-biet";
type ProductFilter = "all" | YarnSubcategory;
type PriceFilter = "all" | "under-20" | "20-50" | "50-100" | "over-100";
type SortOption = "newest" | "price-asc" | "price-desc";

const yarnCategories: Array<{ value: YarnSubcategory; label: string; short: string }> = [
  { value: "milk-cotton", label: "Milk Cotton", short: "Milk Cotton" },
  { value: "len-nhung", label: "Len Nhung", short: "Nhung" },
  { value: "len-cotton", label: "Len Cotton", short: "Cotton" },
  { value: "len-baby", label: "Len Baby", short: "Baby" },
  { value: "len-acrylic", label: "Len Acrylic", short: "Acrylic" },
  { value: "len-dac-biet", label: "Len đặc biệt", short: "Đặc biệt" }
];

const priceRanges: Array<{ value: PriceFilter; label: string }> = [
  { value: "all", label: "Tất cả mức giá" },
  { value: "under-20", label: "Dưới 20.000đ" },
  { value: "20-50", label: "20.000đ – 50.000đ" },
  { value: "50-100", label: "50.000đ – 100.000đ" },
  { value: "over-100", label: "Trên 100.000đ" }
];

function matchesPrice(price: number | null, filter: PriceFilter) {
  if (filter === "all") return true;
  if (price === null) return false;
  if (filter === "under-20") return price < 20000;
  if (filter === "20-50") return price >= 20000 && price <= 50000;
  if (filter === "50-100") return price > 50000 && price <= 100000;
  return price > 100000;
}

function getAvailabilityCopy(product: CommerceProduct) {
  if (product.status === "out") return "Hết hàng";
  if (product.variants.length === 0) return "Chưa có lựa chọn";

  const orderableVariants = product.variants.filter((variant) => variant.status !== "out" && variant.status !== "hidden" && variant.stock !== 0);
  if (orderableVariants.length === 0) return "Hết hàng";
  if (product.status === "preorder") return "Đặt trước";
  return "Xem lựa chọn";
}

function ProductCard({ product }: { product: CommerceProduct }) {
  return (
    <Link href={getCommerceProductPath(product)} className="yc-card">
      <div className="yc-card-image">
        {product.image ? (
          <Image
            src={product.image}
            alt={`${product.name} tại Tiệm Len Nhà Tiny`}
            width={520}
            height={520}
            sizes="(max-width: 389px) 100vw, (max-width: 767px) 50vw, (max-width: 1100px) 40vw, 280px"
          />
        ) : (
          <div className="yc-card-image-empty" aria-hidden="true">Tiny</div>
        )}
      </div>
      <div className="yc-card-body">
        <span className="yc-card-unit">{getCommerceCategoryLabel(product.category)} • {product.unitLabel}</span>
        <h3>{product.name}</h3>
        <p>{product.description || `Xem ${product.optionLabel.toLowerCase()} và thông tin sản phẩm.`}</p>
        <strong>{getCommercePriceLabel(product)}</strong>
        <div className="yc-card-meta">
          <span>{getCommerceOptionSummary(product)}</span>
          <span>{getAvailabilityCopy(product)}</span>
        </div>
        <span className="yc-card-cta">
          Xem sản phẩm <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  );
}

function CategoryTree({
  scope,
  productFilter,
  onFilter
}: {
  scope: CatalogScope;
  productFilter: ProductFilter;
  onFilter: (value: ProductFilter) => void;
}) {
  const yarnFilterActive = scope === "all" && productFilter !== "all";

  return (
    <nav className="yc-cat-tree" aria-label="Danh mục sản phẩm">
      <Link
        href="/len-soi-va-phu-kien"
        className={`yc-tree-parent${scope === "all" && productFilter === "all" ? " is-active" : ""}`}
        aria-current={scope === "all" && productFilter === "all" ? "page" : undefined}
      >
        Tất cả
      </Link>

      <div className="yc-tree-group">
        <Link
          href="/len-soi"
          className={`yc-tree-parent yc-tree-toggle${yarnFilterActive ? " has-active-child" : ""}`}
        >
          <span>Len sợi</span>
          {scope === "all" ? (
            <svg
              className="yc-tree-chevron is-open"
              aria-hidden="true"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          ) : null}
        </Link>

        {scope === "all" ? (
          <ul className="yc-tree-children">
            {yarnCategories.map((item) => (
              <li key={item.value}>
                <button
                  type="button"
                  className={`yc-tree-child${productFilter === item.value ? " is-active" : ""}`}
                  aria-pressed={productFilter === item.value}
                  onClick={() => onFilter(item.value)}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <Link
        href="/phu-kien"
        className={`yc-tree-parent${scope === "accessory" ? " is-active" : ""}`}
        aria-current={scope === "accessory" ? "page" : undefined}
      >
        Phụ kiện
      </Link>
    </nav>
  );
}

export function CommerceCatalog({
  products,
  scope,
  heading
}: {
  products: CommerceProduct[];
  scope: CatalogScope;
  heading: string;
}) {
  const [productFilter, setProductFilter] = useState<ProductFilter>("all");
  const [priceRange, setPriceRange] = useState<PriceFilter>("all");
  const [sort, setSort] = useState<SortOption>("newest");

  const visibleProducts = useMemo(() => {
    const scopedProducts = scope === "accessory"
      ? products.filter((product) => product.category === "accessory")
      : products;

    const filtered = scopedProducts.filter((product) => {
      const matchesCategory = productFilter === "all"
        || (product.category === "yarn" && product.subCategory === productFilter);
      const price = getCommerceDisplayPrice(product)?.amount ?? null;
      return matchesCategory && matchesPrice(price, priceRange);
    });

    return [...filtered].sort((a, b) => {
      if (sort === "newest") return b.updatedAt.localeCompare(a.updatedAt);
      const aPrice = getCommerceDisplayPrice(a)?.amount ?? Number.POSITIVE_INFINITY;
      const bPrice = getCommerceDisplayPrice(b)?.amount ?? Number.POSITIVE_INFINITY;
      return sort === "price-asc" ? aPrice - bPrice : bPrice - aPrice;
    });
  }, [priceRange, productFilter, products, scope, sort]);

  const resetFilters = () => {
    setProductFilter("all");
    setPriceRange("all");
  };

  return (
    <section className="yc-products" id="catalog" aria-labelledby="commerce-list">
      <div className="yc-mobile-controls">
        <label>
          Khoảng giá
          <select value={priceRange} onChange={(event) => setPriceRange(event.target.value as PriceFilter)}>
            {priceRanges.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label>
          Sắp xếp
          <select value={sort} onChange={(event) => setSort(event.target.value as SortOption)}>
            <option value="newest">Mới nhất</option>
            <option value="price-asc">Giá thấp đến cao</option>
            <option value="price-desc">Giá cao đến thấp</option>
          </select>
        </label>
      </div>

      <div className="yc-mobile-chips" aria-label="Chuyển danh mục và lọc nhanh">
        <Link href="/len-soi-va-phu-kien" className={scope === "all" && productFilter === "all" ? "is-active" : ""}>Tất cả</Link>
        <Link href="/len-soi" className={scope === "all" && productFilter !== "all" ? "is-active" : ""}>Len sợi</Link>
        <Link href="/phu-kien" className={scope === "accessory" ? "is-active" : ""}>Phụ kiện</Link>
        {scope === "all" ? yarnCategories.map((item) => (
          <button
            key={item.value}
            type="button"
            className={productFilter === item.value ? "is-active" : ""}
            aria-pressed={productFilter === item.value}
            onClick={() => setProductFilter(item.value)}
          >
            {item.short}
          </button>
        )) : null}
      </div>

      <div className="yc-catalog-layout">
        <aside className="yc-sidebar" aria-label="Bộ lọc sản phẩm">
          <div className="yc-filter-group">
            <h2>Danh mục</h2>
            <CategoryTree scope={scope} productFilter={productFilter} onFilter={setProductFilter} />
          </div>

          <div className="yc-filter-group">
            <h2>Khoảng giá</h2>
            {priceRanges.map((item) => (
              <label key={item.value}>
                <input
                  type="radio"
                  name={`commerce-price-range-${scope}`}
                  value={item.value}
                  checked={priceRange === item.value}
                  onChange={() => setPriceRange(item.value)}
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </aside>

        <div className="yc-results">
          <div className="yc-results-header">
            <div>
              <h2 id="commerce-list">{heading}</h2>
              <p>{visibleProducts.length} sản phẩm</p>
            </div>
            <label>
              Sắp xếp:
              <select value={sort} onChange={(event) => setSort(event.target.value as SortOption)}>
                <option value="newest">Mới nhất</option>
                <option value="price-asc">Giá thấp đến cao</option>
                <option value="price-desc">Giá cao đến thấp</option>
              </select>
            </label>
          </div>

          {visibleProducts.length > 0 ? (
            <div className="yc-grid">
              {visibleProducts.map((product) => <ProductCard key={`${product.category}-${product.id}`} product={product} />)}
            </div>
          ) : (
            <div className="yc-empty">
              <h3>Chưa có sản phẩm phù hợp</h3>
              <p>Danh mục hoặc khoảng giá này chưa có sản phẩm.</p>
              <button type="button" onClick={resetFilters}>Xem tất cả sản phẩm</button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
