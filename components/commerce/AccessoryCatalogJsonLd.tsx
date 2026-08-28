import { siteConfig } from "@/data/site";
import type { CommerceProduct } from "@/types/commerce-product";

const catalogUrl = `${siteConfig.url}/phu-kien`;

export function getAccessoryCatalogStructuredData(products: CommerceProduct[]) {
  const publicProducts = products.filter((product) => product.category === "accessory" && product.status !== "hidden");

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": catalogUrl,
        name: "Phụ kiện móc len – Kim móc, bông gòn & mắt thú",
        description: "Danh mục phụ kiện móc len đang bán tại Tiệm Len Nhà Tiny."
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Trang chủ", item: siteConfig.url },
          { "@type": "ListItem", position: 2, name: "Phụ kiện", item: catalogUrl }
        ]
      },
      ...(publicProducts.length > 0 ? [{
        "@type": "ItemList",
        "@id": `${catalogUrl}#product-list`,
        numberOfItems: publicProducts.length,
        itemListElement: publicProducts.map((product, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: product.name,
          url: `${catalogUrl}/${product.slug}`
        }))
      }] : [])
    ]
  };
}

export function AccessoryCatalogJsonLd({ products }: { products: CommerceProduct[] }) {
  const data = getAccessoryCatalogStructuredData(products);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
