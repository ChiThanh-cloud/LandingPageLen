import type { CommerceProduct, CommerceVariant } from "@/types/commerce-product";

function isPositiveFinitePrice(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function normalizeCommercePriceValue(value: number | string | null | undefined) {
  if (typeof value === "number") return isPositiveFinitePrice(value) ? value : null;
  if (typeof value !== "string") return null;

  const normalized = value.trim();
  if (!/^[0-9]+(?:\.[0-9]+)?$/.test(normalized)) return null;

  const parsed = Number(normalized);
  return isPositiveFinitePrice(parsed) ? parsed : null;
}

function getSafeSnapshotPrice(value: number) {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

/**
 * Public display semantics for a selected real variant. Checkout remains
 * authoritative and re-queries the same IDs against Supabase.
 */
export function getCommerceVariantPrice(
  product: Pick<CommerceProduct, "price">,
  variant: { price?: number | null } | null | undefined
) {
  if (isPositiveFinitePrice(variant?.price)) return variant.price;
  return isPositiveFinitePrice(product.price) ? product.price : null;
}

/** Live product + variant data wins; snapshots are defensive display fallback only. */
export function getCommerceItemDisplayPrice(
  product: Pick<CommerceProduct, "price"> | undefined,
  variant: Pick<CommerceVariant, "price"> | undefined,
  snapshotPrice: number
) {
  if (product && variant) {
    return getCommerceVariantPrice(product, variant) ?? getSafeSnapshotPrice(snapshotPrice);
  }
  return getSafeSnapshotPrice(snapshotPrice);
}
