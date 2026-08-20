"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminPage } from "@/lib/admin/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ProductAdminActionResult = { ok: boolean; message: string; id?: string };

const productIdSchema = z.coerce.number().int().positive();
const statusSchema = z.enum(["available", "out", "preorder", "hidden"]);
const categorySchema = z.enum(["handmade", "yarn", "set", "gift"]);

function cleanOptional(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function parsePrice(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return null;
  const hasK = raw.includes("k");
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return Number.NaN;
  const parsed = Number(digits);
  return hasK && parsed < 1000 ? parsed * 1000 : parsed;
}

function slugifyProductName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function authorizedClient() {
  await requireAdminPage();
  const client = getSupabaseAdminClient();
  if (!client) throw new Error("ADMIN_SERVICE_UNAVAILABLE");
  return client;
}

function resultFromError(error: { message?: string } | null, success: string): ProductAdminActionResult {
  if (!error) return { ok: true, message: success };
  console.error("Product admin mutation failed", { message: error.message });
  return { ok: false, message: "Tiny chưa thể lưu thay đổi. Vui lòng kiểm tra dữ liệu và thử lại." };
}

function revalidateProducts(slug?: string | null) {
  revalidatePath("/admin/san-pham");
  revalidatePath("/len-soi");
  if (slug) revalidatePath(`/len-soi/${slug}`);
}

export async function saveProductAction(formData: FormData): Promise<ProductAdminActionResult> {
  const price = parsePrice(formData.get("price"));
  const parsed = z.object({
    id: z.union([z.literal(""), productIdSchema]),
    name: z.string().trim().min(1).max(200),
    category: categorySchema,
    subCategory: z.string().trim().max(80).nullable(),
    status: statusSchema,
    sortOrder: z.coerce.number().int().min(0).max(100000),
    price: z.number().nonnegative().nullable(),
    weight: z.string().trim().max(120).nullable(),
    yarnSize: z.string().trim().max(120).nullable(),
    material: z.string().trim().max(240).nullable(),
    hookSize: z.string().trim().max(120).nullable(),
    origin: z.string().trim().max(160).nullable(),
    description: z.string().trim().max(1200).nullable(),
    imageUrl: z.string().url().max(2000),
    fullImageUrl: z.string().url().max(2000).nullable()
  }).safeParse({
    id: String(formData.get("id") ?? "").trim(),
    name: formData.get("name"),
    category: formData.get("category"),
    subCategory: cleanOptional(formData.get("subCategory")),
    status: formData.get("status"),
    sortOrder: formData.get("sortOrder"),
    price,
    weight: cleanOptional(formData.get("weight")),
    yarnSize: cleanOptional(formData.get("yarnSize")),
    material: cleanOptional(formData.get("material")),
    hookSize: cleanOptional(formData.get("hookSize")),
    origin: cleanOptional(formData.get("origin")),
    description: cleanOptional(formData.get("description")),
    imageUrl: formData.get("imageUrl"),
    fullImageUrl: cleanOptional(formData.get("fullImageUrl"))
  });
  if (!parsed.success || Number.isNaN(price)) {
    return { ok: false, message: "Tên, danh mục, giá và đường dẫn ảnh chưa hợp lệ." };
  }

  const client = await authorizedClient();
  const payload = {
    name: parsed.data.name,
    category: parsed.data.category,
    sub_category: parsed.data.subCategory,
    status: parsed.data.status,
    sort_order: parsed.data.sortOrder,
    price: parsed.data.price,
    base_price: parsed.data.price,
    weight: parsed.data.weight,
    yarn_size: parsed.data.yarnSize,
    material: parsed.data.material,
    crochet_hook: parsed.data.hookSize,
    origin: parsed.data.origin,
    description: parsed.data.description,
    image_url: parsed.data.imageUrl,
    full_image_url: parsed.data.fullImageUrl
  };
  let insertPayload: typeof payload & { slug?: string } = payload;
  if (parsed.data.id === "" && parsed.data.category === "yarn") {
    const baseSlug = slugifyProductName(parsed.data.name);
    if (!baseSlug) return { ok: false, message: "Tên sản phẩm chưa tạo được đường dẫn hợp lệ." };

    let stableSlug = baseSlug;
    for (let suffix = 1; suffix <= 100; suffix += 1) {
      const { data: existing, error: slugError } = await client
        .from("products")
        .select("id")
        .eq("slug", stableSlug)
        .maybeSingle();
      if (slugError) return resultFromError(slugError, "");
      if (!existing) break;
      stableSlug = `${baseSlug}-${suffix + 1}`;
      if (suffix === 100) return { ok: false, message: "Tên sản phẩm đang trùng quá nhiều đường dẫn hiện có." };
    }
    insertPayload = { ...payload, slug: stableSlug };
  }

  const request = parsed.data.id === ""
    ? client.from("products").insert(insertPayload).select("id,slug").single()
    : client.from("products").update(payload).eq("id", parsed.data.id).select("id,slug").single();
  const { data, error } = await request;
  if (!error) revalidateProducts(data?.slug);
  return { ...resultFromError(error, "Đã lưu sản phẩm."), id: data?.id ? String(data.id) : undefined };
}

export async function toggleProductAction(id: string, currentStatus: string): Promise<ProductAdminActionResult> {
  const parsed = z.object({ id: productIdSchema, currentStatus: statusSchema }).safeParse({ id, currentStatus });
  if (!parsed.success) return { ok: false, message: "Sản phẩm không hợp lệ." };
  const client = await authorizedClient();
  const { data, error } = await client.from("products").update({
    status: parsed.data.currentStatus === "hidden" ? "available" : "hidden"
  }).eq("id", parsed.data.id).select("slug").single();
  if (!error) revalidateProducts(data?.slug);
  return resultFromError(error, parsed.data.currentStatus === "hidden" ? "Đã hiện sản phẩm." : "Đã ẩn sản phẩm.");
}

export async function deleteProductAction(id: string): Promise<ProductAdminActionResult> {
  const parsed = productIdSchema.safeParse(id);
  if (!parsed.success) return { ok: false, message: "Sản phẩm không hợp lệ." };
  const client = await authorizedClient();
  const { error } = await client.from("products").delete().eq("id", parsed.data);
  if (!error) revalidateProducts();
  return resultFromError(error, "Đã xóa sản phẩm.");
}

const variantSchema = z.object({
  id: z.union([z.literal(""), productIdSchema]),
  productId: productIdSchema,
  name: z.string().trim().min(1).max(120),
  colorCode: z.string().trim().max(80).nullable(),
  colorName: z.string().trim().max(120).nullable(),
  sku: z.string().trim().max(120).nullable(),
  imageUrl: z.string().url().max(2000).nullable(),
  fullImageUrl: z.string().url().max(2000).nullable(),
  status: statusSchema,
  sortOrder: z.coerce.number().int().min(0).max(100000)
});

export async function saveVariantAction(formData: FormData): Promise<ProductAdminActionResult> {
  const parsed = variantSchema.safeParse({
    id: String(formData.get("id") ?? "").trim(),
    productId: formData.get("productId"),
    name: formData.get("name"),
    colorCode: cleanOptional(formData.get("colorCode")),
    colorName: cleanOptional(formData.get("colorName")),
    sku: cleanOptional(formData.get("sku")),
    imageUrl: cleanOptional(formData.get("imageUrl")),
    fullImageUrl: cleanOptional(formData.get("fullImageUrl")),
    status: formData.get("status"),
    sortOrder: formData.get("sortOrder")
  });
  if (!parsed.success) return { ok: false, message: "Thông tin mã màu chưa hợp lệ." };

  const client = await authorizedClient();
  const { data: product } = await client.from("products").select("id,category,slug").eq("id", parsed.data.productId).maybeSingle();
  if (!product || product.category !== "yarn") return { ok: false, message: "Chỉ sản phẩm len sợi mới có mã màu." };
  const payload = {
    product_id: parsed.data.productId,
    name: parsed.data.name,
    color_code: parsed.data.colorCode,
    color_name: parsed.data.colorName,
    sku: parsed.data.sku,
    image_url: parsed.data.imageUrl,
    full_image_url: parsed.data.fullImageUrl,
    status: parsed.data.status,
    sort_order: parsed.data.sortOrder
  };
  const request = parsed.data.id === ""
    ? client.from("product_variants").insert(payload)
    : client.from("product_variants").update(payload).eq("id", parsed.data.id).eq("product_id", parsed.data.productId);
  const { error } = await request;
  if (!error) revalidateProducts(product.slug);
  return resultFromError(error, "Đã lưu mã màu.");
}

export async function toggleVariantAction(id: string, productId: string, currentStatus: string): Promise<ProductAdminActionResult> {
  const parsed = z.object({ id: productIdSchema, productId: productIdSchema, currentStatus: statusSchema }).safeParse({ id, productId, currentStatus });
  if (!parsed.success) return { ok: false, message: "Mã màu không hợp lệ." };
  const client = await authorizedClient();
  const { data: product, error: productError } = await client
    .from("products")
    .select("slug")
    .eq("id", parsed.data.productId)
    .maybeSingle();
  if (productError || !product) return resultFromError(productError || { message: "Product not found" }, "");
  const { error } = await client.from("product_variants").update({
    status: parsed.data.currentStatus === "hidden" ? "available" : "hidden"
  }).eq("id", parsed.data.id).eq("product_id", parsed.data.productId);
  if (!error) revalidateProducts(product.slug);
  return resultFromError(error, parsed.data.currentStatus === "hidden" ? "Đã hiện mã màu." : "Đã ẩn mã màu.");
}

const importedVariantSchema = z.object({
  name: z.string().trim().min(1).max(120),
  color_code: z.string().trim().max(80).nullable().optional(),
  color_name: z.string().trim().max(120).nullable().optional(),
  sku: z.string().trim().max(120).nullable().optional(),
  image_url: z.string().url().max(2000),
  full_image_url: z.string().url().max(2000).nullable().optional(),
  status: statusSchema.default("available"),
  sort_order: z.number().int().min(0).max(100000)
});

const importedVariantResultSchema = z.object({
  productSlug: z.string().nullable(),
  importedCount: z.number().int().nonnegative(),
  insertedCount: z.number().int().nonnegative(),
  updatedCount: z.number().int().nonnegative()
});

function resultFromVariantImportError(error: { message?: string } | null): ProductAdminActionResult {
  const message = error?.message || "";
  if (message.includes("ADMIN_FORBIDDEN")) {
    return { ok: false, message: "Phiên quản trị không còn quyền thực hiện thao tác này." };
  }
  if (message.includes("PRODUCT_NOT_FOUND")) {
    return { ok: false, message: "Không tìm thấy sản phẩm cần import." };
  }
  if (message.includes("PRODUCT_NOT_YARN")) {
    return { ok: false, message: "Chỉ sản phẩm len sợi mới có mã màu." };
  }
  if (message.includes("VARIANT_IMPORT_INVALID") || message.includes("VARIANT_NAME_CONFLICT")) {
    return { ok: false, message: "Dữ liệu import có mã màu không hợp lệ hoặc bị xung đột tên." };
  }
  return resultFromError(error, "");
}

export async function importVariantsAction(productId: string, input: unknown): Promise<ProductAdminActionResult> {
  const parsed = z.object({
    productId: productIdSchema,
    variants: z.array(importedVariantSchema).min(1).max(200)
  }).safeParse({ productId, variants: input });
  if (!parsed.success) return { ok: false, message: "Dữ liệu import không hợp lệ. Kiểm tra mã màu và đường dẫn ảnh." };
  const admin = await requireAdminPage();
  const client = getSupabaseAdminClient();
  if (!client) throw new Error("ADMIN_SERVICE_UNAVAILABLE");

  const { data, error } = await client.rpc("admin_import_product_variants", {
    p_product_id: parsed.data.productId,
    p_variants: parsed.data.variants,
    p_admin_user: admin.id
  });
  if (error) return resultFromVariantImportError(error);

  const imported = importedVariantResultSchema.safeParse(data);
  if (!imported.success || imported.data.importedCount !== parsed.data.variants.length) {
    return resultFromError({ message: "VARIANT_IMPORT_RESPONSE_INVALID" }, "");
  }

  revalidateProducts(imported.data.productSlug);
  return { ok: true, message: `Đã import ${imported.data.importedCount} mã màu.` };
}

export async function generateCaptionAction(productId: string): Promise<ProductAdminActionResult> {
  const parsed = productIdSchema.safeParse(productId);
  if (!parsed.success) return { ok: false, message: "Sản phẩm không hợp lệ." };
  await requireAdminPage();
  const client = await createSupabaseServerClient();
  if (!client) return { ok: false, message: "Hệ thống quản trị chưa được cấu hình." };
  const { data, error } = await client.functions.invoke("generate-caption", { body: { product_id: parsed.data } });
  if (error || data?.error) return resultFromError(error || { message: data.error }, "");
  revalidatePath("/admin/san-pham");
  return { ok: true, message: "Đã tạo caption." };
}
