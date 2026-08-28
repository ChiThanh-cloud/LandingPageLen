import type { Metadata } from "next";
import { siteConfig } from "@/data/site";
import { getCommerceStockLimit } from "@/lib/products/accessory-product-detail";
import { isCommerceVariantOrderable } from "@/lib/products/commerce-orderability";
import { getCommerceVariantPrice } from "@/lib/products/commerce-pricing";
import type { CommerceProduct } from "@/types/commerce-product";

export function getAccessoryProductCanonical(slug: string) {
  return `${siteConfig.url}/phu-kien/${slug}`;
}

export function getAccessoryProductDescription(
  product: Pick<CommerceProduct, "name" | "description" | "unitLabel" | "optionLabel">
) {
  const description = product.description.trim();
  return description || `${product.name} là phụ kiện móc len tại ${siteConfig.name}, bán theo ${product.unitLabel}. Xem giá và các lựa chọn ${product.optionLabel.toLocaleLowerCase("vi-VN")} đang hiển thị.`;
}

export function toAbsoluteAccessoryImageUrl(value: string) {
  try {
    const parsed = new URL(value);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return value;
  } catch {
    // Relative storefront images are resolved below.
  }

  return new URL(value, siteConfig.url).toString();
}

function getOrderableAccessoryVariants(product: CommerceProduct) {
  return product.variants.filter((variant) => (
    isCommerceVariantOrderable(variant.status) && getCommerceStockLimit(variant.stock) !== 0
  ));
}

type AccessoryAvailability = "InStock" | "PreOrder" | "OutOfStock";

function getAccessoryOfferPrice(
  product: CommerceProduct,
  availability: AccessoryAvailability
) {
  const orderableVariants = getOrderableAccessoryVariants(product);
  const representedVariants = availability === "InStock"
    ? orderableVariants.filter((variant) => variant.status !== "preorder")
    : availability === "PreOrder" && product.status !== "preorder"
      ? orderableVariants.filter((variant) => variant.status === "preorder")
      : orderableVariants;
  const prices = representedVariants
    .map((variant) => getCommerceVariantPrice(product, variant))
    .filter((price): price is number => price !== null);

  return prices.length > 0 ? Math.min(...prices) : null;
}

export function getAccessoryAvailability(product: CommerceProduct): AccessoryAvailability | null {
  if (product.status === "hidden") return null;
  if (product.status === "out") return "OutOfStock";

  const orderableVariants = getOrderableAccessoryVariants(product);

  if (orderableVariants.length === 0) return "OutOfStock";
  if (product.status === "preorder") return "PreOrder";
  if (orderableVariants.some((variant) => variant.status !== "preorder")) return "InStock";
  return "PreOrder";
}

export function getAccessoryProductStructuredData(product: CommerceProduct) {
  const availability = getAccessoryAvailability(product);
  if (availability === null) return null;

  const url = getAccessoryProductCanonical(product.slug);
  const publicVariants = product.variants.filter((variant) => variant.status !== "hidden");
  const offerPrice = getAccessoryOfferPrice(product, availability);
  const images = Array.from(new Set(
    [product.coverImage, product.image, ...publicVariants.map((variant) => variant.image)]
      .filter((image): image is string => Boolean(image?.trim()))
      .map(toAbsoluteAccessoryImageUrl)
  ));

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Trang chủ", item: siteConfig.url },
          { "@type": "ListItem", position: 2, name: "Phụ kiện", item: `${siteConfig.url}/phu-kien` },
          { "@type": "ListItem", position: 3, name: product.name, item: url }
        ]
      },
      {
        "@type": "Product",
        "@id": `${url}#product`,
        name: product.name,
        description: getAccessoryProductDescription(product),
        ...(images.length > 0 ? { image: images } : {}),
        url,
        ...(offerPrice !== null ? {
          offers: {
            "@type": "Offer",
            url,
            priceCurrency: "VND",
            price: offerPrice,
            availability: `https://schema.org/${availability}`,
            seller: { "@type": "Organization", name: siteConfig.name }
          }
        } : {})
      }
    ]
  };
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
