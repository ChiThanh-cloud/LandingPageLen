"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { YarnCategory, YarnProduct } from "@/types/yarn-product";

type CategoryFilter = "all" | YarnCategory;
type PriceFilter = "all" | "under-20" | "20-50" | "50-100" | "over-100";
type SortOption = "newest" | "price-asc" | "price-desc";

// ── Cấu trúc cây danh mục ──────────────────────────────────────
type CategoryGroup = {
  id: string;
  label: string;
  /** Nếu không có children → click chọn nhóm thẳng */
  children?: Array<{ value: CategoryFilter; label: string }>;
  /** value dùng khi không có children (ví dụ "phu-kien") */
  value?: CategoryFilter;
};

const categoryGroups: CategoryGroup[] = [
  {
    id: "tat-ca",
    label: "Tất cả",
    value: "all",
  },
  {
    id: "len",
    label: "Len sợi",
    children: [
      { value: "milk-cotton", label: "Milk Cotton" },
      { value: "len-nhung",   label: "Len Nhung" },
      { value: "len-cotton",  label: "Len Cotton" },
      { value: "len-baby",    label: "Len Baby" },
      { value: "len-acrylic", label: "Len Acrylic" },
      { value: "len-dac-biet", label: "Len đặc biệt" },
    ],
  },
  {
    id: "phu-kien",
    label: "Phụ kiện",
    value: "phu-kien",
  },
];

// Danh sách phẳng cho mobile select & chips
const flatCategories: Array<{ value: CategoryFilter; label: string; short: string }> = [
  { value: "all",          label: "Tất cả",        short: "Tất cả" },
  { value: "milk-cotton",  label: "Milk Cotton",    short: "Milk Cotton" },
  { value: "len-nhung",    label: "Len Nhung",      short: "Nhung" },
  { value: "len-cotton",   label: "Len Cotton",     short: "Cotton" },
  { value: "len-baby",     label: "Len Baby",       short: "Baby" },
  { value: "len-acrylic",  label: "Len Acrylic",    short: "Acrylic" },
  { value: "len-dac-biet", label: "Len đặc biệt",   short: "Đặc biệt" },
  { value: "phu-kien",     label: "Phụ kiện",       short: "Phụ kiện" },
];

const priceRanges: Array<{ value: PriceFilter; label: string }> = [
  { value: "all",       label: "Tất cả mức giá" },
  { value: "under-20",  label: "Dưới 20.000đ" },
  { value: "20-50",     label: "20.000đ – 50.000đ" },
  { value: "50-100",    label: "50.000đ – 100.000đ" },
  { value: "over-100",  label: "Trên 100.000đ" },
];

// Nhóm cha nào chứa category đang chọn
function parentIdOf(cat: CategoryFilter): string | null {
  if (cat === "all") return null;
  const group = categoryGroups.find(
    (g) => g.children?.some((c) => c.value === cat)
  );
  return group?.id ?? null;
}

function matchesPrice(price: number, filter: PriceFilter) {
  if (filter === "under-20")  return price < 20000;
  if (filter === "20-50")     return price >= 20000 && price <= 50000;
  if (filter === "50-100")    return price > 50000 && price <= 100000;
  if (filter === "over-100")  return price > 100000;
  return true;
}

// ── Product card ───────────────────────────────────────────────
function ProductCard({ product }: { product: YarnProduct }) {
  const availableColors = product.variants.filter((v) => v.stock !== 0).length;
  const knownStock = product.variants.every((v) => v.stock !== null);
  const totalStock = knownStock
    ? product.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
    : null;

  return (
    <Link href={`/len-soi/${product.slug}`} className="yc-card">
      <div className="yc-card-image">
        <Image
          src={product.image}
          alt={product.name}
          width={520}
          height={520}
          sizes="(max-width: 389px) 100vw, (max-width: 767px) 50vw, (max-width: 1100px) 40vw, 280px"
        />
      </div>
      <div className="yc-card-body">
        <span className="yc-card-unit">{product.weight}</span>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <strong>{product.price.toLocaleString("vi-VN")}đ</strong>
        <div className="yc-card-meta">
          <span>{availableColors} màu đang bán</span>
          <span>
            {totalStock === null
              ? "Liên hệ Tiny để xác nhận số lượng lớn."
              : totalStock > 0
              ? `Còn hàng: ${totalStock.toLocaleString("vi-VN")} cuộn`
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

// ── Sidebar category tree ──────────────────────────────────────
function CategoryTree({
  category,
  onSelect,
}: {
  category: CategoryFilter;
  onSelect: (v: CategoryFilter) => void;
}) {
  // Mặc định đóng — chỉ mở nhóm đang chứa active child
  const defaultOpen = parentIdOf(category);
  const [openGroup, setOpenGroup] = useState<string | null>(defaultOpen);

  const toggleGroup = (id: string) =>
    setOpenGroup((prev) => (prev === id ? null : id));

  return (
    <nav className="yc-cat-tree" aria-label="Lọc danh mục">
      {categoryGroups.map((group) => {
        const hasChildren = !!group.children?.length;

        // Nhóm không có con (Tất cả, Phụ kiện)
        if (!hasChildren && group.value !== undefined) {
          return (
            <button
              key={group.id}
              type="button"
              className={[
                "yc-tree-parent",
                category === group.value ? "is-active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-pressed={category === group.value}
              onClick={() => onSelect(group.value!)}
            >
              {group.label}
            </button>
          );
        }

        // Nhóm có con (Len sợi)
        const isOpen = openGroup === group.id;
        const childActive = group.children?.some((c) => c.value === category);

        return (
          <div key={group.id} className="yc-tree-group">
            <button
              type="button"
              className={[
                "yc-tree-parent yc-tree-toggle",
                childActive ? "has-active-child" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-expanded={isOpen}
              onClick={() => toggleGroup(group.id)}
            >
              <span>{group.label}</span>
              <svg
                className={["yc-tree-chevron", isOpen ? "is-open" : ""].filter(Boolean).join(" ")}
                aria-hidden="true"
                width="14" height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {isOpen && (
              <ul className="yc-tree-children">
                {group.children!.map((child) => (
                  <li key={child.value}>
                    <button
                      type="button"
                      className={[
                        "yc-tree-child",
                        category === child.value ? "is-active" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      aria-pressed={category === child.value}
                      onClick={() => onSelect(child.value)}
                    >
                      {child.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}

// ── Main export ────────────────────────────────────────────────
export function YarnCatalog({ products }: { products: YarnProduct[] }) {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [priceRange, setPriceRange] = useState<PriceFilter>("all");
  const [sort, setSort] = useState<SortOption>("newest");

  const visibleProducts = useMemo(() => {
    const filtered = products.filter(
      (p) =>
        (category === "all" || p.category === category) &&
        matchesPrice(p.price, priceRange)
    );
    return [...filtered].sort((a, b) => {
      if (sort === "price-asc")  return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [category, priceRange, products, sort]);

  const resetFilters = () => { setCategory("all"); setPriceRange("all"); };

  return (
    <section className="yc-products" aria-labelledby="yarn-list">
      {/* ── Mobile: select + sort ── */}
      <div className="yc-mobile-controls">
        <label>
          Danh mục
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryFilter)}
          >
            {flatCategories.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sắp xếp
          <select value={sort} onChange={(e) => setSort(e.target.value as SortOption)}>
            <option value="newest">Mới nhất</option>
            <option value="price-asc">Giá thấp đến cao</option>
            <option value="price-desc">Giá cao đến thấp</option>
          </select>
        </label>
      </div>

      {/* ── Mobile: chips scroll ── */}
      <div className="yc-mobile-chips" aria-label="Lọc nhanh theo danh mục">
        {flatCategories.map((item) => (
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
        {/* ── Sidebar ── */}
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

        {/* ── Product grid ── */}
        <div className="yc-results">
          <div className="yc-results-header">
            <div>
              <h2 id="yarn-list">Các dòng len</h2>
              <p>{visibleProducts.length} sản phẩm</p>
            </div>
            <label>
              Sắp xếp:
              <select value={sort} onChange={(e) => setSort(e.target.value as SortOption)}>
                <option value="newest">Mới nhất</option>
                <option value="price-asc">Giá thấp đến cao</option>
                <option value="price-desc">Giá cao đến thấp</option>
              </select>
            </label>
          </div>

          {visibleProducts.length > 0 ? (
            <div className="yc-grid">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="yc-empty">
              <h3>Chưa có sản phẩm phù hợp</h3>
              <p>Danh mục hoặc khoảng giá này chưa có sản phẩm.</p>
              <button type="button" onClick={resetFilters}>
                Xem tất cả len sợi
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
