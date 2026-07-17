import assert from "node:assert/strict";
import test from "node:test";
import { posts } from "../data/posts";
import { products } from "../data/products";
import { siteConfig } from "../data/site";
import robots from "./robots";
import sitemap from "./sitemap";

test("SEO routes", async (t) => {
  const entries = sitemap();
  const urls = entries.map((entry) => entry.url);

  await t.test("sitemap contains every public route exactly once", () => {
    const expectedUrls = [
      siteConfig.url,
      `${siteConfig.url}/blog`,
      ...posts.map((post) => `${siteConfig.url}/blog/${post.slug}`),
      ...products.map((product) => `${siteConfig.url}/san-pham/${product.slug}`)
    ];

    assert.deepEqual(new Set(urls), new Set(expectedUrls));
    assert.equal(urls.length, expectedUrls.length);
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
    assert.deepEqual(config.rules, {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin.html", "/tools/", "/migration-status"]
    });
  });
});

test("SEO content data", async (t) => {
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
