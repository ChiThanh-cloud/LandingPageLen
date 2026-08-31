import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componentSource = readFileSync(new URL("./FloatingContact.tsx", import.meta.url), "utf8");
const layoutCss = readFileSync(new URL("../../css/layout.css", import.meta.url), "utf8");
const animationCss = readFileSync(new URL("../../css/animations.css", import.meta.url), "utf8");
const productCss = readFileSync(new URL("../../css/products.css", import.meta.url), "utf8");
const trackingSource = readFileSync(new URL("../../lib/siteTracking.ts", import.meta.url), "utf8");

test("mobile floating actions keep the requested order and accessible names", () => {
  const zaloIndex = componentSource.indexOf('id="float-zalo"');
  const messengerIndex = componentSource.indexOf('id="float-fb"');
  const backToTopIndex = componentSource.indexOf('id="float-top"');

  assert.ok(zaloIndex >= 0);
  assert.ok(messengerIndex > zaloIndex);
  assert.ok(backToTopIndex > messengerIndex);
  assert.match(componentSource, /aria-label="Nhắn Tiny qua Zalo"/);
  assert.match(componentSource, /aria-label="Nhắn Tiny qua Messenger"/);
  assert.match(componentSource, /aria-label="Về đầu trang"/);
  assert.match(componentSource, /fillRule="evenodd"/);
  assert.match(componentSource, /5\.465-5\.803/);
  assert.doesNotMatch(componentSource, /M24 12\.073/);
});

test("back-to-top visibility uses the requested scroll threshold without changing tracking", () => {
  assert.match(componentSource, /const backToTopThreshold = 600/);
  assert.match(componentSource, /window\.scrollY >= backToTopThreshold/);
  assert.match(componentSource, /window\.scrollTo\(\{ top: 0, behavior: prefersReducedMotion \? "auto" : "smooth" \}\)/);
  assert.match(componentSource, /window\.matchMedia\("\(prefers-reduced-motion: reduce\)"\)\.matches/);
  assert.match(componentSource, /<button[\s\S]*?id="float-top"/);
  assert.doesNotMatch(componentSource, /href="\/#hero"/);
  assert.match(componentSource, /data-track="float_top_click"/);
  assert.match(componentSource, /data-track="float_zalo_click"/);
  assert.match(componentSource, /data-track="float_facebook_click"/);
  assert.match(componentSource, /https:\/\/m\.me\/61559447375156/);
  assert.match(componentSource, /https:\/\/zalo\.me\/0937511107/);
});

test("mobile bottom CTA is removed while all three floating actions remain rendered", () => {
  assert.doesNotMatch(componentSource, /mobile-cta-bar|mobile-cta-btn|mobile_sticky_cta_click/);
  assert.doesNotMatch(componentSource, />\s*Nhắn Messenger\s*</);
  assert.doesNotMatch(componentSource, />\s*Nhắn Zalo\s*</);
  assert.doesNotMatch(layoutCss, /\.mobile-cta/);
  assert.doesNotMatch(animationCss, /\.mobile-cta/);
  assert.doesNotMatch(trackingSource, /mobile_sticky_cta_click/);
  assert.match(componentSource, /id="float-zalo"/);
  assert.match(componentSource, /id="float-fb"/);
  assert.match(componentSource, /id="float-top"/);
});

test("mobile styles respect safe area, touch targets, and open-menu visibility", () => {
  assert.match(layoutCss, /bottom: calc\(env\(safe-area-inset-bottom\) \+ 20px\)/);
  assert.doesNotMatch(layoutCss, /padding-bottom: calc\(80px \+ env\(safe-area-inset-bottom\)\)/);
  assert.doesNotMatch(productCss, /\.float-buttons\s*\{[^}]*bottom:/);
  assert.match(layoutCss, /\.float-buttons\.floating-actions \.float-btn \{[\s\S]*?min-width: 44px;[\s\S]*?min-height: 44px;/);
  assert.match(layoutCss, /body\.menu-open \.float-buttons\.floating-actions/);
  assert.match(layoutCss, /body\.product-modal-open \.float-buttons\.floating-actions/);
  assert.match(layoutCss, /\.top-float\.is-hidden \{[\s\S]*?pointer-events: none;/);
});
