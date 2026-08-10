import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { YarnProductPage } from "@/components/yarn-product/YarnProductPage";
import { getAllYarnProducts, getYarnProductBySlug } from "@/lib/products/supabase-products";

export async function generateStaticParams() { return (await getAllYarnProducts()).map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const product = await getYarnProductBySlug(slug); if (!product) return {};
  return { title: product.name, description: product.seoDescription, alternates: { canonical: `/len-soi/${product.slug}` }, openGraph: { title: product.name, description: product.seoDescription, type: "website", url: `/len-soi/${product.slug}`, images: [product.image] } };
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getYarnProductBySlug((await params).slug);
  if (!product) notFound();
  const relatedProducts = (await getAllYarnProducts()).filter((item) => item.id !== product.id).slice(0, 3);
  return <YarnProductPage product={product} relatedProducts={relatedProducts} />;
}
