import { getAccessoryProductStructuredData } from "@/lib/products/accessory-product-seo";
import type { CommerceProduct } from "@/types/commerce-product";

export function AccessoryProductJsonLd({ product }: { product: CommerceProduct }) {
  const data = getAccessoryProductStructuredData(product);
  if (!data) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
