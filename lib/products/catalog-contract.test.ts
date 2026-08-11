import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const adapter = read("./supabase-products.ts");
const scraper = read("../../scripts/scrape-product.ts");
const revalidationRoute = read("../../app/api/admin/revalidate-catalog/route.ts");

test("storefront treats products.price as source of truth and exposes the stored color code", () => {
  assert.match(adapter, /numberValue\(row\.price\)\s*\|\|\s*numberValue\(row\.base_price\)/);
  assert.match(adapter, /const code = row\.color_code\?\.trim\(\) \|\| row\.name\?\.trim\(\) \|\| String\(row\.id\)/);
  assert.match(adapter, /colorCode: code/);
  assert.doesNotMatch(adapter, /colorCode: row\.color_hex/);
});

test("gallery-only import writes only runtime image fields and never syncs price", () => {
  assert.match(scraper, /const galleryToPersist = cleanGallery\.slice\(0, 1\)/);
  assert.match(scraper, /updateGalleryOnly\s*\?\s*\{\s*image_url: mainImageUrl,\s*full_image_url: mainImageUrl,\s*updated_at: updatedAt,\s*\}/s);
  assert.match(scraper, /if \(updateGalleryOnly && syncPrice\)/);
  assert.match(scraper, /--sync-price cannot be combined with --update-gallery-only/);
  assert.match(scraper, /--update-gallery-only changed protected product field/);
});

test("full import preserves manual product and variant state unless price sync is explicit", () => {
  assert.match(scraper, /const existingPrice = storedPositivePrice\(existingProduct\?\.price\)/);
  assert.match(scraper, /base_price: expectedPrice/);
  assert.match(scraper, /\.\.\.\(syncPrice \? \{ price, base_price: price \} : \{\}\)/);
  assert.match(scraper, /\.\.\.\(!existingProduct\?\.description\?\.trim\(\) \? \{ description \} : \{\}\)/);

  const existingVariantUpdate = scraper.slice(
    scraper.indexOf("const variantPayload = {"),
    scraper.indexOf("const existingVariant = existingCodes.get(v.code)")
  );
  assert.doesNotMatch(existingVariantUpdate, /status:/);
  assert.match(scraper, /\.insert\(\{ \.\.\.variantPayload, status: AVAILABLE_STATUS \}\)/);
  assert.match(scraper, /expectedStatuses\.set\(code, variant\.status\)/);
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
