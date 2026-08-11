import { cache } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { yarnProducts as staticYarnProducts } from "@/lib/products/yarn-products";
import type { YarnCategory, YarnProduct, YarnVariant } from "@/types/yarn-product";
import type {
  SupabaseProductRow,
  SupabaseVariantRow,
  SupabaseWholesalePriceRow
} from "@/types/supabase-product";

const FALLBACK_IMAGE = "/images/yarn_collection_800.jpg";

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
  return persisted || `${slugify(row.name || "len-soi")}-${row.id}`;
}

function numberValue(value: number | string | null | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function yarnCategory(row: SupabaseProductRow): YarnCategory {
  const value = `${row.sub_category || ""} ${row.name || ""}`.toLowerCase();
  if (value.includes("milk")) return "milk-cotton";
  if (value.includes("nhung")) return "len-nhung";
  if (value.includes("baby")) return "len-baby";
  if (value.includes("acrylic")) return "len-acrylic";
  if (value.includes("cotton")) return "len-cotton";
  if (value.includes("phụ kiện") || value.includes("phu kien")) return "phu-kien";
  return "len-dac-biet";
}

function variantFromRow(row: SupabaseVariantRow, productImage: string): YarnVariant {
  const code = row.color_code?.trim() || row.name?.trim() || String(row.id);
  const price = numberValue(row.price);
  return {
    id: String(row.id),
    colorCode: code,
    colorName: row.color_name?.trim() || code,
    image: row.image_url?.trim() || row.full_image_url?.trim() || productImage,
    price: price > 0 ? price : null,
    stock: typeof row.stock === "number" ? Math.max(0, row.stock) : null
  };
}

function productFromRows(
  row: SupabaseProductRow,
  variantRows: SupabaseVariantRow[],
  wholesaleRows: SupabaseWholesalePriceRow[]
): YarnProduct | null {
  const name = row.name?.trim();
  const price = numberValue(row.price) || numberValue(row.base_price);
  const image = row.cover_image?.trim() || row.image_url?.trim() || row.full_image_url?.trim() || FALLBACK_IMAGE;
  if (!name || price <= 0) return null;

  const images = Array.from(new Set([
    image,
    row.image_url?.trim() ? undefined : row.full_image_url?.trim(),
    ...variantRows.slice(0, 5).map((variant) => variant.image_url?.trim() || variant.full_image_url?.trim())
  ].filter((value): value is string => Boolean(value))));
  const variants = variantRows
    .filter((variant) => variant.status !== "hidden")
    .map((variant) => variantFromRow(variant, image));
  const description = row.description?.trim() || `Xem bảng màu và chọn mã màu ${name} phù hợp với mẫu móc của bạn.`;

  return {
    id: String(row.id),
    slug: productSlug(row),
    name,
    shortName: name,
    category: yarnCategory(row),
    description,
    seoDescription: `${name} tại Tiệm Len Nhà Tiny. Xem bảng màu, giá bán và chọn mã màu trực tiếp.`,
    price,
    weight: row.weight?.trim() || "Theo cuộn",
    material: row.yarn_size?.trim() || "Len sợi",
    hookSize: row.crochet_hook?.trim() || "Liên hệ Tiny để được tư vấn",
    origin: row.origin?.trim() || "Chưa cập nhật",
    image,
    images,
    updatedAt: row.updated_at || row.created_at || new Date(0).toISOString(),
    variants,
    wholesaleTiers: wholesaleRows
      .filter((tier) => tier.status !== "hidden" && numberValue(tier.price) > 0)
      .map((tier) => ({
        minQuantity: tier.min_quantity,
        price: numberValue(tier.price),
        label: tier.label?.trim() || `Từ ${tier.min_quantity} cuộn`
      }))
  };
}

async function loadSupabaseYarnProducts(): Promise<YarnProduct[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data: productData, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("category", "yarn")
    .neq("status", "hidden")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (productError || !productData) {
    console.error("Unable to load yarn products from Supabase", productError);
    return null;
  }
  if (productData.length === 0) return [];

  const productIds = productData.map((product) => product.id);
  const [{ data: variantData, error: variantError }, wholesaleResult] = await Promise.all([
    supabase
      .from("product_variants")
      .select("*")
      .in("product_id", productIds)
      .neq("status", "hidden")
      .order("sort_order", { ascending: true }),
    supabase
      .from("wholesale_prices")
      .select("*")
      .in("product_id", productIds)
      .neq("status", "hidden")
      .order("sort_order", { ascending: true })
  ]);

  if (variantError) {
    console.error("Unable to load yarn variants from Supabase", variantError);
    return null;
  }

  const variants = (variantData || []) as SupabaseVariantRow[];
  const wholesale = wholesaleResult.error ? [] : (wholesaleResult.data || []) as SupabaseWholesalePriceRow[];
  return (productData as SupabaseProductRow[])
    .map((product) => productFromRows(
      product,
      variants.filter((variant) => String(variant.product_id) === String(product.id)),
      wholesale.filter((tier) => String(tier.product_id) === String(product.id))
    ))
    .filter((product): product is YarnProduct => product !== null);
}

export const getAllYarnProducts = cache(async (): Promise<YarnProduct[]> => {
  const products = await loadSupabaseYarnProducts();
  return products === null ? staticYarnProducts : products;
});

export async function getYarnProductBySlug(slug: string) {
  return (await getAllYarnProducts()).find((product) => product.slug === slug);
}
