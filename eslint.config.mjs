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
    "check_images.js"
  ])
]);
