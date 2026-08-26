import type { MetadataRoute } from "next";
import { products } from "@/data/products";
import { siteConfig } from "@/data/site";
import { getAllPostMetadata } from "@/lib/blog/get-all-posts";
import { getCommerceProductPath } from "@/lib/products/commerce-catalog";
import { getAllSellableProducts } from "@/lib/products/commerce-products";
import type { CommerceProduct } from "@/types/commerce-product";

function absoluteUrl(path: string) {
  const normalized = path.trim();
  if (normalized.startsWith("http")) return normalized;
  return `${siteConfig.url}${normalized}`;
}

export function getSellableProductSitemapEntries(
  sellableProducts: ReadonlyArray<Pick<CommerceProduct, "category" | "slug" | "updatedAt" | "image" | "status">>
): MetadataRoute.Sitemap {
  const seenUrls = new Set<string>();

  return sellableProducts.flatMap((product) => {
    if ((product.category !== "yarn" && product.category !== "accessory") || product.status === "hidden") return [];
    const url = absoluteUrl(getCommerceProductPath(product));
    if (seenUrls.has(url)) return [];
    seenUrls.add(url);

    return [{
      url,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.85,
      ...(product.image.trim() ? { images: [absoluteUrl(product.image)] } : {})
    }];
  });
}

export async function getSitemapSellableProducts(
  loadProducts: () => Promise<CommerceProduct[]> = getAllSellableProducts
): Promise<CommerceProduct[]> {
  try {
    return await loadProducts();
  } catch {
    // The catalog intentionally fails closed in production. Sitemap generation
    // must remain available so crawlers can still discover stable site content.
    console.error("Unable to load sellable products for sitemap generation");
    return [];
  }
}

export function getCommerceCatalogLastModified(
  sellableProducts: ReadonlyArray<Pick<CommerceProduct, "updatedAt">>,
  fallback = "2026-08-11"
) {
  return sellableProducts.reduce((latest, product) => (
    product.updatedAt > latest ? product.updatedAt : latest
  ), fallback);
}

export function getYarnCatalogLastModified(
  yarnProducts: ReadonlyArray<Pick<CommerceProduct, "updatedAt">>,
  fallback = "2026-08-11"
) {
  return getCommerceCatalogLastModified(yarnProducts, fallback);
}

export function dedupeSitemapEntries(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  const seenUrls = new Set<string>();
  return entries.filter((entry) => {
    if (seenUrls.has(entry.url)) return false;
    seenUrls.add(entry.url);
    return true;
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseLastModified = siteConfig.updatedAt || "2026-07-12";
  const posts = getAllPostMetadata();
  const sellableProducts = await getSitemapSellableProducts();
  const yarnProducts = sellableProducts.filter((product) => product.category === "yarn");
  const yarnCatalogLastModified = getYarnCatalogLastModified(yarnProducts);
  const commerceCatalogLastModified = getCommerceCatalogLastModified(sellableProducts);
  const blogLastModified = posts.reduce<string>(
    (latest, post) => (post.updatedAt > latest ? post.updatedAt : latest),
    baseLastModified
  );

  return dedupeSitemapEntries([
    {
      url: siteConfig.url,
      lastModified: baseLastModified,
      changeFrequency: "weekly",
      priority: 1,
      images: [
        `${siteConfig.url}/images/og-image.jpg`,
        `${siteConfig.url}/images/hero_mobile_optimized_768.jpg`,
        `${siteConfig.url}/images/yarn_collection_800.jpg`,
        `${siteConfig.url}/images/crochet_products_800.jpg`,
        `${siteConfig.url}/images/gift_set_800.jpg`,
        `${siteConfig.url}/images/set_kit_800.jpg`
      ]
    },
    {
      url: `${siteConfig.url}/about`,
      lastModified: baseLastModified,
      changeFrequency: "monthly",
      priority: 0.6
    },
    {
      url: `${siteConfig.url}/blog`,
      lastModified: blogLastModified,
      changeFrequency: "weekly",
      priority: 0.8,
      images: [`${siteConfig.url}/images/og-image.jpg`]
    },
    ...posts.map((post) => ({
      url: `${siteConfig.url}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      images: [absoluteUrl(post.ogImage || post.image)]
    })),
    { url: `${siteConfig.url}/len-soi`, lastModified: yarnCatalogLastModified, changeFrequency: "weekly" as const, priority: 0.9 },
    { url: `${siteConfig.url}/len-soi-va-phu-kien`, lastModified: commerceCatalogLastModified, changeFrequency: "weekly" as const, priority: 0.9 },
    ...getSellableProductSitemapEntries(sellableProducts),
    ...products.filter((product) => product.slug !== "len-soi").map((product) => ({
      url: `${siteConfig.url}/san-pham/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "monthly" as const,
      priority: product.kind === "service" ? 0.85 : 0.8,
      images: [absoluteUrl(product.ogImage || product.image)]
    }))
  ]);
}
