import type { Metadata } from "next";
import type { YarnProduct, YarnVariant } from "@/types/yarn-product";
import { siteConfig } from "@/data/site";

function present(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed || null;
}

function displayProductName(product: YarnProduct) {
  return product.name.replace(/^len\s+/i, "").trim() || product.name;
}

export function formatYarnPrice(price: number) {
  return `${price.toLocaleString("vi-VN")}đ`;
}

function isPositiveFinitePrice(price: number | null | undefined): price is number {
  return typeof price === "number" && Number.isFinite(price) && price > 0;
}

/** Public variants are already filtered by the Supabase catalog adapter. */
export function isPurchasableYarnVariant(variant: YarnVariant) {
  return variant.stock === null || variant.stock > 0;
}

/**
 * Lowest public retail price a customer can currently purchase. This is display
 * and SEO-only: checkout continues to re-query its trusted catalog data.
 */
export function getYarnProductStartingPrice(product: YarnProduct): number | null {
  const fallbackPrice = isPositiveFinitePrice(product.price) ? product.price : null;
  const prices = product.variants
    .filter(isPurchasableYarnVariant)
    .map((variant) => isPositiveFinitePrice(variant.price) ? variant.price : fallbackPrice)
    .filter((price): price is number => price !== null);

  return prices.length > 0 ? Math.min(...prices) : null;
}

export function getYarnCatalogStartingPrice(products: YarnProduct[]): number | null {
  const prices = products
    .map(getYarnProductStartingPrice)
    .filter((price): price is number => price !== null);

  return prices.length > 0 ? Math.min(...prices) : null;
}

export function getYarnProductVisibleColorCount(product: YarnProduct) {
  return product.variants.length;
}

export function getYarnProductPrimaryWeight(product: YarnProduct) {
  const weight = present(product.weight);
  return weight?.split(/\s*±\s*/)[0]?.trim() || null;
}

function nameAlreadyIncludesFact(name: string, fact: string) {
  const normalizedName = name.toLocaleLowerCase("vi-VN");
  const normalizedFact = fact.toLocaleLowerCase("vi-VN");
  const numericFact = normalizedFact.match(/^(\d+(?:[.,]\d+)?)\s*([\p{L}]+)$/u);

  if (numericFact) {
    const [, amount, unit] = numericFact;
    const escapedAmount = amount.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const escapedUnit = unit.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?:^|[^\\p{L}\\p{N}])${escapedAmount}\\s*${escapedUnit}(?=$|[^\\p{L}\\p{N}])`, "iu").test(normalizedName);
  }

  return normalizedName.includes(normalizedFact);
}

export function getYarnProductHeading(product: YarnProduct) {
  const name = displayProductName(product);
  const primaryWeight = getYarnProductPrimaryWeight(product);
  const yarnSize = present(product.yarnSize);
  const details = [
    name,
    primaryWeight && !nameAlreadyIncludesFact(name, primaryWeight) ? primaryWeight : null,
    yarnSize && !nameAlreadyIncludesFact(name, yarnSize) ? yarnSize : null
  ]
    .filter((value): value is string => Boolean(value));
  return `Len ${details.join(" ")} – Bảng màu & Giá`;
}

export function getYarnProductImageAlt(product: YarnProduct, variant?: Pick<YarnVariant, "colorCode" | "colorName"> | null) {
  const productAlt = getYarnProductHeading(product).replace(" – Bảng màu & Giá", "");
  const colorCode = present(variant?.colorCode);
  const colorName = present(variant?.colorName);

  if (colorCode) return `${productAlt} – mã màu ${colorCode}`;
  if (colorName) return `${productAlt} – ${colorName}`;
  return productAlt;
}

export function getYarnProductGalleryImageAlt(
  product: YarnProduct,
  mainImage: string,
  selectedVariant: YarnVariant | null
) {
  if (selectedVariant?.hasOwnImage && selectedVariant.image === mainImage) {
    return getYarnProductImageAlt(product, selectedVariant);
  }

  return getYarnProductImageAlt(product);
}

export function getYarnProductSeoMetadata(product: YarnProduct) {
  const startingPrice = getYarnProductStartingPrice(product);
  const facts = [
    present(product.weight),
    present(product.yarnSize) ? `sợi ${present(product.yarnSize)}` : null,
    present(product.material),
    present(product.hookSize) ? `kim ${present(product.hookSize)}` : null
  ].filter((value): value is string => Boolean(value));
  const colorCount = getYarnProductVisibleColorCount(product);
  const colorSentence = colorCount > 0
    ? `${colorCount} mã màu đang hiển thị.`
    : "Bảng màu đang hiển thị.";
  const description = startingPrice === null
    ? `${displayProductName(product)}. ${colorSentence} Xem bảng màu, thông số và tình trạng sản phẩm tại Tiệm Len Nhà Tiny.`
    : `${displayProductName(product)}${facts.length ? `: ${facts.join(", ")}.` : "."} ${colorSentence} Giá từ ${formatYarnPrice(startingPrice)}/cuộn.`;

  return {
    title: getYarnProductHeading(product),
    description
  };
}

export function getYarnProductPageMetadata(product: YarnProduct): Metadata {
  const seo = getYarnProductSeoMetadata(product);
  const titleWithBrand = `${seo.title} | ${siteConfig.name}`;

  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: `/len-soi/${product.slug}` },
    openGraph: {
      title: titleWithBrand,
      description: seo.description,
      type: "website",
      url: `/len-soi/${product.slug}`,
      images: [product.image]
    }
  };
}
