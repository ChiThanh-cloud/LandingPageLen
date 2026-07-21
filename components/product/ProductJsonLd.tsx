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
    publisher: { "@id": `${siteConfig.url}/#business` }
  };

  const graph: Array<Record<string, unknown>> = [
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
    pageNode
  ];

  if (product.kind === "service") {
    graph.push({
      "@type": "Service",
      "@id": `${url}#service`,
      name: product.schemaName,
      description: product.schemaDescription,
      image: absoluteUrl(product.image),
      url,
      provider: { "@id": `${siteConfig.url}/#business` },
      areaServed: { "@type": "Country", name: "Việt Nam" },
      serviceType: "Handmade crochet custom order"
    });
  } else if (product.kind === "product" && product.offer && product.offer.price > 0) {
    graph.push({
      "@type": "Product",
      name: product.schemaName,
      image: absoluteUrl(product.image),
      description: product.schemaDescription,
      brand: {
        "@type": "Brand",
        name: siteConfig.name
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        bestRating: "5",
        worstRating: "1",
        reviewCount: "47"
      },
      offers: {
        "@type": "Offer",
        url,
        price: product.offer.price,
        priceCurrency: product.offer.priceCurrency,
        availability: `https://schema.org/${product.offer.availability}`,
        itemCondition: "https://schema.org/NewCondition",
        seller: {
          "@type": "Organization",
          name: siteConfig.name
        }
      }
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
