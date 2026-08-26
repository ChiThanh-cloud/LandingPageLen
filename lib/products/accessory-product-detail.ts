import type { CartItem } from "@/types/yarn-product";
import { formatCommercePrice, getCommerceDisplayPrice, getCommerceStatusLabel } from "./commerce-catalog";
import type { CommerceProduct, CommerceVariant } from "@/types/commerce-product";

function isPositiveFinitePrice(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

/**
 * A selected real variant can override the public product price only with a
 * positive finite value. This is display data; checkout still re-queries its
 * trusted price from Supabase.
 */
export function getCommerceVariantPrice(
  product: Pick<CommerceProduct, "price">,
  variant: Pick<CommerceVariant, "price"> | null | undefined
) {
  if (isPositiveFinitePrice(variant?.price)) return variant.price;
  return isPositiveFinitePrice(product.price) ? product.price : null;
}

export function getAccessoryDetailPriceLabel(
  product: Pick<CommerceProduct, "price" | "unitLabel" | "variants">,
  selectedVariant: CommerceVariant | null
) {
  const selectedPrice = getCommerceVariantPrice(product, selectedVariant);
  if (selectedVariant && selectedPrice !== null) {
    return `${formatCommercePrice(selectedPrice)} / ${product.unitLabel}`;
  }

  const catalogPrice = getCommerceDisplayPrice(product);
  if (!catalogPrice) return "Liên hệ Tiny để biết giá";
  return `${catalogPrice.isFrom ? "Từ " : ""}${formatCommercePrice(catalogPrice.amount)} / ${product.unitLabel}`;
}

/** Multi-option accessories require an explicit choice to avoid adding the wrong option. */
export function getInitialAccessoryVariantId(variants: CommerceVariant[]) {
  return variants.length === 1 ? variants[0].id : null;
}

/** A null stock means the quantity is not managed by the public catalog. */
export function getCommerceStockLimit(stock: number | null) {
  if (stock === null) return null;
  if (!Number.isFinite(stock)) return 0;
  return Math.max(0, Math.floor(stock));
}

/** Returns null only when a managed option has no purchasable quantity left. */
export function getAccessoryQuantity(quantity: number, stock: number | null) {
  const limit = getCommerceStockLimit(stock);
  if (limit === 0) return null;
  const normalized = Number.isFinite(quantity) ? Math.max(1, Math.floor(quantity)) : 1;
  return limit === null ? normalized : Math.min(normalized, limit);
}

export function getAccessoryStockLabel(stock: number | null, unitLabel: string) {
  const limit = getCommerceStockLimit(stock);
  if (limit === null) return "Tồn kho sẽ được Tiny xác nhận.";
  if (limit === 0) return "Hết hàng";
  return `Còn hàng: ${limit.toLocaleString("vi-VN")} ${unitLabel}`;
}

/** Stock exhaustion is visible even when the stored variant status is available. */
export function getAccessoryOptionStatusLabel(stock: number | null, status: string | null) {
  return getCommerceStockLimit(stock) === 0 ? "Hết hàng" : getCommerceStatusLabel(status);
}

export function canAddAccessoryToCart(
  product: Pick<CommerceProduct, "price">,
  variant: Pick<CommerceVariant, "price" | "stock"> | null
) {
  return variant !== null && getCommerceVariantPrice(product, variant) !== null && getCommerceStockLimit(variant.stock) !== 0;
}

/**
 * The existing cart storage is intentionally kept intact for TASK 7. Its
 * generic identity is productId + variantId; UI snapshot fields are cached
 * only and are never authoritative for checkout.
 */
export function createAccessoryCartItem(product: CommerceProduct, variant: CommerceVariant, quantity: number): CartItem | null {
  const displayPrice = getCommerceVariantPrice(product, variant);
  if (displayPrice === null || !Number.isInteger(quantity) || quantity < 1) return null;

  return {
    productId: product.id,
    variantId: variant.id,
    quantity,
    slug: product.slug,
    productName: product.name,
    variantName: variant.name,
    // Legacy cart persistence still has this string field. Accessories do not
    // invent a colour value; their actual option remains variantName.
    colorCode: "",
    imageUrl: variant.image || product.image,
    displayPrice
  };
}
