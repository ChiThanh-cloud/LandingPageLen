"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { getYarnProductImageAlt } from "@/lib/products/yarn-product-seo";
import type { YarnCategory, YarnProduct } from "@/types/yarn-product";

type YarnCatalogCategory = Exclude<YarnCategory, "phu-kien">;
type CategoryFilter = "all" | YarnCatalogCategory;
type PriceFilter = "all" | "under-20" | "20-50" | "50-100" | "over-100";
type SortOption = "newest" | "price-asc" | "price-desc";

const yarnCategories: Array<{ value: YarnCatalogCategory; label: string; short: string }> = [
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

function matchesPrice(price: number, filter: PriceFilter) {
  if (filter === "under-20") return price < 20000;
  if (filter === "20-50") return price >= 20000 && price <= 50000;
  if (filter === "50-100") return price > 50000 && price <= 100000;
  if (filter === "over-100") return price > 100000;
  return true;
}

function ProductCard({ product }: { product: YarnProduct }) {
  const availableColors = product.variants.filter((variant) => variant.stock !== 0 && variant.status !== "out" && variant.status !== "hidden").length;
  const knownStock = product.variants.every((variant) => variant.stock !== null);
  const totalStock = knownStock
    ? product.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0)
    : null;

  return (
    <Link href={`/len-soi/${product.slug}`} className="yc-card">
      <div className="yc-card-image">
        <Image
          src={product.image}
          alt={getYarnProductImageAlt(product)}
          width={520}
          height={520}
          sizes="(max-width: 389px) 100vw, (max-width: 767px) 50vw, (max-width: 1100px) 40vw, 280px"
        />
      </div>
      <div className="yc-card-body">
        <span className="yc-card-unit">{product.weight || "Len sợi"}</span>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <strong>{product.price.toLocaleString("vi-VN")}đ</strong>
        <div className="yc-card-meta">
          <span>{availableColors} màu đang bán</span>
          <span>
            {totalStock === null
              ? "Liên hệ Tiny để xác nhận"
              : totalStock > 0
                ? `Còn ${totalStock.toLocaleString("vi-VN")} cuộn`
                : "Hết hàng"}
          </span>
        </div>
        <span className="yc-card-cta">
          Xem sản phẩm <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  );
}

function CategoryTree({
  category,
  onSelect
}: {
  category: CategoryFilter;
  onSelect: (value: CategoryFilter) => void;
}) {
  return (
    <nav className="yc-cat-tree" aria-label="Danh mục sản phẩm">
      <Link href="/len-soi-va-phu-kien" className="yc-tree-parent">
        Tất cả
      </Link>

      <div className="yc-tree-group">
        <Link
          href="/len-soi"
          className="yc-tree-parent yc-tree-toggle is-active"
          aria-current="page"
        >
          <span>Len sợi</span>
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
        </Link>
        <ul className="yc-tree-children">
          <li>
            <button
              type="button"
              className={`yc-tree-child${category === "all" ? " is-active" : ""}`}
              aria-pressed={category === "all"}
              onClick={() => onSelect("all")}
            >
              Tất cả len sợi
            </button>
          </li>
          {yarnCategories.map((item) => (
            <li key={item.value}>
              <button
                type="button"
                className={`yc-tree-child${category === item.value ? " is-active" : ""}`}
                aria-pressed={category === item.value}
                onClick={() => onSelect(item.value)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <Link href="/phu-kien" className="yc-tree-parent">
        Phụ kiện
      </Link>
    </nav>
  );
}

export function YarnCatalog({ products }: { products: YarnProduct[] }) {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [priceRange, setPriceRange] = useState<PriceFilter>("all");
  const [sort, setSort] = useState<SortOption>("newest");

  const visibleProducts = useMemo(() => {
    const filtered = products.filter((product) => (
      (category === "all" || product.category === category) && matchesPrice(product.price, priceRange)
    ));

    return [...filtered].sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [category, priceRange, products, sort]);

  const resetFilters = () => {
    setCategory("all");
    setPriceRange("all");
  };

  return (
    <section className="yc-products" id="catalog" aria-labelledby="yarn-list">
      <div className="yc-mobile-controls">
        <label>
          Loại len
          <select value={category} onChange={(event) => setCategory(event.target.value as CategoryFilter)}>
            <option value="all">Tất cả len sợi</option>
            {yarnCategories.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
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
        <Link href="/len-soi-va-phu-kien">Tất cả</Link>
        <Link href="/len-soi" className="is-active" aria-current="page">Len sợi</Link>
        <Link href="/phu-kien">Phụ kiện</Link>
        {yarnCategories.map((item) => (
          <button
            key={item.value}
            type="button"
            className={category === item.value ? "is-active" : ""}
            aria-pressed={category === item.value}
            onClick={() => setCategory(item.value)}
          >
            {item.short}
          </button>
        ))}
      </div>

      <div className="yc-catalog-layout">
        <aside className="yc-sidebar" aria-label="Bộ lọc sản phẩm">
          <div className="yc-filter-group">
            <h2>Danh mục</h2>
            <CategoryTree category={category} onSelect={setCategory} />
          </div>

          <div className="yc-filter-group">
            <h2>Khoảng giá</h2>
            {priceRanges.map((item) => (
              <label key={item.value}>
                <input
                  type="radio"
                  name="price-range"
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
              <h2 id="yarn-list">Các dòng len</h2>
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
              {visibleProducts.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <div className="yc-empty">
              <h3>Chưa có sản phẩm phù hợp</h3>
              <p>Danh mục hoặc khoảng giá này chưa có sản phẩm.</p>
              <button type="button" onClick={resetFilters}>Xem tất cả len sợi</button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
