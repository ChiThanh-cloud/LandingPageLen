import { siteConfig } from "@/data/site";
import {
  getYarnProductSeoMetadata,
  getYarnProductStartingPrice,
  isPurchasableYarnVariant
} from "@/lib/products/yarn-product-seo";
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
  const inStock = product.variants.some(isPurchasableYarnVariant);
  const startingPrice = getYarnProductStartingPrice(product);
  const offerPrice = startingPrice ?? (!inStock && product.price > 0 && Number.isFinite(product.price) ? product.price : null);
  const seo = getYarnProductSeoMetadata(product);

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
        description: seo.description,
        image: product.images.map(toAbsoluteUrl),
        url,
        sku: product.id,
        ...(product.material?.trim() ? { material: product.material } : {}),
        ...(offerPrice === null ? {} : {
          offers: {
            "@type": "Offer",
            url,
            priceCurrency: "VND",
            price: offerPrice,
            availability: `https://schema.org/${inStock ? "InStock" : "OutOfStock"}`,
            seller: { "@type": "Organization", name: siteConfig.name }
          }
        })
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
