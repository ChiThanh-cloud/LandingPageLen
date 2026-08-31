import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  buildVariantsOnlyImportPayload,
  buildVariantsOnlyPlan,
  executeVariantsOnlyPlan,
  type RawVariantSwatch,
} from "./variants-only";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const scraper = read("../scrape-product.ts");
const migration = read("../../supabase/migrations/20260830111149_variants_only_image_import.sql");

function swatch(code: string | null, image: string | null): RawVariantSwatch {
  return {
    inputValue: code,
    labelText: code,
    elementText: code,
    image: image ? {
      dataZoomImage: null,
      dataImage: null,
      dataSrc: null,
      dataOriginal: null,
      dataLazySrc: null,
      dataSrcset: null,
      srcset: null,
      src: image,
    } : null,
    fallbackImageValues: [],
  };
}

test("source slug and Tiny target slug stay separate for local and Cloudinary paths", () => {
  const plan = buildVariantsOnlyPlan(
    [swatch("1", "/images/source-1.jpg")],
    "https://lensoinhutruong.com/susan-5",
    "susan",
  );

  assert.equal(plan.validVariants[0]?.code, "1");
  assert.equal(plan.validVariants[0]?.localImage, "data/products/susan/images/001-1.webp");
  assert.equal(plan.validVariants[0]?.cloudinaryPublicId, "lentiny/products/susan/001-1");
  assert.doesNotMatch(plan.validVariants[0]?.localImage || "", /susan-5/);
  assert.doesNotMatch(plan.validVariants[0]?.cloudinaryPublicId || "", /susan-5/);
});

test("non-sequential input values remain exact and are never inferred from positions", () => {
  const codes = ["1", "2", "5", "9", "13"];
  const swatches = codes.map((code) => swatch(code, `https://example.com/${code}.jpg`));
  swatches[2] = { ...swatches[2], labelText: "wrong-label", elementText: "wrong-element" };
  const plan = buildVariantsOnlyPlan(
    swatches,
    "https://lensoinhutruong.com/milk-125",
    "milk",
  );

  assert.deepEqual(plan.validVariants.map((variant) => variant.code), codes);
  assert.deepEqual(plan.validVariants.map((variant) => variant.position), [1, 2, 3, 4, 5]);
});

test("duplicate codes are detected and excluded from the valid import plan", () => {
  const plan = buildVariantsOnlyPlan(
    [
      swatch("1", "https://example.com/1-a.jpg"),
      swatch("1", "https://example.com/1-b.jpg"),
      swatch("2", "https://example.com/2.jpg"),
    ],
    "https://lensoinhutruong.com/susan-5",
    "susan",
  );

  assert.deepEqual(plan.duplicateCodes, ["1"]);
  assert.deepEqual(plan.validVariants.map((variant) => variant.code), ["2"]);
  assert.equal(plan.items.filter((item) => item.issue === "duplicate-code").length, 2);
});

test("missing images are reported and never borrowed from adjacent swatches", () => {
  const plan = buildVariantsOnlyPlan(
    [
      swatch("1", "https://example.com/1.jpg"),
      swatch("2", null),
      swatch("3", "https://example.com/3.jpg"),
    ],
    "https://lensoinhutruong.com/susan-5",
    "susan",
  );

  assert.equal(plan.missingImageCount, 1);
  assert.equal(plan.items[1]?.image, "");
  assert.deepEqual(plan.validVariants.map((variant) => variant.code), ["1", "3"]);
});

test("existing variants update only image fields and sort order", () => {
  const updateStart = migration.indexOf("update public.product_variants pv");
  const updateEnd = migration.indexOf("v_updated_count :=", updateStart);
  const updateBlock = migration.slice(updateStart, updateEnd);

  assert.match(updateBlock, /image_url = v_variant ->> 'image_url'/);
  assert.match(updateBlock, /full_image_url = v_variant ->> 'full_image_url'/);
  assert.match(updateBlock, /sort_order = \(v_variant ->> 'sort_order'\)::integer/);
  for (const field of ["name", "color_code", "status", "stock", "price", "inventory"]) {
    assert.doesNotMatch(updateBlock, new RegExp(`\\b${field}\\s*=`));
  }
});

test("missing targets cannot create products and new variants use safe hidden/null commerce defaults", () => {
  assert.match(migration, /if not found then\s+raise exception using message = 'TARGET_PRODUCT_NOT_FOUND'/);
  assert.doesNotMatch(migration, /insert into public\.products/);
  assert.match(scraper, /❌ Target product not found: \$\{targetSlug\}[\\n\s]+No changes were made\./);

  const insertStart = migration.indexOf("insert into public.product_variants");
  const insertEnd = migration.indexOf("v_inserted_count :=", insertStart);
  const insertBlock = migration.slice(insertStart, insertEnd);
  assert.match(insertBlock, /'hidden'/);
  assert.doesNotMatch(insertBlock, /\bstock\b/);
  assert.doesNotMatch(insertBlock, /\bprice\b/);
});

test("variants-only payload contains no product, status, price, or inventory fields", () => {
  const plan = buildVariantsOnlyPlan(
    [swatch("7", "https://example.com/7.jpg")],
    "https://lensoinhutruong.com/susan-5",
    "susan",
  );
  const payload = buildVariantsOnlyImportPayload(
    plan.validVariants,
    new Map([["7", "https://res.cloudinary.com/tiny/image/upload/susan/7.webp"]]),
  );

  assert.deepEqual(Object.keys(payload[0] || {}).sort(), [
    "color_code",
    "full_image_url",
    "image_url",
    "name",
    "sort_order",
  ]);
  for (const forbidden of ["price", "status", "stock", "inventory", "description", "slug", "category"]) {
    assert.ok(!(forbidden in (payload[0] || {})));
  }
});

test("dry-run executes neither image processing nor database import", async () => {
  const plan = buildVariantsOnlyPlan(
    [swatch("1", "https://example.com/1.jpg")],
    "https://lensoinhutruong.com/susan-5",
    "susan",
  );
  let imageEffects = 0;
  let databaseEffects = 0;

  const result = await executeVariantsOnlyPlan(plan, "dry-run", {
    processImage: async () => {
      imageEffects += 1;
      return "https://res.cloudinary.com/tiny/image/upload/1.webp";
    },
    importBatch: async () => {
      databaseEffects += 1;
      throw new Error("database effect should not run");
    },
  });

  assert.equal(result, null);
  assert.equal(imageEffects, 0);
  assert.equal(databaseEffects, 0);
  assert.match(scraper, /--target-slug is required when using --variants-only/);
});
