"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminPage } from "@/lib/admin/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type AdminActionState = { ok: boolean; message: string };

const orderCode = z.string().trim().toUpperCase().regex(/^TINY-[A-F0-9]{12}$/);

function rpcErrorMessage(message: string) {
  const outOfStock = message.match(/OUT_OF_STOCK\|(\d+)\|(\d+)/);
  if (outOfStock) return `Không đủ tồn kho cho variant ${outOfStock[1]}. Hiện còn ${outOfStock[2]}.`;
  if (message.includes("ORDER_STATUS_INVALID")) return "Trạng thái đơn không phù hợp với thao tác này.";
  if (message.includes("ORDER_NOT_FOUND")) return "Không tìm thấy đơn hàng.";
  if (message.includes("STOCK_NEGATIVE")) return "Tồn kho không được nhỏ hơn 0.";
  if (message.includes("VARIANT_NOT_FOUND")) return "Không tìm thấy mã màu thuộc khu vực len sợi.";
  return "Tiny chưa thể cập nhật dữ liệu. Vui lòng thử lại.";
}

async function callAdminRpc(name: string, args: Record<string, unknown>) {
  const admin = await requireAdminPage();
  const client = getSupabaseAdminClient();
  if (!client) return { ok: false, message: "Hệ thống quản trị chưa được cấu hình." };
  const { error } = await client.rpc(name, { ...args, p_admin_user: admin.id });
  if (error) {
    console.error("Admin RPC failed", { name, code: error.code, message: error.message });
    return { ok: false, message: rpcErrorMessage(error.message) };
  }
  revalidatePath("/admin");
  revalidatePath("/admin/don-hang");
  revalidatePath("/admin/ton-kho");
  return { ok: true, message: "Đã cập nhật." };
}

export async function confirmOrderAction(_state: AdminActionState, formData: FormData) {
  const parsed = orderCode.safeParse(formData.get("orderCode"));
  if (!parsed.success) return { ok: false, message: "Mã đơn không hợp lệ." };
  return callAdminRpc("admin_confirm_order", { p_order_code: parsed.data });
}

export async function transitionOrderAction(_state: AdminActionState, formData: FormData) {
  const parsed = z.object({
    orderCode,
    nextStatus: z.enum(["shipping", "completed"])
  }).safeParse({ orderCode: formData.get("orderCode"), nextStatus: formData.get("nextStatus") });
  if (!parsed.success) return { ok: false, message: "Trạng thái mới không hợp lệ." };
  return callAdminRpc("admin_transition_order", {
    p_order_code: parsed.data.orderCode,
    p_next_status: parsed.data.nextStatus
  });
}

export async function cancelOrderAction(_state: AdminActionState, formData: FormData) {
  const parsed = z.object({
    orderCode,
    note: z.string().trim().max(500).optional().default("")
  }).safeParse({ orderCode: formData.get("orderCode"), note: formData.get("note") });
  if (!parsed.success) return { ok: false, message: "Thông tin hủy đơn không hợp lệ." };
  return callAdminRpc("admin_cancel_order", {
    p_order_code: parsed.data.orderCode,
    p_note: parsed.data.note || null
  });
}

export async function adjustStockAction(_state: AdminActionState, formData: FormData) {
  const rawStock = String(formData.get("stock") ?? "").trim();
  const parsed = z.object({
    variantId: z.coerce.number().int().positive(),
    stock: z.union([z.literal(""), z.coerce.number().int().nonnegative()]),
    reason: z.string().trim().max(500).optional().default("")
  }).safeParse({
    variantId: formData.get("variantId"),
    stock: rawStock,
    reason: formData.get("reason")
  });
  if (!parsed.success) return { ok: false, message: "Tồn kho phải là số từ 0 trở lên hoặc để trống." };
  return callAdminRpc("admin_adjust_variant_stock", {
    p_variant_id: parsed.data.variantId,
    p_new_stock: parsed.data.stock === "" ? null : parsed.data.stock,
    p_reason: parsed.data.reason || null,
    p_request_id: randomUUID()
  });
}

