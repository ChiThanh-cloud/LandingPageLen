import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const redirectConfig = readFileSync(new URL("../../next.config.mjs", import.meta.url), "utf8");
const migration = readFileSync(
  new URL("../../supabase/migrations/20260811090000_clean_yarn_product_slugs.sql", import.meta.url),
  "utf8"
);
const updateStatement = migration.match(/update public\.products[\s\S]*?get diagnostics/i)?.[0] || "";

function assertExactRedirect(source: string, destination: string) {
  const escapedSource = source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedDestination = destination.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  assert.match(
    redirectConfig,
    new RegExp(`source:\\s*["']${escapedSource}["'][\\s\\S]*?destination:\\s*["']${escapedDestination}["'][\\s\\S]*?statusCode:\\s*301`)
  );
}

test("approved yarn slug migration is guarded and URL-specific", async (t) => {
  await t.test("old product URLs have direct 301 redirects", () => {
    assertExactRedirect("/len-soi/milk-bo-40", "/len-soi/milk-bo");
    assertExactRedirect("/len-soi/mac-den-39", "/len-soi/mac-den");
    assert.doesNotMatch(redirectConfig, /source:\s*["']\/len-soi\/(?:\*|:slug(?:[?*+])?)["']/);
  });

  await t.test("migration guards the expected source and target slugs", () => {
    assert.match(migration, /id = 39\s+and slug = 'mac-den-39'/);
    assert.match(migration, /id = 40\s+and slug = 'milk-bo-40'/);
    assert.match(migration, /slug = 'mac-den'\s+and id <> 39/);
    assert.match(migration, /slug = 'milk-bo'\s+and id <> 40/);
  });

  await t.test("migration updates only the approved product IDs and slug field", () => {
    assert.match(updateStatement, /set slug = case id/);
    assert.match(updateStatement, /when 39 then 'mac-den'/);
    assert.match(updateStatement, /when 40 then 'milk-bo'/);
    assert.match(updateStatement, /where \(id = 39 and slug = 'mac-den-39'\)\s+or \(id = 40 and slug = 'milk-bo-40'\)/);
    assert.match(migration, /if migrated_rows <> 2 then/);
    assert.doesNotMatch(updateStatement, /\b(?:name|price|stock|status|category|variant)\s*=/i);
  });

  await t.test("cart and checkout identity remain product ID plus variant ID", () => {
    const cartStore = readFileSync(new URL("../../lib/cart/cart-store.ts", import.meta.url), "utf8");
    const checkoutSchema = readFileSync(new URL("../../lib/checkout/checkout-schema.ts", import.meta.url), "utf8");

    assert.match(cartStore, /cartItemKey\(productId: string, variantId: string\)/);
    assert.match(checkoutSchema, /items\.map\(\(\{ productId, variantId, quantity \}\)/);
  });
});
