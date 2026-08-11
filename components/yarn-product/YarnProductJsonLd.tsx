import { siteConfig } from "@/data/site";
import type { YarnProduct } from "@/types/yarn-product";

export function toAbsoluteUrl(value: string) {
  try {
    const parsed = new URL(value);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return value;
  } catch {
    // Relative image paths are resolved against the storefront origin below.
  }

  return new URL(value, siteConfig.url).toString();
}

export function getYarnProductStructuredData(product: YarnProduct) {
  const url = `${siteConfig.url}/len-soi/${product.slug}`;
  const inStock = product.variants.some((variant) => variant.stock === null || variant.stock > 0);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Trang chủ", item: siteConfig.url },
          { "@type": "ListItem", position: 2, name: "Cuộn len & Phụ kiện", item: `${siteConfig.url}/len-soi` },
          { "@type": "ListItem", position: 3, name: product.name, item: url }
        ]
      },
      {
        "@type": "Product",
        "@id": `${url}#product`,
        name: product.name,
        description: product.seoDescription,
        image: product.images.map(toAbsoluteUrl),
        url,
        sku: product.id,
        offers: {
          "@type": "Offer",
          url,
          priceCurrency: "VND",
          price: product.price,
          availability: `https://schema.org/${inStock ? "InStock" : "OutOfStock"}`,
          seller: { "@type": "Organization", name: siteConfig.name }
        }
      }
    ]
  };
}

export function YarnProductJsonLd({ product }: { product: YarnProduct }) {
  const data = getYarnProductStructuredData(product);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
