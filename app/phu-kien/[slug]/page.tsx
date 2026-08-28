import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccessoryProductPage } from "@/components/commerce/AccessoryProductPage";
import { AccessoryProductJsonLd } from "@/components/commerce/AccessoryProductJsonLd";
import { getAccessoryProductBySlug } from "@/lib/products/commerce-products";
import { getAccessoryProductPageMetadata } from "@/lib/products/accessory-product-seo";

type AccessoryProductRouteProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: AccessoryProductRouteProps): Promise<Metadata> {
  const product = await getAccessoryProductBySlug((await params).slug);
  if (!product) return {};
  return getAccessoryProductPageMetadata(product);
}

export default async function AccessoryProductRoute({ params }: AccessoryProductRouteProps) {
  const product = await getAccessoryProductBySlug((await params).slug);
  if (!product) notFound();
  return (
    <>
      <AccessoryProductJsonLd product={product} />
      <AccessoryProductPage product={product} />
    </>
  );
}
