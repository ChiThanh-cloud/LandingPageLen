import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getAllPostMetadata, getLatestPostMetadata } from "@/lib/blog/get-all-posts";
import { homeJsonLd } from "./page";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

test("homepage uses the canonical MDX-backed blog registry and renders three real public posts", () => {
  const now = new Date("2026-08-28T12:00:00+07:00");
  const allPosts = getAllPostMetadata(now);
  const latest = getLatestPostMetadata(3, now);

  assert.equal(latest.length, Math.min(3, allPosts.length));
  assert.deepEqual(latest, allPosts.slice(0, 3));
  assert.ok(latest.every((post) => post.slug && post.h1 && post.image));
  assert.match(source, /getLatestPostMetadata\(3\)/);
  assert.doesNotMatch(source, /import \{ posts \} from "@\/data\/posts"/);
});

test("homepage structured data omits unsupported search and stale price claims", () => {
  const serialized = JSON.stringify(homeJsonLd);

  assert.doesNotMatch(serialized, /SearchAction|search_term_string|priceRange/);
  assert.match(serialized, /WebSite/);
  assert.match(serialized, /LocalBusiness/);
});
