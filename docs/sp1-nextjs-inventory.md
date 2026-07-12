# SP1 Next.js Migration Inventory

Date: 2026-07-11
Branch created for SP1: `migration/nextjs`
Source rule: legacy HTML/CSS/JavaScript stays in place for comparison and rollback.

## Repository Structure Read

Top-level working source currently includes:

- `index.html`
- `blog.html`
- `admin.html`
- `chart-admin.html`
- `product-color-extractor.html` (ignored by `.gitignore`)
- `posts/`
- `san-pham/`
- `tools/`
- `css/`
- `js/`
- `images/`
- `charts/`
- `assets/`
- `supabase/` (ignored by `.gitignore`; not used for the Next.js frontend-only scaffold)
- `sitemap.xml`
- `robots.txt`
- `vercel.json`
- `.agent/` (ignored by `.gitignore`)

## HTML Files

- `index.html`
- `blog.html`
- `admin.html`
- `chart-admin.html`
- `product-color-extractor.html`
- `posts/vi-sao-qua-len-handmade-duoc-yeu-thich.html`
- `posts/nguoi-moi-hoc-moc-len-nen-chon-loai-len-nao.html`
- `posts/moc-thu-len-theo-anh-mat-bao-lau.html`
- `posts/cach-bao-quan-thu-len-handmade-de-luon-dep.html`
- `san-pham/len-soi.html`
- `san-pham/set-tu-moc.html`
- `san-pham/thu-len-theo-yeu-cau.html`
- `san-pham/hoa-len-handmade.html`
- `tools/chart-admin.html`
- `tools/chart-pdf-builder.html`
- `tools/media-upload.html`

## CSS Files

- `css/base.css`
- `css/blog.css`
- `css/layout.css`
- `css/admin.css`
- `css/responsive.css`
- `css/products.css`
- `css/animations.css`
- `css/chart.css`
- `css/sections.css`

## JavaScript Files

- `admin.js`
- `js/supabase-client.js`
- `js/analytics.js`
- `js/blog.js`
- `js/media-upload.js`
- `js/main.js`
- `js/config.js`
- `js/chart-utils.js`
- `js/chart-admin.js`
- `js/products.js`
- `js/ui.js`
- `js/policy-modal.js`

## Blog Pages

- `blog.html`
- `posts/vi-sao-qua-len-handmade-duoc-yeu-thich.html`
- `posts/nguoi-moi-hoc-moc-len-nen-chon-loai-len-nao.html`
- `posts/moc-thu-len-theo-anh-mat-bao-lau.html`
- `posts/cach-bao-quan-thu-len-handmade-de-luon-dep.html`

## Product Pages

- `san-pham/len-soi.html`
- `san-pham/set-tu-moc.html`
- `san-pham/thu-len-theo-yeu-cau.html`
- `san-pham/hoa-len-handmade.html`

## Images And Media Currently Used

Local files present in `images/`:

- `images/yarn_hero_800.jpg`
- `images/crochet_products_800.jpg`
- `images/set_kit_800.jpg`
- `images/logo_160.png`
- `images/feedback_1_700.jpg`
- `images/feedback_2_700.jpg`
- `images/feedback_3_700.jpg`
- `images/hero_video.mp4`
- `images/og-image.jpg`
- `images/gift_set_800.jpg`
- `images/yarn_collection_800.jpg`
- `images/favicon.png`
- `images/logo.png`
- `images/hero_mobile_optimized_768.jpg`

Local assets referenced by pages/styles:

- `images/favicon.png`
- `images/logo.png`
- `images/logo_160.png`
- `images/og-image.jpg`
- `images/hero_mobile_optimized_768.jpg`
- `images/hero_video.mp4`
- `images/yarn_hero_800.jpg`
- `images/yarn_collection_800.jpg`
- `images/crochet_products_800.jpg`
- `images/gift_set_800.jpg`
- `images/set_kit_800.jpg`
- `images/feedback_1_700.jpg`
- `images/feedback_2_700.jpg`
- `images/feedback_3_700.jpg`

Remote Cloudinary images referenced in current metadata:

- `https://res.cloudinary.com/djn2kd2hh/image/upload/v1783440185/dlpge3elo1s9nsr1kndl.png`
- `https://res.cloudinary.com/djn2kd2hh/image/upload/f_auto,q_auto,c_fill,w_800,h_1000/v1783440196/vs0ops3weoutiuklmoap.png`
- `https://res.cloudinary.com/djn2kd2hh/image/upload/f_auto,q_auto,c_fill,w_800,h_1000/v1783440313/ok1ydpmrflcgekwgsyye.png`

## Sitemap, Robots, And Vercel

- `sitemap.xml`: includes homepage, `blog.html`, 4 blog post URLs, and 4 product page URLs. `lastmod` is `2026-07-07`.
- `robots.txt`: allows `/`, disallows `/admin.html` and `/tools/`, points to `https://lentiny.xyz/sitemap.xml`.
- `vercel.json`: configures headers for `sitemap.xml`, `robots.txt`, and global security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security`).

## Analytics And Tracking Scripts

- Microsoft Clarity is installed in `index.html` with project id `wqieag9yv3`.
- Google Analytics 4 is installed in `index.html` and loads `G-C27736KHYT` after idle/load handling.
- Facebook Pixel code exists in `index.html` but is commented out and still uses placeholder `YOUR_PIXEL_ID`.
- `js/analytics.js` maps `data-track` events to custom events and forwards to `fbq` and `gtag` when those globals exist.
- Current tracked DOM attributes in `index.html`: `contact_facebook_click`, `float_facebook_click`.

## Metadata, Canonical, And Schema

Homepage:

- `index.html`: title, description, canonical `https://lentiny.xyz/`, Open Graph, Twitter card, favicon/apple icon, and JSON-LD using `LocalBusiness`, `WebSite`, `Store`, and `FAQPage`.

Blog index:

- `blog.html`: title, description, canonical `https://lentiny.xyz/blog.html`, Open Graph image `https://lentiny.xyz/images/og-image.jpg`.

Blog posts:

- `posts/vi-sao-qua-len-handmade-duoc-yeu-thich.html`: title, description, canonical, Open Graph, `BlogPosting` JSON-LD.
- `posts/nguoi-moi-hoc-moc-len-nen-chon-loai-len-nao.html`: title, description, canonical, Open Graph with Cloudinary image, `BlogPosting` JSON-LD.
- `posts/moc-thu-len-theo-anh-mat-bao-lau.html`: title, description, canonical, Open Graph with Cloudinary image, `BlogPosting` JSON-LD.
- `posts/cach-bao-quan-thu-len-handmade-de-luon-dep.html`: title, description, canonical, Open Graph with Cloudinary image, `BlogPosting` JSON-LD.

Product pages:

- `san-pham/len-soi.html`: title, description, canonical, Open Graph, JSON-LD graph with `BreadcrumbList`, `CollectionPage`, `Product`, and `FAQPage`.
- `san-pham/set-tu-moc.html`: title, description, canonical, Open Graph, JSON-LD graph with `BreadcrumbList`, `CollectionPage`, `Product`, and `FAQPage`.
- `san-pham/thu-len-theo-yeu-cau.html`: title, description, canonical, Open Graph, JSON-LD graph with `BreadcrumbList`, `CollectionPage`, `Service`, and `FAQPage`.
- `san-pham/hoa-len-handmade.html`: title, description, canonical, Open Graph, JSON-LD graph with `BreadcrumbList`, `CollectionPage`, `Product`, and `FAQPage`.

Tools/admin:

- `admin.html`: title only.
- `chart-admin.html`: redirect page with title and canonical to `https://lentiny.xyz/tools/chart-admin.html`.
- `tools/chart-admin.html`: title and description.
- `tools/chart-pdf-builder.html`: title.
- `tools/media-upload.html`: title and description.
- `product-color-extractor.html`: title only.

## SP1 Scaffold Added

- `package.json`: Next.js/React/TypeScript scripts and pinned frontend dependencies.
- `next.config.mjs`: strict React mode and no powered-by header.
- `tsconfig.json`: strict TypeScript config for App Router.
- `next-env.d.ts`: Next.js TypeScript declarations.
- `app/layout.tsx`: root layout only.
- `app/globals.css`: minimal styling for scaffold route only.
- `app/migration-status/page.tsx`: verification route for SP1. This is not a homepage, blog, or product conversion.
- `public/.gitkeep`: placeholder for Next.js public assets in later steps.

## Explicit SP1 Non-Goals Preserved

- No backend was added.
- No database, Supabase runtime dependency, Redis, or API route was added.
- `index.html` was not converted to React.
- `blog.html` and `posts/*.html` were not converted to React.
- `san-pham/*.html` was not converted to React.
- Existing legacy source files were not moved or deleted.
