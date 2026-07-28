import type { ComponentType } from "react";
import { getPostBySlug as getLegacyPostBySlug } from "@/data/posts";
import {
  mdxPostLoaders,
  mdxPostMetadata
} from "./post-registry.generated";
import type { BlogPost, BlogPostMeta } from "@/types/post";

export type LoadedBlogPost =
  | {
      source: "mdx";
      meta: BlogPostMeta;
      Content: ComponentType;
    }
  | {
      source: "legacy";
      meta: BlogPost;
      legacyPost: BlogPost;
    };

export async function getPostBySlug(slug: string): Promise<LoadedBlogPost | undefined> {
  const meta = mdxPostMetadata.find((post) => post.slug === slug);

  if (meta) {
    if (meta.status === "draft") return undefined;

    const loader = mdxPostLoaders[slug];
    if (!loader) throw new Error(`Missing generated MDX loader for ${slug}`);

    const contentModule = await loader();
    return {
      source: "mdx",
      meta,
      Content: contentModule.default
    };
  }

  const legacyPost = getLegacyPostBySlug(slug);
  if (!legacyPost) return undefined;

  return {
    source: "legacy",
    meta: legacyPost,
    legacyPost
  };
}
