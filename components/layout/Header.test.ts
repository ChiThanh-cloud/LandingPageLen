import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./Header.tsx", import.meta.url), "utf8");

test("closed mobile navigation is inert while preserving its dialog accessibility contract", () => {
  assert.match(source, /aria-hidden=\{!isMobileMenuOpen\}/);
  assert.match(source, /inert=\{!isMobileMenuOpen\}/);
  assert.match(source, /role="dialog"/);
  assert.match(source, /aria-modal="true"/);
  assert.match(source, /event\.key === "Escape"/);
  assert.match(source, /toggleRef\.current\?\.focus/);
  assert.match(source, /tabIndex=\{isMobileProductMenuOpen \? undefined : -1\}/);
});
