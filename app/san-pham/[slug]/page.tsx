import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailPage } from "@/components/product/ProductDetailPage";
import { getProductBySlug, products } from "@/data/products";
import { siteConfig } from "@/data/site";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function productUrl(slug: string) {
  return `${siteConfig.url}/san-pham/${slug}`;
}

export function generateStaticParams() {
  return products.map((product) => ({
    slug: product.slug
  }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return {};
  }

  const canonical = productUrl(product.slug);
  const image = product.ogImage || product.image;
  const absoluteImage = image.startsWith("http") ? image : `${siteConfig.url}${image}`;

  return {
    title: {
      absolute: product.title
    },
    description: product.description,
    alternates: {
      canonical
    },
    openGraph: {
      title: product.ogTitle,
      description: product.ogDescription,
      url: canonical,
      type: "website",
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      images: [
        {
          url: absoluteImage,
          width: 800,
          height: 600,
          alt: product.imageAlt
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: product.ogTitle,
      description: product.ogDescription,
      images: [absoluteImage]
    }
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return <ProductDetailPage product={product} />;
}
