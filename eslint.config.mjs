import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    rules: {
      "@next/next/no-page-custom-font": "off"
    }
  },
  globalIgnores([
    ".agent/**",
    ".agents/**",
    ".next/**",
    "assets/**",
    "charts/**",
    "css/**",
    "images/**",
    "js/**",
    "node_modules/**",
    "out/**",
    "posts/**",
    "public/**",
    "san-pham/**",
    "supabase/**",
    "tools/**",
    "ui-ux-pro-max-skill/**",
    "admin.js",
    "admin.html",
    "blog.html",
    "chart-admin.html",
    "index.html",
    "product-color-extractor.html",
    "check_images.js",
    "check-nhung-gau.ts",
    "test-db.ts",
    "test-dom*.js",
    "test-gallery.js",
    "test-storefront.ts",
    "scripts/repair-nhung-gau.ts",
    "scripts/repair-nhung-dua-cloudinary.ts",
    "scripts/repair-product-price-sync.ts",
    "scripts/audit-catalog-sync.ts"
  ])
]);
