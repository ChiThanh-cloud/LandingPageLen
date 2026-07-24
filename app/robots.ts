import type { MetadataRoute } from "next";
import { siteConfig } from "@/data/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Allow all search crawlers and AI search crawlers (for AI Overview citations)
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin.html", "/tools/", "/migration-status"]
      },
      // Block AI training crawlers — protect content from being used for model training
      // Note: this does NOT affect Google Search indexing or AI Overviews (those use Googlebot)
      {
        userAgent: "GPTBot",
        disallow: ["/"]
      },
      {
        userAgent: "Google-Extended",
        disallow: ["/"]
      },
      {
        userAgent: "CCBot",
        disallow: ["/"]
      },
      {
        userAgent: "Bytespider",
        disallow: ["/"]
      }
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url
  };
}
