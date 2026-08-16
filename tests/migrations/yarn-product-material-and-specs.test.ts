import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL("../../supabase/migrations/20260814120000_yarn_product_material_and_specs.sql", import.meta.url),
  "utf8"
);

test("yarn material migration updates only the four existing stable public products", () => {
  assert.match(migration, /add column if not exists material text/i);
  assert.match(migration, /slug in \('milk-bo', 'nhung-dua', 'nhung-gau', 'mac-den'\)/);
  assert.match(migration, /Expected exactly four existing yarn products/);
  assert.doesNotMatch(migration, /insert\s+into\s+public\.products/i);
  assert.doesNotMatch(migration, /set\s+slug\s*=/i);
  assert.match(migration, /when 'mac-den' then 'Milk Cotton Mác Đen 50g'/);
});
