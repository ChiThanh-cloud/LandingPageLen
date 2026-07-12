import type { Metadata } from "next";
import { BlogIndex } from "@/components/blog/BlogIndex";
import { posts } from "@/data/posts";
import { siteConfig } from "@/data/site";

const blogTitle = "Blog Đồ Len Handmade Và Chart Móc Len | LenTiny";
const blogDescription =
  "Blog LenTiny chia sẻ cách chọn quà len handmade, kinh nghiệm móc len cho người mới, chart móc len và mẹo chăm đồ len.";
const canonical = `${siteConfig.url}/blog`;
const image = `${siteConfig.url}/images/og-image.jpg`;

export const metadata: Metadata = {
  title: {
    absolute: blogTitle
  },
  description: blogDescription,
  alternates: {
    canonical
  },
  openGraph: {
    title: blogTitle,
    description: blogDescription,
    url: canonical,
    type: "website",
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    images: [
      {
        url: image,
        width: 1200,
        height: 630,
        alt: "Tiệm Len Nhà Tiny - blog đồ len handmade"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: blogTitle,
    description: blogDescription,
    images: [image]
  }
};

export default function BlogPage() {
  return <BlogIndex posts={posts} />;
}
