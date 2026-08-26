import { cache } from "react";
import { yarnProducts as staticYarnProducts } from "@/lib/products/yarn-products";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { CommerceProduct, CommerceVariant, SellableCategory } from "@/types/commerce-product";
import type { SupabaseProductRow, SupabaseVariantRow } from "@/types/supabase-product";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function productSlug(row: SupabaseProductRow) {
  const persisted = row.slug?.trim();
  return persisted || `${slugify(row.name || "san-pham")}-${row.id}`;
}

function numberValue(value: number | string | null | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeVariantPrice(value: number | string | null | undefined) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const parsed = numberValue(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function isSellableCategory(value: string | null): value is SellableCategory {
  return value === "yarn" || value === "accessory";
}

export function getCommerceUnitLabel(row: Pick<SupabaseProductRow, "category" | "unit_label">) {
  const configured = row.unit_label?.trim();
  if (configured) return configured;
  return row.category === "yarn" ? "cuộn" : "sản phẩm";
}

export function getCommerceOptionLabel(row: Pick<SupabaseProductRow, "category" | "option_label">) {
  const configured = row.option_label?.trim();
  if (configured) return configured;
  return row.category === "yarn" ? "Màu" : "Phân loại";
}

function commerceVariantFromRow(row: SupabaseVariantRow, productImage: string, category: SellableCategory): CommerceVariant {
  const name = row.name?.trim() || String(row.id);
  const yarnColorCode = row.color_code?.trim() || name;
  return {
    id: String(row.id),
    productId: String(row.product_id),
    name,
    sku: row.sku?.trim() || null,
    price: normalizeVariantPrice(row.price),
    stock: typeof row.stock === "number" && Number.isFinite(row.stock) ? Math.max(0, row.stock) : null,
    status: row.status,
    sortOrder: row.sort_order ?? 0,
    image: row.image_url?.trim() || row.full_image_url?.trim() || productImage,
    colorCode: category === "yarn" ? yarnColorCode : row.color_code?.trim() || null,
    colorName: category === "yarn" ? row.color_name?.trim() || yarnColorCode : row.color_name?.trim() || null,
    colorHex: row.color_hex?.trim() || null
  };
}

export function commerceProductFromRows(row: SupabaseProductRow, variantRows: SupabaseVariantRow[]): CommerceProduct | null {
  if (!isSellableCategory(row.category)) return null;

  const name = row.name?.trim();
  const price = numberValue(row.price) || numberValue(row.base_price);
  if (!name || price <= 0) return null;

  const coverImage = row.cover_image?.trim() || row.image_url?.trim() || row.full_image_url?.trim() || null;
  return {
    id: String(row.id),
    name,
    slug: productSlug(row),
    category: row.category,
    subCategory: row.sub_category?.trim() || null,
    description: row.description?.trim() || "",
    image: coverImage || "",
    coverImage,
    price,
    unitLabel: getCommerceUnitLabel(row),
    optionLabel: getCommerceOptionLabel(row),
    status: row.status,
    sortOrder: row.sort_order ?? 0,
    updatedAt: row.updated_at || row.created_at || new Date(0).toISOString(),
    variants: variantRows
      .filter((variant) => variant.status !== "hidden")
      .map((variant) => commerceVariantFromRow(variant, coverImage || "", row.category))
  };
}

async function loadSupabaseSellableProducts(): Promise<CommerceProduct[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data: productData, error: productError } = await supabase
    .from("products")
    .select("*")
    .in("category", ["yarn", "accessory"])
    .neq("status", "hidden")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (productError || !productData) {
    console.error("Unable to load sellable products from Supabase", productError);
    return null;
  }
  if (productData.length === 0) return [];

  const productIds = productData.map((product) => product.id);
  const { data: variantData, error: variantError } = await supabase
    .from("product_variants")
    .select("*")
    .in("product_id", productIds)
    .neq("status", "hidden")
    .order("sort_order", { ascending: true });

  if (variantError) {
    console.error("Unable to load sellable product variants from Supabase", variantError);
    return null;
  }

  const variants = (variantData || []) as SupabaseVariantRow[];
  return (productData as SupabaseProductRow[])
    .map((product) => commerceProductFromRows(product, variants.filter((variant) => String(variant.product_id) === String(product.id))))
    .filter((product): product is CommerceProduct => product !== null);
}

function staticYarnProductsAsCommerce(): CommerceProduct[] {
  return staticYarnProducts.map((product, productIndex) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    category: "yarn",
    subCategory: product.category,
    description: product.description,
    image: product.image,
    coverImage: product.image,
    price: product.price,
    unitLabel: "cuộn",
    optionLabel: "Màu",
    status: "available",
    sortOrder: productIndex,
    updatedAt: product.updatedAt,
    variants: product.variants.map((variant, variantIndex) => ({
      id: variant.id,
      productId: product.id,
      name: variant.colorCode,
      sku: null,
      price: normalizeVariantPrice(variant.price),
      stock: variant.stock,
      status: "available",
      sortOrder: variantIndex,
      image: variant.image,
      colorCode: variant.colorCode,
      colorName: variant.colorName,
      colorHex: null
    }))
  }));
}

/**
 * Production stays fail-closed. Development and test reuse only the existing
 * static yarn fallback; no synthetic accessory records are ever created.
 */
export function applyCommerceFallbackGuard(products: CommerceProduct[] | null): CommerceProduct[] {
  if (products === null) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "[commerce-products] Unable to load sellable products from database. " +
        "Refusing to serve static data on production."
      );
    }
    return staticYarnProductsAsCommerce();
  }
  return products;
}

export function getProductsForCategory(products: CommerceProduct[], category: SellableCategory) {
  return products.filter((product) => product.category === category);
}

export function findProductByCategoryAndSlug(products: CommerceProduct[], category: SellableCategory, slug: string) {
  return getProductsForCategory(products, category).find((product) => product.slug === slug);
}

export const getAllSellableProducts = cache(async (): Promise<CommerceProduct[]> => {
  const products = await loadSupabaseSellableProducts();
  return applyCommerceFallbackGuard(products);
});

export const getAllAccessoryProducts = cache(async (): Promise<CommerceProduct[]> => {
  return getProductsForCategory(await getAllSellableProducts(), "accessory");
});

export async function getAccessoryProductBySlug(slug: string) {
  return findProductByCategoryAndSlug(await getAllSellableProducts(), "accessory", slug);
}
