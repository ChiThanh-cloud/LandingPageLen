import { siteConfig } from "@/data/site";
import type { BlogPost } from "@/types/post";

function absoluteUrl(path: string) {
  if (path.startsWith("http")) return path;
  return `${siteConfig.url}${path}`;
}

export function PostJsonLd({ post }: { post: BlogPost }) {
  const url = `${siteConfig.url}/blog/${post.slug}`;
  const image = absoluteUrl(post.ogImage || post.image);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
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
        image,
        datePublished: post.publishedAt,
        dateModified: post.updatedAt,
        author: {
          "@type": "Organization",
          name: post.author
        },
        publisher: {
          "@type": "LocalBusiness",
          "@id": `${siteConfig.url}/#business`,
          name: siteConfig.name,
          url: siteConfig.url,
          logo: {
            "@type": "ImageObject",
            url: `${siteConfig.url}/images/logo.png`
          },
          telephone: siteConfig.phone
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": url
        },
        url,
        inLanguage: siteConfig.language,
        articleSection: post.category
      }
    ]
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
