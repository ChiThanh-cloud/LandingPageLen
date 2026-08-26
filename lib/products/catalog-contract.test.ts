import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const adapter = read("./supabase-products.ts");
const scraper = read("../../scripts/scrape-product.ts");
const importMigration = read("../../supabase/migrations/20260820141529_atomic_bulk_variant_import.sql");
const revalidationRoute = read("../../app/api/admin/revalidate-catalog/route.ts");

test("storefront treats products.price as source of truth and exposes the stored color code", () => {
  assert.match(adapter, /normalizeCommercePriceValue\(row\.price\)\s*\?\?\s*normalizeCommercePriceValue\(row\.base_price\)/);
  assert.match(adapter, /const code = row\.color_code\?\.trim\(\) \|\| row\.name\?\.trim\(\) \|\| String\(row\.id\)/);
  assert.match(adapter, /colorCode: code/);
  assert.doesNotMatch(adapter, /colorCode: row\.color_hex/);
});

test("gallery-only import writes only runtime image fields and never syncs price", () => {
  assert.match(scraper, /const galleryToPersist = cleanGallery\.slice\(0, 1\)/);
  assert.match(scraper, /p_update_gallery_only: updateGalleryOnly/);
  assert.match(importMigration, /elsif p_update_gallery_only then[\s\S]*image_url = p_main_image_url,[\s\S]*full_image_url = p_main_image_url,[\s\S]*updated_at = pg_catalog\.clock_timestamp\(\)/);
  const galleryUpdate = importMigration.slice(
    importMigration.indexOf("elsif p_update_gallery_only then"),
    importMigration.indexOf("else", importMigration.indexOf("elsif p_update_gallery_only then"))
  );
  assert.doesNotMatch(galleryUpdate, /\bprice\s*=/);
  assert.match(scraper, /if \(updateGalleryOnly && syncPrice\)/);
  assert.match(scraper, /--sync-price cannot be combined with --update-gallery-only/);
  assert.match(scraper, /--update-gallery-only changed protected product field/);
});

test("full import preserves manual product and variant state unless price sync is explicit", () => {
  assert.match(scraper, /const existingPrice = storedPositivePrice\(existingProduct\?\.price\)/);
  assert.match(importMigration, /base_price = case when p_sync_price then p_price else v_existing_price end/);
  assert.match(importMigration, /price = case when p_sync_price then p_price::text else p\.price end/);
  assert.match(importMigration, /when pg_catalog\.btrim\(coalesce\(p\.description, ''\)\) = '' then coalesce\(p_description, ''\)/);

  const scrapeVariantUpdateStart = importMigration.indexOf(
    "else\n        update public.product_variants pv",
    importMigration.indexOf("if p_mode = 'admin' then")
  );
  const scrapeVariantUpdate = importMigration.slice(
    scrapeVariantUpdateStart,
    importMigration.indexOf("v_updated_count :=", scrapeVariantUpdateStart)
  );
  assert.match(scrapeVariantUpdate, /color_code = v_color_code[\s\S]*image_url = v_variant/);
  assert.doesNotMatch(scrapeVariantUpdate, /\bstatus\s*=/);
  assert.match(importMigration, /case when p_mode = 'admin' then[\s\S]*else 'available' end/);
  assert.match(scraper, /expectedStatuses\.set\(code, variant\.status\)/);
});

test("scrape production writes use one service-role RPC and no per-variant mutations", () => {
  assert.equal(scraper.match(/\.rpc\('service_import_scraped_product'/g)?.length, 1);
  assert.doesNotMatch(scraper, /\.from\('products'\)\s*\.update\(/);
  assert.doesNotMatch(scraper, /\.from\('products'\)\s*\.insert\(/);
  assert.doesNotMatch(scraper, /\.from\('product_variants'\)\s*\.(?:update|insert|upsert)\(/);
  assert.match(importMigration, /private\.import_product_variant_batch/);
  assert.match(importMigration, /function public\.service_import_scraped_product/);
});

test("gallery exclusion is one-based and scraper revalidates through a protected endpoint", () => {
  assert.match(scraper, /--exclude-gallery-index="2,3"/);
  assert.match(scraper, /excludeGalleryIndices\.has\(galleryDisplayIndex\)/);
  assert.doesNotMatch(scraper, /excludeTokens\.includes\(i\.toString\(\)\)/);
  assert.match(scraper, /await triggerCatalogRevalidation\(slug\)[\s\S]*Import complete/);
  assert.match(revalidationRoute, /CATALOG_REVALIDATE_SECRET/);
  assert.match(revalidationRoute, /timingSafeEqual/);
  assert.match(revalidationRoute, /revalidatePath\("\/len-soi"\)/);
  assert.match(revalidationRoute, /revalidatePath\(`\/len-soi\/\$\{parsed\.data\.slug\}`\)/);
});
