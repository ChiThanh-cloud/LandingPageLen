import type { Metadata } from "next";
import { siteConfig } from "@/data/site";
import type { CommerceProduct } from "@/types/commerce-product";

export function getAccessoryProductCanonical(slug: string) {
  return `${siteConfig.url}/phu-kien/${slug}`;
}

export function getAccessoryProductDescription(product: Pick<CommerceProduct, "name" | "description">) {
  const description = product.description.trim();
  return description || `Phụ kiện ${product.name} tại ${siteConfig.name}.`;
}

export function getAccessoryProductPageMetadata(product: CommerceProduct): Metadata {
  const canonical = getAccessoryProductCanonical(product.slug);
  const description = getAccessoryProductDescription(product);
  const titleWithBrand = `${product.name} | ${siteConfig.name}`;

  return {
    title: product.name,
    description,
    alternates: { canonical },
    openGraph: {
      title: titleWithBrand,
      description,
      type: "website",
      url: canonical,
      images: product.image ? [product.image] : []
    }
  };
}
