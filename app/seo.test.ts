import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { products } from "../data/products";
import { siteConfig } from "../data/site";
import { getAllPostMetadata } from "../lib/blog/get-all-posts";
import { getAllYarnProducts } from "../lib/products/supabase-products";
import { generateMetadata as generateLegacyProductMetadata } from "./san-pham/[slug]/page";
import robots from "./robots";
import sitemap, { getYarnProductSitemapEntries } from "./sitemap";

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
      disallow: ["/admin.html", "/tools/"]
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
  const legacyYarnGuide = products.find((product) => product.slug === "len-soi");
  const yarnCategorySource = readFileSync(new URL("./len-soi/page.tsx", import.meta.url), "utf8");
  const legacyRouteSource = readFileSync(new URL("./san-pham/[slug]/page.tsx", import.meta.url), "utf8");
  const legacyPageSource = readFileSync(new URL("../components/product/ProductDetailPage.tsx", import.meta.url), "utf8");
  const beginnerGuideSource = readFileSync(
    new URL("../content/blog/nguoi-moi-hoc-moc-len-nen-chon-loai-len-nao.mdx", import.meta.url),
    "utf8"
  );

  assert.ok(legacyYarnGuide, "legacy yarn guide must exist");

  await t.test("/len-soi remains the transactional catalog", () => {
    assert.match(yarnCategorySource, /getAllYarnProducts/);
    assert.match(yarnCategorySource, /YarnCatalog/);
    assert.match(yarnCategorySource, /canonical:\s*"\/len-soi"/);
  });

  await t.test("legacy guide is self-canonical and independently indexable", async () => {
    const metadata = await generateLegacyProductMetadata({ params: Promise.resolve({ slug: "len-soi" }) });
    const title = metadata.title as { absolute?: string } | undefined;

    assert.equal(metadata.alternates?.canonical, `${siteConfig.url}/san-pham/len-soi`);
    assert.equal(metadata.robots, undefined);
    assert.equal(title?.absolute, legacyYarnGuide.title);
  });

  await t.test("no redirect joins the two yarn routes", () => {
    assert.doesNotMatch(legacyRouteSource, /(?:permanentRedirect|redirect)\s*\(/);
    assert.match(legacyRouteSource, /return <ProductDetailPage product=\{product\} \/>;/);
  });

  await t.test("legacy guide copy and schema data stay informational", () => {
    assert.doesNotMatch(legacyYarnGuide.title, /\b(mua|giá|milk cotton|móc thú)\b/i);
    assert.doesNotMatch(legacyYarnGuide.description, /giá từ|từ\s+\d+[\d.,]*\s*(?:đ|vnd)/i);
    assert.equal(legacyYarnGuide.sections.some((section) => section.type === "priceTable"), false);
    assert.doesNotMatch(JSON.stringify(legacyYarnGuide.sections), /8\.000đ|giá tham khảo/i);
    assert.match(legacyYarnGuide.schemaDescription, /Hướng dẫn|chọn len/i);
  });

  await t.test("legacy guide sends purchase intent to the live catalog", () => {
    const catalogLink = legacyYarnGuide.sections.find(
      (section) =>
        section.type === "related" && section.links.some((link) => link.href === "/len-soi" && /xem len đang bán/i.test(link.title))
    );

    assert.ok(catalogLink);
    assert.match(legacyPageSource, /isYarnGuide[\s\S]*?href="\/len-soi"[\s\S]*?Xem len đang bán/);
  });

  await t.test("beginner blog separates catalog and guide links by intent", () => {
    assert.match(beginnerGuideSource, /secondaryHref:\s*"\/len-soi"/);
    assert.match(beginnerGuideSource, /\[Hướng dẫn chọn len sợi cho người mới\]\(\/san-pham\/len-soi\)/);
  });
});
