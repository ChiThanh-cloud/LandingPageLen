# Production Cleanup Proposal

Date: 2026-07-12
Branch: migration/nextjs

This file is a non-destructive cleanup proposal. Nothing below was deleted.

## Keep For Production Next.js

- `app/`
- `components/`
- `data/`
- `types/`
- `public/`
- `css/`
- `js/products.js`
- `package.json`
- `package-lock.json`
- `next.config.mjs`
- `tsconfig.json`
- `eslint.config.mjs`
- `next-env.d.ts`

Notes:

- `css/` is still imported by the Next.js app.
- `js/products.js` is still used by the homepage product modal.
- `public/images/` is the runtime image source for Next.js.

## Can Remove After Production Deploy Is Verified

These are legacy static-site files and folders. Keep them until the Next.js production deployment, redirects, sitemap, and Search Console checks are confirmed.

- `index.html`
- `blog.html`
- `posts/`
- `san-pham/`
- `images/`
- `sitemap.xml`
- `robots.txt`

Reason:

- The Next.js app now owns `/`, `/blog`, `/blog/[slug]`, `/san-pham/[slug]`, `/sitemap.xml`, and `/robots.txt`.
- Old `.html` URLs should remain protected by 301 redirects before legacy files are removed.
- `images/` has been copied into `public/images/`, but keeping it temporarily preserves rollback safety.

## Should Split Or Archive Separately

These are admin/tooling files, not part of the public frontend migration.

- `admin.html`
- `admin.js`
- `chart-admin.html`
- `tools/`
- `charts/`
- `assets/`
- `supabase/`
- `js/supabase-client.js`
- `js/chart-admin.js`
- `js/chart-utils.js`
- `js/media-upload.js`
- `css/admin.css`
- `css/chart.css`

Recommendation:

- Move them to a separate internal/admin project or archive branch after confirming whether they are still used.
- Do not ship them as public production assets unless they are intentionally protected and maintained.

## Safe Local Cleanup Candidate

- `.agent/skills/ui-ux-pro-max/scripts/__pycache__/`

Reason:

- Python bytecode cache generated while using the local UI skill.
- Safe to delete, but it was left untouched because cleanup requires explicit approval.

## Not Recommended To Delete Yet

- `docs/`
- `.agent/`
- `vercel.json`

Reason:

- `docs/` records migration context.
- `.agent/` contains the requested local UI skill.
- `vercel.json` still documents existing security/header behavior and should only be changed after final deployment review.
