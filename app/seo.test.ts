import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { products } from "../data/products";
import { siteConfig } from "../data/site";
import { getAllPostMetadata } from "../lib/blog/get-all-posts";
import { getCommerceProductPath } from "../lib/products/commerce-catalog";
import { getAllSellableProducts } from "../lib/products/commerce-products";
import type { CommerceProduct } from "../types/commerce-product";
import robots from "./robots";
import sitemap, {
  dedupeSitemapEntries,
  getCommerceCatalogLastModified,
  getSellableProductSitemapEntries,
  getSitemapSellableProducts,
  getYarnCatalogLastModified
} from "./sitemap";

test("SEO routes", async (t) => {
  const posts = getAllPostMetadata(new Date("2026-12-31T00:00:00+07:00"));
  const entries = await sitemap();
  const sellableProducts = await getAllSellableProducts();
  const yarnProducts = sellableProducts.filter((product) => product.category === "yarn");
  const urls = entries.map((entry) => entry.url);

  await t.test("sitemap contains every public route exactly once", () => {
    const expectedUrls = [
      siteConfig.url,
      `${siteConfig.url}/about`,
      `${siteConfig.url}/blog`,
      `${siteConfig.url}/len-soi`,
      `${siteConfig.url}/len-soi-va-phu-kien`,
      ...posts.map((post) => `${siteConfig.url}/blog/${post.slug}`),
      ...sellableProducts.map((product) => `${siteConfig.url}${getCommerceProductPath(product)}`),
      ...products
        .filter((product) => product.slug !== "len-soi")
        .map((product) => `${siteConfig.url}/san-pham/${product.slug}`)
    ];

    assert.deepEqual(new Set(urls), new Set(expectedUrls));
    assert.equal(urls.length, expectedUrls.length);
  });

  await t.test("yarn sitemap entries expose only canonical catalog and public product URLs", () => {
    const catalogUrl = `${siteConfig.url}/len-soi`;
    const yarnProductUrls = urls.filter((url) => url.startsWith(`${catalogUrl}/`));

    assert.equal(urls.filter((url) => url === catalogUrl).length, 1);
    assert.equal(urls.includes(`${siteConfig.url}/san-pham/len-soi`), false);
    assert.equal(new Set(yarnProductUrls).size, yarnProductUrls.length);
    assert.deepEqual(new Set(yarnProductUrls), new Set(
      yarnProducts.map((product) => `${catalogUrl}/${product.slug}`)
    ));
    for (const url of urls) {
      assert.doesNotMatch(url, /[?](?:filter|sort|q)=|\/(?:gio-hang|thanh-toan|dat-hang-thanh-cong)(?:\/|$)/);
    }
  });

  await t.test("sitemap uses the generic sellable adapter and category-specific detail paths", () => {
    const source = readFileSync(new URL("./sitemap.ts", import.meta.url), "utf8");
    assert.match(source, /from "@\/lib\/products\/commerce-products"/);
    assert.match(source, /getAllSellableProducts/);
    assert.match(source, /getCommerceProductPath/);
    assert.doesNotMatch(source, /from "@\/lib\/products\/supabase-products"/);

    const entries = getSellableProductSitemapEntries([
      {
        category: "yarn",
        slug: "catalog-item-a",
        updatedAt: "2026-08-11T00:00:00.000Z",
        image: "/images/yarn_collection_800.jpg",
        status: "available"
      },
      {
        category: "yarn",
        slug: "catalog-item-a",
        updatedAt: "2026-08-11T00:00:00.000Z",
        image: "/images/yarn_collection_800.jpg",
        status: "available"
      },
      {
        category: "accessory",
        slug: "kim-moc-can-mem",
        updatedAt: "2026-08-11T00:00:00.000Z",
        image: "",
        status: "available"
      },
      {
        category: "yarn",
        slug: "hidden-yarn",
        updatedAt: "2026-08-11T00:00:00.000Z",
        image: "/images/yarn_collection_800.jpg",
        status: "hidden"
      },
      {
        category: "handmade",
        slug: "protected-product",
        updatedAt: "2026-08-11T00:00:00.000Z",
        image: "/images/crochet_products_800.jpg",
        status: "available"
      } as unknown as Pick<CommerceProduct, "category" | "slug" | "updatedAt" | "image" | "status">
    ]);

    assert.deepEqual(entries.map((entry) => entry.url), [
      `${siteConfig.url}/len-soi/catalog-item-a`,
      `${siteConfig.url}/phu-kien/kim-moc-can-mem`
    ]);
    assert.equal(entries[1].images, undefined);
    assert.equal(entries.some((entry) => entry.url === `${siteConfig.url}/len-soi/kim-moc-can-mem`), false);
    assert.equal(entries.some((entry) => entry.url === `${siteConfig.url}/phu-kien/catalog-item-a`), false);
    assert.equal(entries.some((entry) => /hidden-yarn|protected-product/.test(entry.url)), false);
  });

  await t.test("sitemap remains available when the production catalog fails closed", async () => {
    const failedProducts = await getSitemapSellableProducts(async () => {
      throw new Error("Supabase catalog is temporarily unavailable");
    });

    assert.deepEqual(failedProducts, []);
    assert.ok(entries.some((entry) => entry.url === siteConfig.url));
    assert.ok(entries.some((entry) => entry.url === `${siteConfig.url}/blog`));
  });

  await t.test("yarn and umbrella catalog URLs follow their sellable product timestamps", () => {
    const yarnCatalogEntry = entries.find((entry) => entry.url === `${siteConfig.url}/len-soi`);
    const commerceCatalogEntry = entries.find((entry) => entry.url === `${siteConfig.url}/len-soi-va-phu-kien`);
    assert.equal(yarnCatalogEntry?.lastModified, getYarnCatalogLastModified(yarnProducts));
    assert.equal(commerceCatalogEntry?.lastModified, getCommerceCatalogLastModified(sellableProducts));
    assert.equal(getYarnCatalogLastModified([]), "2026-08-11");
    assert.equal(getCommerceCatalogLastModified([]), "2026-08-11");
    assert.equal(getYarnCatalogLastModified([{ updatedAt: "2026-08-14T00:00:00.000Z" }]), "2026-08-14T00:00:00.000Z");
  });

  await t.test("sitemap dedupes full URLs without removing stable catalog entries", () => {
    const duplicateUrl = `${siteConfig.url}/len-soi`;
    const deduped = dedupeSitemapEntries([
      { url: duplicateUrl, lastModified: "2026-08-11", priority: 0.9 },
      { url: duplicateUrl, lastModified: "2026-08-12", priority: 0.9 },
      { url: `${siteConfig.url}/len-soi-va-phu-kien`, lastModified: "2026-08-12", priority: 0.9 }
    ]);

    assert.deepEqual(deduped.map((entry) => entry.url), [
      duplicateUrl,
      `${siteConfig.url}/len-soi-va-phu-kien`
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

  await t.test("robots leaves the yarn catalog and product URLs crawlable", () => {
    const config = robots();
    const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
    const searchRule = rules.find((rule) => rule.userAgent === "*");
    const disallow = Array.isArray(searchRule?.disallow) ? searchRule.disallow : [searchRule?.disallow];

    assert.equal(searchRule?.allow, "/");
    assert.equal(disallow.includes("/len-soi"), false);
    assert.equal(disallow.includes("/len-soi/"), false);
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
  const redirectConfig = readFileSync(new URL("../next.config.mjs", import.meta.url), "utf8");
  const legacyPageSource = readFileSync(new URL("../components/product/ProductDetailPage.tsx", import.meta.url), "utf8");
  const beginnerGuideSource = readFileSync(
    new URL("../content/blog/nguoi-moi-hoc-moc-len-nen-chon-loai-len-nao.mdx", import.meta.url),
    "utf8"
  );

  assert.ok(legacyYarnGuide, "legacy yarn guide must exist");

  await t.test("/len-soi remains the transactional catalog", () => {
    assert.match(yarnCategorySource, /getAllYarnProducts/);
    assert.match(yarnCategorySource, /YarnCatalog/);
    assert.match(yarnCategorySource, /const canonical = `\$\{siteConfig\.url\}\/len-soi`;/);
    assert.match(yarnCategorySource, /alternates:\s*\{\s*canonical\s*\}/);
  });

  await t.test("legacy yarn URL has a direct permanent redirect to the informational guide", () => {
    assert.match(
      redirectConfig,
      /source:\s*["']\/san-pham\/len-soi["'][\s\S]*?destination:\s*["']\/blog\/nguoi-moi-hoc-moc-len-nen-chon-loai-len-nao["'][\s\S]*?statusCode:\s*301/
    );
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

  await t.test("beginner blog links the transactional catalog and real yarn product pages", () => {
    assert.match(beginnerGuideSource, /secondaryHref:\s*"\/len-soi"/);
    assert.match(beginnerGuideSource, /\[catalog len sợi\]\(\/len-soi\)/);
    assert.match(beginnerGuideSource, /\[Milk Bò 50g\]\(\/len-soi\/milk-bo\)/);
  });
});
