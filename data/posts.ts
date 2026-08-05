import type { BlogPost } from "@/types/post";

// All posts have been migrated to MDX format in /content/blog/
// This file is kept for backward-compatibility with get-all-posts.ts
// which merges mdxPostMetadata + legacy posts (filtering by slug deduplication).
export const posts: BlogPost[] = [];

export const postSlugs = posts.map((post) => post.slug);

export function getPostBySlug(slug: string) {
  return posts.find((post) => post.slug === slug);
}
