import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componentSource = readFileSync(new URL("./HandmadePortfolioGallery.tsx", import.meta.url), "utf8");
const stylesSource = readFileSync(
  new URL("../../app/do-moc-theo-yeu-cau/page.module.css", import.meta.url),
  "utf8"
);

test("portfolio dialog is centered and mobile uses a compact card", () => {
  assert.match(stylesSource, /\.lightbox \{[\s\S]*?position: fixed;[\s\S]*?inset: 0;[\s\S]*?width: min\(920px, calc\(100vw - 48px\)\);[\s\S]*?max-height: min\(760px, calc\(100dvh - 48px\)\);[\s\S]*?margin: auto;/);
  assert.match(stylesSource, /@media \(max-width: 560px\)[\s\S]*?\.lightbox \{[\s\S]*?width: calc\(100vw - 32px\);[\s\S]*?max-width: 420px;[\s\S]*?max-height: 82dvh;/);
  assert.match(stylesSource, /@media \(max-width: 560px\)[\s\S]*?\.lightboxImage \{[\s\S]*?height: min\(52dvh, 460px\);[\s\S]*?min-height: 0;/);
  assert.doesNotMatch(stylesSource, /min-height: calc\(100dvh - 1rem\)/);
  assert.doesNotMatch(stylesSource, /min-height: 60dvh/);
});

test("lightbox image opens an accessible zoom overlay without nesting another dialog", () => {
  assert.match(componentSource, /const \[isImageZoomed, setIsImageZoomed\] = useState\(false\)/);
  assert.match(componentSource, /aria-label=\{`Mở ảnh lớn: \$\{selectedItem\.name\}`\}/);
  assert.match(componentSource, /className=\{styles\.imageZoomOverlay\}[\s\S]*?role="dialog"[\s\S]*?aria-modal="true"/);
  assert.match(componentSource, /aria-label="Đóng ảnh lớn"/);
  assert.match(componentSource, /inert=\{isImageZoomed \? true : undefined\}/);
  assert.doesNotMatch(componentSource, /<dialog[\s\S]*?<dialog/);
});

test("Escape closes image zoom before the underlying product dialog", () => {
  assert.match(componentSource, /onCancel=\{\(event\) => \{[\s\S]*?if \(isImageZoomed\) \{[\s\S]*?event\.preventDefault\(\);[\s\S]*?closeImageZoom\(\);[\s\S]*?return;[\s\S]*?\}[\s\S]*?closeLightbox\(\);/);
  assert.match(componentSource, /if \(event\.target === event\.currentTarget\) closeImageZoom\(\)/);
  assert.match(stylesSource, /\.imageZoomFrame img \{[\s\S]*?object-fit: contain;/);
});
