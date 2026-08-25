import { siteConfig } from "@/data/site";
import type { YarnProduct } from "@/types/yarn-product";

const catalogUrl = `${siteConfig.url}/len-soi`;

/**
 * Builds catalog-only structured data from the same public products rendered on
 * /len-soi. Keep this separate from Product JSON-LD so the category never
 * makes product-level claims such as availability or ratings.
 */
export function getYarnCatalogStructuredData(products: YarnProduct[]) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": catalogUrl,
        name: "Cuộn len & Phụ kiện móc – Tiệm Len Nhà Tiny",
        description: "Danh mục len sợi và phụ kiện móc tại Tiệm Len Nhà Tiny."
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Trang chủ", item: siteConfig.url },
          { "@type": "ListItem", position: 2, name: "Len sợi", item: catalogUrl }
        ]
      },
      ...(products.length > 0 ? [{
        "@type": "ItemList",
        "@id": `${catalogUrl}#product-list`,
        numberOfItems: products.length,
        itemListElement: products.map((product, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: product.name,
          url: `${catalogUrl}/${product.slug}`
        }))
      }] : [])
    ]
  };
}

export function YarnCatalogJsonLd({ products }: { products: YarnProduct[] }) {
  const data = getYarnCatalogStructuredData(products);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
