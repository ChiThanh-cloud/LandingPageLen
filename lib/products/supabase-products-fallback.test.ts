/**
 * Regression tests for the supabase-products production fallback guard.
 *
 * WHY THE PREVIOUS TESTS WERE FALSE-POSITIVE:
 * An earlier version defined its own `applyFallbackGuard()` function that
 * replicated the logic from supabase-products.ts. The tests exercised THAT
 * duplicate, not the real production code. If the real implementation
 * diverged, the tests would still pass while production silently broke.
 *
 * HOW THESE TESTS HIT PRODUCTION CODE:
 * `applyYarnFallbackGuard` is exported from supabase-products.ts and is the
 * SOLE implementation called by `getAllYarnProducts`. The policy tests import
 * that real export directly — one copy of logic, one place to break.
 *
 * INTEGRATION ISOLATION TECHNIQUE (getAllYarnProducts delegation proof):
 * lib/supabase/client.ts caches its Supabase client in a module-level variable.
 * Deleting ENV variables in before() does NOT reset an already-cached client,
 * making any async test that calls getAllYarnProducts() directly flaky when CI
 * provides real Supabase credentials or another test runs first.
 *
 * Instead, we use a readFileSync structural assertion (the same pattern used in
 * seo.test.ts for the sitemap) to prove getAllYarnProducts() calls
 * applyYarnFallbackGuard(). This assertion:
 * - Reads the production source file directly from disk.
 * - Requires no Supabase ENV and cannot query a real database.
 * - Is unaffected by module-cache or test execution order.
 * - Fails immediately if someone removes the applyYarnFallbackGuard call.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

// Import the REAL production helper — no duplicate logic in tests.
import { applyYarnFallbackGuard, getYarnVariantImage } from "./supabase-products";
import { yarnProducts as staticYarnProducts } from "./yarn-products";
import type { YarnProduct } from "../../types/yarn-product";

describe("supabase-products fallback guard", () => {
  // Each test saves/restores NODE_ENV locally so tests are independent of
  // execution order and the before()/after() cleanup no longer touches ENV.

  it("production + null => throws, never serves stale static data", () => {
    const saved = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = "production";
      assert.throws(
        () => applyYarnFallbackGuard(null),
        (err: Error) => {
          assert.ok(err instanceof Error);
          assert.match(err.message, /Refusing to serve stale static data on production/);
          return true;
        }
      );
    } finally {
      process.env.NODE_ENV = saved;
    }
  });

  it("development + null => static fallback returned (not empty)", () => {
    const saved = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = "development";
      const result = applyYarnFallbackGuard(null);
      assert.ok(Array.isArray(result));
      assert.ok(result.length > 0, "development fallback must not be empty");
      assert.equal(result, staticYarnProducts);
    } finally {
      process.env.NODE_ENV = saved;
    }
  });

  it("test env + null => static fallback returned (not empty)", () => {
    const saved = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = "test";
      const result = applyYarnFallbackGuard(null);
      assert.ok(Array.isArray(result));
      assert.ok(result.length > 0, "test fallback must not be empty");
      assert.equal(result, staticYarnProducts);
    } finally {
      process.env.NODE_ENV = saved;
    }
  });

  it("valid Supabase data => returned unchanged, does NOT use static fallback", () => {
    const saved = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = "production";
      const fakeDbProducts: YarnProduct[] = [
        {
          id: "fake-db-id", slug: "mac-den", name: "Len Mác Đen (DB)", shortName: "Mác Đen",
          category: "len-dac-biet", description: "From DB", seoDescription: "From DB",
          price: 25000, weight: "50g", material: "Test", hookSize: "3.0mm", origin: "VN",
          image: "/images/yarn_collection_800.jpg", images: ["/images/yarn_collection_800.jpg"],
          status: "available", updatedAt: "2026-08-12", variants: [], wholesaleTiers: []
        }
      ];
      const result = applyYarnFallbackGuard(fakeDbProducts);
      assert.equal(result, fakeDbProducts);
      assert.notEqual(result, staticYarnProducts);
      assert.equal(result[0].name, "Len Mác Đen (DB)");
    } finally {
      process.env.NODE_ENV = saved;
    }
  });

  it("empty Supabase catalog [] stays [] and does NOT fallback to static data", () => {
    const saved = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = "production";
      const result = applyYarnFallbackGuard([]);
      assert.ok(Array.isArray(result));
      assert.equal(result.length, 0, "Empty DB result must stay [] — never fall back");
      assert.notEqual(result, staticYarnProducts);
    } finally {
      process.env.NODE_ENV = saved;
    }
  });

  // Structural proof: getAllYarnProducts() delegates to applyYarnFallbackGuard
  //
  // We cannot call getAllYarnProducts() directly here because the Supabase
  // client is cached at module level in lib/supabase/client.ts. If CI has real
  // Supabase credentials and another test initializes the client first,
  // deleting ENV variables in before() has no effect — the cached client stays
  // live and the test would contact the real database unpredictably.
  //
  // readFileSync on the production source (same pattern as seo.test.ts for the
  // sitemap) proves the delegation at the source level. It is:
  //   - Deterministic regardless of test order or CI environment.
  //   - Guaranteed to never contact Supabase.
  //   - A genuine regression guard: removing the applyYarnFallbackGuard call
  //     from getAllYarnProducts breaks this test immediately.

  it("getAllYarnProducts() delegates to applyYarnFallbackGuard (structural source proof)", () => {
    const source = readFileSync(
      new URL("./supabase-products.ts", import.meta.url),
      "utf8"
    );

    // 1. The exported helper must exist in production source.
    assert.match(
      source,
      /export function applyYarnFallbackGuard/,
      "applyYarnFallbackGuard must be exported from supabase-products.ts"
    );

    // 2. getAllYarnProducts must reference applyYarnFallbackGuard (within 200 chars).
    assert.match(
      source,
      /getAllYarnProducts[\s\S]{0,200}applyYarnFallbackGuard/,
      "getAllYarnProducts must call applyYarnFallbackGuard"
    );

    // 3. The getAllYarnProducts body must NOT contain its own inline null-check.
    //    If it does, fallback logic has been duplicated outside the helper.
    const getAllFn = source.match(/export const getAllYarnProducts[\s\S]*?\}\s*\);/)?.[0] ?? "";
    assert.doesNotMatch(
      getAllFn,
      /if\s*\(\s*products\s*===\s*null\s*\)/,
      "getAllYarnProducts must NOT contain an inline null-check — fallback belongs solely in applyYarnFallbackGuard"
    );
  });
});

it("variant image provenance distinguishes an own row image from the product fallback", () => {
  const ownImage = getYarnVariantImage(
    { image_url: " /images/variant-17.webp ", full_image_url: null },
    "/images/product-cover.webp"
  );
  const fallbackImage = getYarnVariantImage(
    { image_url: null, full_image_url: " " },
    "/images/product-cover.webp"
  );

  assert.deepEqual(ownImage, { image: "/images/variant-17.webp", hasOwnImage: true });
  assert.deepEqual(fallbackImage, { image: "/images/product-cover.webp", hasOwnImage: false });
});
