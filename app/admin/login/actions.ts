"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminLoginState = { message: string };

const loginSchema = z.object({
  email: z.email("Email chưa đúng định dạng.").max(254),
  password: z.string().min(1, "Vui lòng nhập mật khẩu.").max(256)
});

export async function loginAdmin(
  _state: AdminLoginState,
  formData: FormData
): Promise<AdminLoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });
  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message || "Thông tin đăng nhập không hợp lệ." };
  }

  const sessionClient = await createSupabaseServerClient();
  const serviceClient = getSupabaseAdminClient();
  if (!sessionClient || !serviceClient) {
    return { message: "Hệ thống quản trị chưa được cấu hình đầy đủ." };
  }

  const { data, error } = await sessionClient.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    return { message: "Email hoặc mật khẩu không đúng." };
  }

  const { data: allowlist } = await serviceClient
    .from("admin_users")
    .select("user_id")
    .eq("user_id", data.user.id)
    .eq("active", true)
    .maybeSingle();

  if (!allowlist) {
    await sessionClient.auth.signOut();
    return { message: "Tài khoản này chưa được cấp quyền quản trị." };
  }

  redirect("/admin");
}

