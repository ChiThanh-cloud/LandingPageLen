import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL("../../supabase/migrations/20260825232413_accessory_data_model_labels.sql", import.meta.url),
  "utf8"
);
const productType = readFileSync(
  new URL("../../types/supabase-product.ts", import.meta.url),
  "utf8"
);
const variantSchema = readFileSync(
  new URL("../../supabase/03_product_variants.sql", import.meta.url),
  "utf8"
);
const yarnAdapter = readFileSync(
  new URL("../../lib/products/supabase-products.ts", import.meta.url),
  "utf8"
);

test("product rows expose nullable unit and option labels", () => {
  assert.match(productType, /unit_label:\s*string \| null;/);
  assert.match(productType, /option_label:\s*string \| null;/);
});

test("label migration is additive and backfills only missing yarn labels", () => {
  assert.match(migration, /add column if not exists unit_label text/i);
  assert.match(migration, /add column if not exists option_label text/i);
  assert.match(migration, /where category = 'yarn'/);
  assert.match(migration, /when unit_label is null or pg_catalog\.btrim\(unit_label\) = '' then 'cuộn'/);
  assert.match(migration, /when option_label is null or pg_catalog\.btrim\(option_label\) = '' then 'Màu'/);
  assert.match(migration, /unit_label is null or pg_catalog\.btrim\(unit_label\) = ''/);
  assert.match(migration, /option_label is null or pg_catalog\.btrim\(option_label\) = ''/);
  assert.doesNotMatch(migration, /delete\s+from|drop\s+column|truncate/i);
  assert.doesNotMatch(migration, /category = '(?:handmade|set|gift)'/i);
  assert.doesNotMatch(migration, /row level security|create policy|alter policy|drop policy/i);
  assert.doesNotMatch(migration, /grant\s+.+\s+to\s+(?:public|anon|authenticated)/i);
});

test("labels accept null but reject blank values without changing variants", () => {
  assert.match(migration, /check \(unit_label is null or pg_catalog\.btrim\(unit_label\) <> ''\)/);
  assert.match(migration, /check \(option_label is null or pg_catalog\.btrim\(option_label\) <> ''\)/);
  assert.doesNotMatch(migration, /product_variants/i);
  assert.match(variantSchema, /name text not null/i);
});

test("existing yarn catalog contract remains yarn-only", () => {
  assert.match(yarnAdapter, /\.eq\("category", "yarn"\)/);
});
