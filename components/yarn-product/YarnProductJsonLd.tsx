import { siteConfig } from "@/data/site";
import type { YarnProduct } from "@/types/yarn-product";

export function YarnProductJsonLd({ product }: { product: YarnProduct }) {
  const url = `${siteConfig.url}/len-soi/${product.slug}`;
  const inStock = product.variants.some((variant) => variant.stock === null || variant.stock > 0);
  const data = { "@context": "https://schema.org", "@graph": [{ "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Trang chủ", item: siteConfig.url }, { "@type": "ListItem", position: 2, name: "Len sợi", item: `${siteConfig.url}/len-soi` }, { "@type": "ListItem", position: 3, name: product.name, item: url }] }, { "@type": "Product", "@id": `${url}#product`, name: product.name, description: product.seoDescription, image: product.images.map((image) => `${siteConfig.url}${image}`), sku: product.id, brand: { "@type": "Brand", name: siteConfig.name }, offers: { "@type": "Offer", url, priceCurrency: "VND", price: product.price, availability: `https://schema.org/${inStock ? "InStock" : "OutOfStock"}`, itemCondition: "https://schema.org/NewCondition", seller: { "@type": "Organization", name: siteConfig.name } } }] };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
