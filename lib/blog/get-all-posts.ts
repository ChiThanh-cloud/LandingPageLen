import { posts as legacyPosts } from "@/data/posts";
import { mdxPostMetadata } from "./post-registry.generated";
import type { BlogPostMeta } from "@/types/post";

function isPublicPost(post: BlogPostMeta, now: Date) {
  if (post.status === "draft") return false;
  return new Date(`${post.publishedAt}T00:00:00+07:00`) <= now;
}

export function getAllPostMetadata(now = new Date()) {
  const migratedSlugs = new Set(mdxPostMetadata.map((post) => post.slug));
  const posts: BlogPostMeta[] = [
    ...mdxPostMetadata,
    ...legacyPosts.filter((post) => !migratedSlugs.has(post.slug))
  ];

  return posts
    .filter((post) => isPublicPost(post, now))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getLatestPostMetadata(limit = 3, now = new Date()) {
  if (!Number.isInteger(limit) || limit <= 0) return [];
  return getAllPostMetadata(now).slice(0, limit);
}
