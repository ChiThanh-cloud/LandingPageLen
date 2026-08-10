import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type VerifiedAdmin = {
  user: User;
  email: string;
};

export async function getVerifiedAdmin(): Promise<VerifiedAdmin | null> {
  const sessionClient = await createSupabaseServerClient();
  const adminClient = getSupabaseAdminClient();
  if (!sessionClient || !adminClient) return null;

  const { data: { user }, error } = await sessionClient.auth.getUser();
  if (error || !user) return null;

  const { data: allowlist, error: allowlistError } = await adminClient
    .from("admin_users")
    .select("user_id,active")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();

  if (allowlistError || !allowlist) return null;
  return { user, email: user.email || "Admin Tiny" };
}

export async function requireAdminPage() {
  const admin = await getVerifiedAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function signOutAdmin() {
  "use server";
  const client = await createSupabaseServerClient();
  if (client) await client.auth.signOut();
  redirect("/admin/login");
}

