# Production Cleanup Record

Date: 2026-07-12
Branch: main

This document records what was removed from the repository after the Next.js migration and what must remain for the production app.

## Current Production Shape

The public website is now the Next.js app:

- `app/` - App Router routes, metadata, sitemap, robots.
- `components/` - shared layout, homepage, blog, and product components.
- `data/` - static product, blog, and site data.
- `types/` - TypeScript content models.
- `public/images/` - runtime image assets served at `/images/...`.
- `public/admin.html` and `public/admin.js` - legacy URLs that redirect to the protected Next.js admin login.
- `css/` - global styles imported by `app/layout.tsx`.
- `js/` - small legacy modules still used by React components.
- `lib/` - shared tracking helper.

## Removed From Git

These were replaced by Next.js routes or duplicate production assets:

- `index.html`
- `blog.html`
- `posts/`
- `san-pham/`
- root `images/` duplicates
- `sitemap.xml`
- `robots.txt`
- `js/analytics.js`
- `js/blog.js`
- `js/main.js`
- `public/.gitkeep`
- `public/tools/` chart, PDF, and media-upload tools
- `public/js/chart-admin.js`
- `public/js/chart-utils.js`
- `public/js/media-upload.js`
- `public/css/chart.css`
- `public/css/admin.css`
- `public/images/qua-tot-nghiep-handmade-1200.jpg`

Reason:

- `/`, `/blog`, `/blog/[slug]`, `/san-pham/[slug]`, `/sitemap.xml`, and `/robots.txt` are now owned by `app/`.
- Duplicate root `images/` was removed because `public/images/` is the production asset source.

## Still Kept Because Production Uses Them

- `css/base.css`
- `css/layout.css`
- `css/sections.css`
- `css/animations.css`
- `css/products.css`
- `css/responsive.css`
- `css/blog.css`
- `js/config.js`
- `js/policy-modal.js`
- `js/products.js`
- `js/supabase-client.js`
- `public/admin.html`
- `public/admin.js`

Reason:

- CSS files are imported by `app/layout.tsx`.
- `ProductShowcase` still imports `js/products.js`.
- Product modal loading still depends on `js/config.js` and `js/supabase-client.js`.
- Policy modal still depends on `js/policy-modal.js`.
- `public/admin.html` keeps the legacy admin URL compatible by forwarding to `/admin/login`.

## Local-Only / Ignored

- `.agent/` is ignored because it is a local Codex/UI skill folder, not production source.
- `supabase/.temp/` is local Supabase CLI state; migrations and schema source remain versioned.
- `.DS_Store`, `*.tsbuildinfo`, `.next/`, `node_modules/`, `.vercel/`, `out/`, logs, temp files, and env files are ignored.

## Next Cleanup Candidate

The remaining `js/` modules can be converted to React/TypeScript later:

- `js/products.js` -> `components/home/ProductModal.tsx` plus typed data/client.
- `js/policy-modal.js` -> fully controlled React modal.
- `js/config.js` / `js/supabase-client.js` -> typed client module under `lib/`.

Do this only after another visual and functional smoke test, because the product modal currently depends on these modules.
