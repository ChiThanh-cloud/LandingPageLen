import { z } from "zod";
import type { BlogPostMeta } from "@/types/post";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected an ISO date (YYYY-MM-DD)");

export const blogPostMetaSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  ogTitle: z.string().min(1),
  ogDescription: z.string().min(1),
  category: z.string().min(1),
  categorySlug: z.string().min(1),
  tags: z.array(z.string().min(1)),
  searchText: z.string(),
  publishedAt: isoDate,
  updatedAt: isoDate,
  author: z.string().min(1),
  eyebrow: z.string().min(1),
  breadcrumbLabel: z.string().min(1),
  h1: z.string().min(1),
  lead: z.string().min(1),
  excerpt: z.string().min(1),
  image: z.string().min(1),
  imageAlt: z.string().min(1),
  ogImage: z.string().min(1).optional(),
  status: z.enum(["draft", "published"]),
  featured: z.boolean().optional(),
  ctaType: z.enum(["custom-order", "gift", "starter-kit", "product-care", "general"]).optional(),
  heroCta: z
    .object({
      primaryLabel: z.string().min(1),
      secondaryLabel: z.string().min(1),
      secondaryHref: z.string().startsWith("/")
    })
    .optional()
});

export function validateMdxPostMeta(input: unknown, fileSlug: string): BlogPostMeta {
  const result = blogPostMetaSchema.safeParse(input);

  if (!result.success) {
    throw new Error(`Invalid blog metadata in ${fileSlug}.mdx: ${z.prettifyError(result.error)}`);
  }

  if (result.data.slug !== fileSlug) {
    throw new Error(
      `Blog slug mismatch: content/blog/${fileSlug}.mdx exports "${result.data.slug}"`
    );
  }

  return result.data;
}
