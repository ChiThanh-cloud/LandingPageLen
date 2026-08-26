import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const actions = read("../../app/admin/(protected)/san-pham/actions.ts");
const migration = read("../../supabase/migrations/20260820141529_atomic_bulk_variant_import.sql");
const importAction = actions.match(
  /export async function importVariantsAction[\s\S]*?(?=export async function generateCaptionAction)/
)?.[0] || "";

test("variant import validates the complete request before one RPC call", () => {
  assert.match(importAction, /z\.array\(importedVariantSchema\)\.min\(1\)\.max\(200\)/);
  assert.equal(importAction.match(/\.rpc\("admin_import_product_variants"/g)?.length, 1);
  assert.doesNotMatch(importAction, /for \(const variant/);
  assert.doesNotMatch(importAction, /\.from\("product_variants"\)/);
});

test("variant import passes the verified admin identity and revalidates yarn plus the umbrella catalog", () => {
  assert.match(importAction, /const admin = await requireAdminPage\(\)/);
  assert.match(importAction, /p_admin_user: admin\.id/);
  assert.match(importAction, /revalidateProducts\(imported\.data\.productSlug, "yarn"\)/);
});

test("RPC is a hardened security-definer function limited to service_role", () => {
  assert.match(migration, /function public\.admin_import_product_variants\(/);
  assert.match(migration, /security definer\s+set search_path = ''/);
  assert.match(migration, /from public\.admin_users au[\s\S]*au\.user_id = p_admin_user[\s\S]*au\.active = true/);
  assert.match(migration, /revoke all on function public\.admin_import_product_variants[\s\S]*from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.admin_import_product_variants[\s\S]*to service_role/);
});

test("RPC validates the batch and every supported field before mutation", () => {
  const firstMutation = migration.search(/\n\s*(update|insert into) public\.product_variants/);
  const validationMarker = migration.indexOf("-- Validate the complete payload before any insert or update.");
  const conflictMarker = migration.indexOf("if p_product_id is not null and p_mode = 'admin' and exists");

  assert.ok(validationMarker >= 0 && validationMarker < firstMutation);
  assert.ok(conflictMarker >= 0 && conflictMarker < firstMutation);
  assert.match(migration, /v_batch_size < 1 or v_batch_size > 200/);
  for (const field of ["name", "color_code", "color_name", "sku", "image_url", "full_image_url", "status", "sort_order"]) {
    assert.match(migration, new RegExp(`'${field}'`));
  }
});

test("RPC serializes imports per product and preserves case-insensitive last-write-wins matching", () => {
  assert.match(migration, /from public\.products p[\s\S]*where p\.id = p_product_id[\s\S]*for update/);
  assert.match(migration, /lower\(pv\.name\) = pg_catalog\.lower\(v_name\)/);
  assert.match(migration, /payload order[\s\S]*legacy last-write-wins behavior/);
  assert.match(migration, /order by batch\.ordinality/);
});

test("RPC updates only legacy import fields and never overwrites inventory", () => {
  assert.match(migration, /set[\s\S]*name = v_name,[\s\S]*color_code =[\s\S]*color_name =[\s\S]*sku =[\s\S]*image_url =[\s\S]*full_image_url =[\s\S]*status =[\s\S]*sort_order =/);
  assert.doesNotMatch(migration, /\bstock\s*=/i);
  assert.doesNotMatch(migration, /exception\s+when\s+others/i);
});

test("admin and scrape entrypoints share a private invoker core with separate grants", () => {
  assert.match(migration, /function private\.import_product_variant_batch\(/);
  assert.match(migration, /security invoker\s+set search_path = ''/);
  assert.match(migration, /revoke all on function private\.import_product_variant_batch[\s\S]*from public, anon, authenticated, service_role/);
  assert.match(migration, /function public\.service_import_scraped_product\(/);
  assert.match(migration, /revoke all on function public\.service_import_scraped_product[\s\S]*from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.service_import_scraped_product[\s\S]*to service_role/);
});
