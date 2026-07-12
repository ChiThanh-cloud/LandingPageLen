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
- `public/admin.html`, `public/tools/`, `public/charts/`, `public/assets/`, `public/css/`, `public/js/` - internal static admin/chart/media tools served by Next.js public assets.
- `css/` - global styles imported by `app/layout.tsx`.
- `js/` - small legacy modules still used by React components.
- `lib/` - shared tracking helper.
- Admin/chart/media tools are still kept because they are still used, but they now live under `public/` so production can serve `/admin.html`, `/chart-admin.html`, `/tools/...`, `/charts/...`, and `/assets/...`.

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
- `public/chart-admin.html`
- `public/tools/`
- `public/charts/`
- `public/assets/`
- `public/css/admin.css`
- `public/css/chart.css`
- `public/js/chart-admin.js`
- `public/js/chart-utils.js`
- `public/js/media-upload.js`

Reason:

- CSS files are imported by `app/layout.tsx`.
- `ProductShowcase` still imports `js/products.js`.
- Product modal loading still depends on `js/config.js` and `js/supabase-client.js`.
- Policy modal still depends on `js/policy-modal.js`.
- Admin/chart/media tools are still used and are served as static public assets.
- Tool pages reference `public/images/logo_160.png` through the production `/images/...` path shape.

## Local-Only / Ignored

- `.agent/` is ignored because it is a local Codex/UI skill folder, not production source.
- `supabase/` is ignored and remains local-only unless a future backend/admin workflow needs it.
- `.DS_Store`, `*.tsbuildinfo`, `.next/`, `node_modules/`, `.vercel/`, `out/`, logs, temp files, and env files are ignored.

## Next Cleanup Candidate

The remaining `js/` modules can be converted to React/TypeScript later:

- `js/products.js` -> `components/home/ProductModal.tsx` plus typed data/client.
- `js/policy-modal.js` -> fully controlled React modal.
- `js/config.js` / `js/supabase-client.js` -> typed client module under `lib/`.

Do this only after another visual and functional smoke test, because the product modal currently depends on these modules.

Admin/tool hardening can be handled as a separate pass:

- Add real authentication/protection in front of `/admin.html` and `/tools/...`, or
- Move internal tools under protected Next.js routes, or
- Move them to a separate internal repository/project when the workflow grows.
