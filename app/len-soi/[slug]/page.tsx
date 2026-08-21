import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { YarnProductPage } from "@/components/yarn-product/YarnProductPage";
import { getAllYarnProducts, getYarnProductBySlug } from "@/lib/products/supabase-products";
import { getRelatedYarnProducts } from "@/lib/products/yarn-product-content";
import { getYarnProductPageMetadata } from "@/lib/products/yarn-product-seo";

export async function generateStaticParams() { return (await getAllYarnProducts()).map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const product = await getYarnProductBySlug(slug); if (!product) return {};
  return getYarnProductPageMetadata(product);
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getYarnProductBySlug((await params).slug);
  if (!product) notFound();
  const relatedProducts = getRelatedYarnProducts(product, await getAllYarnProducts());
  return <YarnProductPage product={product} relatedProducts={relatedProducts} />;
}
