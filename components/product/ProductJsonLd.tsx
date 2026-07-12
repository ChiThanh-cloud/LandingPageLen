import { siteConfig } from "@/data/site";
import type { ProductEntry } from "@/types/product";

function absoluteUrl(path: string) {
  if (path.startsWith("http")) return path;
  return `${siteConfig.url}${path}`;
}

export function ProductJsonLd({ product }: { product: ProductEntry }) {
  const url = `${siteConfig.url}/san-pham/${product.slug}`;
  const pageNode = {
    "@type": "CollectionPage",
    "@id": url,
    name: product.title,
    description: product.description,
    url,
    publisher: {
      "@type": "LocalBusiness",
      "@id": `${siteConfig.url}/#business`,
      name: siteConfig.name,
      telephone: siteConfig.phone,
      address: siteConfig.address
    }
  };

  const offerableNode =
    product.kind === "service"
      ? {
          "@type": "Service",
          name: product.schemaName,
          description: product.schemaDescription,
          provider: { "@id": `${siteConfig.url}/#business` },
          areaServed: "VN",
          serviceType: "Handmade crochet custom order"
        }
      : {
          "@type": "Product",
          name: product.schemaName,
          image: absoluteUrl(product.image),
          description: product.schemaDescription,
          brand: {
            "@type": "Brand",
            name: siteConfig.name
          }
        };

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
            name: product.name,
            item: url
          }
        ]
      },
      pageNode,
      offerableNode,
      {
        "@type": "FAQPage",
        mainEntity: product.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer
          }
        }))
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
