import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { products } from "../data/products";
import { siteConfig } from "../data/site";
import { getAllPostMetadata } from "../lib/blog/get-all-posts";
import { getAllYarnProducts } from "../lib/products/supabase-products";
import robots from "./robots";
import sitemap, { getSitemapYarnProducts, getYarnProductSitemapEntries, getYarnCatalogLastModified } from "./sitemap";

test("SEO routes", async (t) => {
  const posts = getAllPostMetadata(new Date("2026-12-31T00:00:00+07:00"));
  const entries = await sitemap();
  const yarnProducts = await getAllYarnProducts();
  const urls = entries.map((entry) => entry.url);

  await t.test("sitemap contains every public route exactly once", () => {
    const expectedUrls = [
      siteConfig.url,
      `${siteConfig.url}/about`,
      `${siteConfig.url}/blog`,
      `${siteConfig.url}/len-soi`,
      ...posts.map((post) => `${siteConfig.url}/blog/${post.slug}`),
      ...yarnProducts.map((product) => `${siteConfig.url}/len-soi/${product.slug}`),
      ...products.map((product) => `${siteConfig.url}/san-pham/${product.slug}`)
    ];

    assert.deepEqual(new Set(urls), new Set(expectedUrls));
    assert.equal(urls.length, expectedUrls.length);
  });

  await t.test("sitemap product entries use the storefront catalog source and canonical paths", () => {
    const source = readFileSync(new URL("./sitemap.ts", import.meta.url), "utf8");
    assert.match(source, /from "@\/lib\/products\/supabase-products"/);
    assert.doesNotMatch(source, /from "@\/lib\/products\/yarn-products"/);

    const entries = getYarnProductSitemapEntries([
      {
        slug: "catalog-item-a",
        updatedAt: "2026-08-11T00:00:00.000Z",
        image: "/images/yarn_collection_800.jpg"
      },
      {
        slug: "catalog-item-a",
        updatedAt: "2026-08-11T00:00:00.000Z",
        image: "/images/yarn_collection_800.jpg"
      },
      {
        slug: "catalog-item-b",
        updatedAt: "2026-08-11T00:00:00.000Z",
        image: "/images/yarn_collection_800.jpg"
      }
    ]);

    assert.deepEqual(entries.map((entry) => entry.url), [
      `${siteConfig.url}/len-soi/catalog-item-a`,
      `${siteConfig.url}/len-soi/catalog-item-b`
    ]);
  });

  await t.test("sitemap remains available when the production catalog fails closed", async () => {
    const yarnProducts = await getSitemapYarnProducts(async () => {
      throw new Error("Supabase catalog is temporarily unavailable");
    });

    assert.deepEqual(yarnProducts, []);
    assert.ok(entries.some((entry) => entry.url === siteConfig.url));
    assert.ok(entries.some((entry) => entry.url === `${siteConfig.url}/blog`));
  });

  await t.test("the yarn catalog URL follows the latest product timestamp with a stable fallback", () => {
    const yarnCatalogEntry = entries.find((entry) => entry.url === `${siteConfig.url}/len-soi`);
    assert.equal(yarnCatalogEntry?.lastModified, getYarnCatalogLastModified(yarnProducts));
    assert.equal(getYarnCatalogLastModified([]), "2026-08-11");
    assert.equal(getYarnCatalogLastModified([{ updatedAt: "2026-08-14T00:00:00.000Z" }]), "2026-08-14T00:00:00.000Z");
  });

  await t.test("sitemap URLs and images are absolute HTTPS URLs", () => {
    for (const entry of entries) {
      assert.match(entry.url, /^https:\/\//);
      for (const image of entry.images ?? []) assert.match(image, /^https:\/\//);
    }
  });

  await t.test("sitemap entries have valid modification dates", () => {
    for (const entry of entries) {
      assert.ok(entry.lastModified);
      assert.ok(!Number.isNaN(new Date(entry.lastModified).getTime()));
    }
  });

  await t.test("robots advertises sitemap and protects internal tools", () => {
    const config = robots();
    assert.equal(config.sitemap, `${siteConfig.url}/sitemap.xml`);
    assert.equal(config.host, siteConfig.url);
    const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
    assert.deepEqual(rules[0], {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/admin/", "/tools/"]
    });
    assert.deepEqual(
      rules.slice(1).map((rule) => rule.userAgent),
      ["GPTBot", "Google-Extended", "CCBot", "Bytespider"]
    );
    for (const rule of rules.slice(1)) {
      assert.deepEqual(rule.disallow, ["/"]);
    }
  });
});

test("SEO content data", async (t) => {
  const posts = getAllPostMetadata(new Date("2026-12-31T00:00:00+07:00"));
  await t.test("post and product slugs are unique", () => {
    const postSlugs = posts.map((post) => post.slug);
    const productSlugs = products.map((product) => product.slug);
    assert.equal(new Set(postSlugs).size, postSlugs.length);
    assert.equal(new Set(productSlugs).size, productSlugs.length);
  });

  await t.test("indexable content has complete search and social fields", () => {
    for (const item of [...posts, ...products]) {
      assert.ok(item.title.trim());
      assert.ok(item.description.trim());
      assert.ok(item.h1.trim());
      assert.ok(item.ogTitle.trim());
      assert.ok(item.ogDescription.trim());
      assert.ok(item.imageAlt.trim());
      assert.ok(item.image.trim());
    }
  });
});

test("yarn route intent separation", async (t) => {
  const yarnCategorySource = readFileSync(new URL("./len-soi/page.tsx", import.meta.url), "utf8");
  const legacyRouteSource = readFileSync(new URL("./san-pham/[slug]/page.tsx", import.meta.url), "utf8");
  const nextConfigSource = readFileSync(new URL("../next.config.mjs", import.meta.url), "utf8");
  const headerSource = readFileSync(new URL("../components/layout/Header.tsx", import.meta.url), "utf8");
  const footerSource = readFileSync(new URL("../components/layout/Footer.tsx", import.meta.url), "utf8");
  const beginnerGuideSource = readFileSync(
    new URL("../content/blog/nguoi-moi-hoc-moc-len-nen-chon-loai-len-nao.mdx", import.meta.url),
    "utf8"
  );

  await t.test("/len-soi remains the transactional catalog", () => {
    assert.match(yarnCategorySource, /getAllYarnProducts/);
    assert.match(yarnCategorySource, /YarnCatalog/);
    assert.match(yarnCategorySource, /canonical:\s*"\/len-soi"/);
    assert.match(yarnCategorySource, /href=\{`\/len-soi\/\$\{product\.slug\}`\}/);
  });

  await t.test("legacy yarn guide data is removed without affecting protected showcase products", () => {
    assert.equal(products.some((product) => product.slug === "len-soi"), false);
    assert.deepEqual(products.map((product) => product.slug), [
      "set-tu-moc",
      "thu-len-theo-yeu-cau",
      "hoa-len-handmade"
    ]);
    assert.match(legacyRouteSource, /return <ProductDetailPage product=\{product\} \/>;/);
  });

  await t.test("legacy yarn guide permanently redirects to the catalog", () => {
    assert.match(
      nextConfigSource,
      /source:\s*"\/san-pham\/len-soi"[\s\S]*?destination:\s*"\/len-soi"[\s\S]*?statusCode:\s*301/
    );
  });

  await t.test("navigation exposes crawlable links to the yarn catalog", () => {
    assert.match(headerSource, /href:\s*"\/len-soi",\s*label:\s*"Len sợi"/);
    assert.match(footerSource, /<Link href="\/len-soi">Len sợi<\/Link>/);
    assert.match(footerSource, /yarnLinks\.map/);
  });

  await t.test("the old yarn guide is absent from the generated sitemap", async () => {
    const entries = await sitemap();
    assert.equal(entries.some((entry) => entry.url === `${siteConfig.url}/san-pham/len-soi`), false);
  });

  await t.test("beginner blog links the transactional catalog and real yarn product pages", () => {
    assert.match(beginnerGuideSource, /secondaryHref:\s*"\/len-soi"/);
    assert.match(beginnerGuideSource, /\[catalog len sợi\]\(\/len-soi\)/);
    assert.match(beginnerGuideSource, /\[Milk Bò 50g\]\(\/len-soi\/milk-bo\)/);
  });
});
