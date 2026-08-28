import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./HeroMedia.tsx", import.meta.url), "utf8");

test("HeroMedia uses picture art direction with desktop source and mobile fallback", () => {
  assert.match(source, /<picture className="hero-poster-picture">/);
  assert.match(source, /<source media=\{desktopMedia\} srcSet="\/images\/yarn_hero_800\.jpg" \/>/);
  assert.match(source, /src="\/images\/hero_mobile_optimized_768\.jpg"/);
  assert.doesNotMatch(source, /src=\{isDesktop \?/);
});
