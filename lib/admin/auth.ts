import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type VerifiedAdmin = {
  id: string;
  email: string;
};

export async function getVerifiedAdminFromClients(
  sessionClient: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  adminClient: ReturnType<typeof getSupabaseAdminClient>
): Promise<VerifiedAdmin | null> {
  if (!sessionClient || !adminClient) return null;

  const { data, error } = await sessionClient.auth.getClaims();
  if (error || !data || !data.claims) return null;
  
  const userId = data.claims.sub;
  if (!userId) return null;

  const { data: allowlist, error: allowlistError } = await adminClient
    .from("admin_users")
    .select("user_id,active")
    .eq("user_id", userId)
    .eq("active", true)
    .maybeSingle();

  if (allowlistError || !allowlist) return null;
  return { id: userId, email: data.claims.email || "Admin Tiny" };
}

export const getVerifiedAdmin = cache(async function getVerifiedAdmin(): Promise<VerifiedAdmin | null> {
  const sessionClient = await createSupabaseServerClient();
  const adminClient = getSupabaseAdminClient();
  return getVerifiedAdminFromClients(sessionClient, adminClient);
});

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
