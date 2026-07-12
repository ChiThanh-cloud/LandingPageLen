import type { MetadataRoute } from "next";
import { posts } from "@/data/posts";
import { products } from "@/data/products";
import { siteConfig } from "@/data/site";

function absoluteUrl(path: string) {
  if (path.startsWith("http")) return path;
  return `${siteConfig.url}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseLastModified = "2026-07-12";

  return [
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
      url: `${siteConfig.url}/blog`,
      lastModified: baseLastModified,
      changeFrequency: "weekly",
      priority: 0.8,
      images: [`${siteConfig.url}/images/og-image.jpg`]
    },
    ...posts.map((post) => ({
      url: `${siteConfig.url}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
      images: [absoluteUrl(post.ogImage || post.image)]
    })),
    ...products.map((product) => ({
      url: `${siteConfig.url}/san-pham/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "monthly" as const,
      priority: product.kind === "service" ? 0.85 : 0.8,
      images: [absoluteUrl(product.ogImage || product.image)]
    }))
  ];
}
