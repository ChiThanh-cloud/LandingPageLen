import { formatCommercePrice, getCommerceProductPath } from "@/lib/products/commerce-catalog";
import { getCommerceItemDisplayPrice } from "@/lib/products/commerce-pricing";
import {
  isCommerceProductOrderable,
  isCommerceVariantOrderable
} from "@/lib/products/commerce-orderability";
import type { CartItem } from "@/types/yarn-product";
import type { CommerceProduct, CommerceVariant } from "@/types/commerce-product";

export type ResolvedCommerceCartItem = {
  item: CartItem;
  product: CommerceProduct | undefined;
  variant: CommerceVariant | undefined;
  productName: string;
  variantName: string;
  optionLabel: string;
  unitLabel: string | null;
  imageUrl: string;
  detailPath: string | null;
  displayPrice: number;
  stock: number | null;
  isAvailable: boolean;
};

export function resolveCommerceCartItems(
  items: CartItem[],
  products: CommerceProduct[]
): ResolvedCommerceCartItem[] {
  const productsById = new Map(products.map((product) => [product.id, product]));

  return items.map((item) => {
    const product = productsById.get(item.productId);
    const variant = product?.variants.find((candidate) => candidate.id === item.variantId);
    const stock = variant?.stock ?? null;

    return {
      item,
      product,
      variant,
      productName: product?.name || item.productName,
      variantName: variant?.name || item.variantName,
      optionLabel: product?.optionLabel || "Lựa chọn",
      unitLabel: product?.unitLabel || null,
      imageUrl: variant?.image || product?.image || item.imageUrl,
      detailPath: product ? getCommerceProductPath(product) : null,
      displayPrice: getCommerceItemDisplayPrice(product, variant, item.displayPrice),
      stock,
      isAvailable: Boolean(
        product
        && variant
        && isCommerceProductOrderable(product.status)
        && isCommerceVariantOrderable(variant.status)
        && stock !== 0
      )
    };
  });
}

export function getCommerceCartSubtotal(items: ReadonlyArray<Pick<ResolvedCommerceCartItem, "displayPrice" | "item">>) {
  return items.reduce((total, entry) => total + entry.displayPrice * entry.item.quantity, 0);
}

export function getCommerceUnitPriceLabel(displayPrice: number, unitLabel: string | null) {
  const price = formatCommercePrice(displayPrice);
  return unitLabel ? `${price} / ${unitLabel}` : price;
}

export function getCommerceItemAccessibleLabel(
  item: Pick<ResolvedCommerceCartItem, "productName" | "optionLabel" | "variantName">
) {
  return `${item.productName}, ${item.optionLabel} ${item.variantName}`;
}

export function getCommerceCartStockLabel(
  item: Pick<ResolvedCommerceCartItem, "product" | "variant" | "stock" | "unitLabel">
) {
  if (!item.product || !item.variant) return "Sản phẩm hoặc lựa chọn không còn khả dụng";
  if (item.product.status === "out") return "Hết hàng";
  if (item.variant.status === "out") return "Hết hàng";
  if (item.stock === 0) return "Hết hàng";
  if (!isCommerceProductOrderable(item.product.status) || !isCommerceVariantOrderable(item.variant.status)) {
    return "Sản phẩm hoặc lựa chọn không còn khả dụng";
  }
  if (item.stock === null) return "Liên hệ Tiny để xác nhận số lượng lớn";
  return `Còn hàng: ${item.stock.toLocaleString("vi-VN")} ${item.unitLabel}`;
}
