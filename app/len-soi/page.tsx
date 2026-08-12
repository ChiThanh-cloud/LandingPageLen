import type { Metadata } from "next";
import Image from "next/image";
import { YarnCatalog } from "@/components/yarn-product/YarnCatalog";
import { siteConfig } from "@/data/site";
import { getAllYarnProducts } from "@/lib/products/supabase-products";

export const metadata: Metadata = {
  title: "Len sợi & Phụ kiện móc",
  description:
    "Mua len sợi từ 7.000đ – nhiều dòng len, giá rẻ. Xem giá và đặt hàng online giao toàn quốc tại Tiệm Len Nhà Tiny.",
  alternates: { canonical: "/len-soi" },
  openGraph: {
    title: "Len sợi & Phụ kiện móc | Tiệm Len Nhà Tiny",
    description:
      "Mua len sợi từ 7.000đ – nhiều dòng len, giá rẻ. Xem giá và đặt hàng online giao toàn quốc tại Tiệm Len Nhà Tiny.",
    url: "/len-soi",
    images: ["/images/yarn_collection_800.jpg"]
  }
};

export default async function YarnCategoryPage() {
  const products = await getAllYarnProducts();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${siteConfig.url}/len-soi`,
        name: "Cuộn len & Phụ kiện móc – Tiệm Len Nhà Tiny",
        description: "Danh mục len sợi và phụ kiện móc tại Tiệm Len Nhà Tiny."
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Trang chủ", item: siteConfig.url },
          { "@type": "ListItem", position: 2, name: "Cuộn len & Phụ kiện", item: `${siteConfig.url}/len-soi` }
        ]
      }
    ]
  };

  return (
    <main className="yc-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <section className="yc-hero">
        <div>
          <p className="yc-eyebrow">Cuộn len & Phụ kiện móc</p>
          <h1>
            Len sợi từ 7.000đ – nhiều màu, dễ chọn
          </h1>
          <p>Nhiều dòng len, nhiều mẫu và mức giá dễ tiếp cận. Xem giá và đặt hàng online giao toàn quốc tại Tiệm Len Nhà Tiny.</p>
        </div>
        <Image
          src="/images/yarn_hero_800.jpg"
          alt="Các cuộn len nhiều màu và phụ kiện móc tại Tiệm Len Nhà Tiny"
          width={800}
          height={600}
          priority
        />
      </section>
      <YarnCatalog products={products} />
      <section className="yc-help">
        <h2>Chưa chắc nên dùng loại nào?</h2>
        <p>Gửi ảnh mẫu cho Tiny để được gợi ý loại sợi, cỡ kim và số cuộn phù hợp.</p>
        <a href={siteConfig.zaloUrl} target="_blank" rel="noopener noreferrer">
          Nhắn Tiny tư vấn
        </a>
      </section>
    </main>
  );
}
