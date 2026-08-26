import type { CommerceProduct, SellableCategory } from "@/types/commerce-product";

export type CommerceCatalogFilter = "all" | SellableCategory;

export type CommerceDisplayPrice = {
  amount: number;
  isFrom: boolean;
};

function isPositivePrice(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function filterCommerceProducts(products: CommerceProduct[], filter: CommerceCatalogFilter) {
  return filter === "all" ? products : products.filter((product) => product.category === filter);
}

export function getCommerceProductPath(product: Pick<CommerceProduct, "category" | "slug">) {
  return product.category === "yarn" ? `/len-soi/${product.slug}` : `/phu-kien/${product.slug}`;
}

export function getCommerceDisplayPrice(product: Pick<CommerceProduct, "price" | "variants">): CommerceDisplayPrice | null {
  const candidates = [product.price, ...product.variants.map((variant) => variant.price)].filter(isPositivePrice);
  if (candidates.length === 0) return null;

  return {
    amount: Math.min(...candidates),
    isFrom: new Set(candidates).size > 1
  };
}

export function formatCommercePrice(amount: number) {
  return `${amount.toLocaleString("vi-VN")}đ`;
}

export function getCommercePriceLabel(product: Pick<CommerceProduct, "price" | "unitLabel" | "variants">) {
  const displayPrice = getCommerceDisplayPrice(product);
  if (!displayPrice) return "Liên hệ Tiny để biết giá";
  return `${displayPrice.isFrom ? "Từ " : ""}${formatCommercePrice(displayPrice.amount)} / ${product.unitLabel}`;
}

export function getCommerceOptionSummary(product: Pick<CommerceProduct, "optionLabel" | "variants">) {
  return product.variants.length === 0
    ? "Chưa có lựa chọn"
    : `${product.variants.length} ${product.optionLabel}`;
}

export function getCommerceCategoryLabel(category: SellableCategory) {
  return category === "yarn" ? "Len sợi" : "Phụ kiện";
}

export function getCommerceStatusLabel(status: string | null) {
  if (status === "out") return "Hết hàng";
  if (status === "preorder") return "Đặt trước";
  return null;
}
