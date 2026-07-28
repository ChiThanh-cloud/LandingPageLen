import { siteConfig } from "@/data/site";
import type { BlogPostMeta } from "@/types/post";

function absoluteUrl(path: string) {
  if (path.startsWith("http")) return path;
  return `${siteConfig.url}${path}`;
}

export function PostJsonLd({ post }: { post: BlogPostMeta }) {
  const url = `${siteConfig.url}/blog/${post.slug}`;
  const imageUrl = absoluteUrl(post.ogImage || post.image);

  // Build graph nodes
  const graph: Record<string, unknown>[] = [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Trang chủ",
          item: siteConfig.url
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Blog",
          item: `${siteConfig.url}/blog`
        },
        {
          "@type": "ListItem",
          position: 3,
          name: post.breadcrumbLabel,
          item: url
        }
      ]
    },
    {
      "@type": "BlogPosting",
      headline: post.h1,
      description: post.description,
      // ImageObject array — required by Google for image carousel eligibility
      image: [
        {
          "@type": "ImageObject",
          url: imageUrl,
          width: 1200,
          height: 630
        }
      ],
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      author: {
        "@type": "Person",
        name: "Tiny",
        url: siteConfig.url,
        worksFor: {
          "@type": "Organization",
          name: siteConfig.name,
          url: siteConfig.url
        }
      },
      publisher: { "@id": `${siteConfig.url}/#business` },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": url
      },
      url,
      inLanguage: siteConfig.language,
      articleSection: post.category
    }
  ];

  // ItemList schema for graduation gift post — signals Google this page recommends products
  if (post.slug === "qua-tot-nghiep-handmade-y-nghia") {
    graph.push({
      "@type": "ItemList",
      name: "Quà tốt nghiệp handmade tại Tiệm Len Nhà Tiny",
      description: "Các loại quà tốt nghiệp handmade được làm theo yêu cầu tại Tiệm Len Nhà Tiny",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Hoa len tốt nghiệp handmade — tặng sinh nhật, tốt nghiệp",
          url: `${siteConfig.url}/san-pham/hoa-len-handmade`
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Thú len đội mũ cử nhân làm theo yêu cầu",
          url: `${siteConfig.url}/san-pham/thu-len-theo-yeu-cau`
        }
      ]
    });
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": graph
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c")
      }}
    />
  );
}
