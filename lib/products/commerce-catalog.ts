import type { CommerceProduct, SellableCategory } from "@/types/commerce-product";
import {
  isCommerceProductOrderable,
  isCommerceVariantOrderable
} from "@/lib/products/commerce-orderability";
import { getCommerceVariantPrice } from "@/lib/products/commerce-pricing";

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

/**
 * Lowest price a customer can order from a public commerce record. Variant
 * prices follow checkout semantics: a positive variant price wins and the
 * product price is only that variant's fallback.
 */
export function getMinimumPublicCommercePrice(products: CommerceProduct[]): number | null {
  const prices = products
    .filter((product) => isCommerceProductOrderable(product.status))
    .flatMap((product) => {
      if (product.variants.length === 0) {
        const price = getCommerceVariantPrice(product, null);
        return price === null ? [] : [price];
      }

      return product.variants
        .filter((variant) => isCommerceVariantOrderable(variant.status) && variant.stock !== 0)
        .map((variant) => getCommerceVariantPrice(product, variant))
        .filter((price): price is number => price !== null);
    })
    .filter((price): price is number => price !== null);

  return prices.length > 0 ? Math.min(...prices) : null;
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
