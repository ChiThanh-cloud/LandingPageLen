import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogPostPage } from "@/components/blog/BlogPostPage";
import { getPostBySlug, posts } from "@/data/posts";
import { siteConfig } from "@/data/site";

type BlogPostRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

function postUrl(slug: string) {
  return `${siteConfig.url}/blog/${slug}`;
}

function absoluteImage(path: string) {
  if (path.startsWith("http")) return path;
  return `${siteConfig.url}${path}`;
}

function getOgImage(path: string) {
  const url = absoluteImage(path);
  if (url.includes("res.cloudinary.com")) {
    if (url.includes("/image/upload/")) {
      return url.replace("/image/upload/", "/image/upload/c_fill,w_1200,h_630,g_auto/");
    }
    if (url.includes("/images/")) {
      return url.replace("/images/", "/images/c_fill,w_1200,h_630,g_auto/");
    }
  }
  return url;
}

export function generateStaticParams() {
  return posts.map((post) => ({
    slug: post.slug
  }));
}

export async function generateMetadata({ params }: BlogPostRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {};
  }

  const canonical = postUrl(post.slug);
  const image = getOgImage(post.ogImage || post.image);

  return {
    title: {
      absolute: post.title
    },
    description: post.description,
    alternates: {
      canonical
    },
    openGraph: {
      title: post.ogTitle,
      description: post.ogDescription,
      url: canonical,
      type: "article",
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      section: post.category,
      authors: [post.author],
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: post.imageAlt
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: post.ogTitle,
      description: post.ogDescription,
      images: [image]
    }
  };
}

export default async function BlogPostRoute({ params }: BlogPostRouteProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return <BlogPostPage post={post} />;
}
