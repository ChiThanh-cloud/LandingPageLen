import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { YarnCatalog } from "@/components/yarn-product/YarnCatalog";
import { siteConfig } from "@/data/site";
import { getAllYarnProducts } from "@/lib/products/supabase-products";
import { formatYarnPrice, getYarnCatalogStartingPrice } from "@/lib/products/yarn-product-seo";

const canonical = `${siteConfig.url}/len-soi`;
const description =
  "Mua len sợi đan móc tại Tiny: xem bảng màu, giá và thông số của Milk Bò, Milk Cotton Mác Đen, Nhung Đũa, Nhung Gấu cùng các dòng len đang bán.";

export const metadata: Metadata = {
  title: "Len Sợi Đan Móc – Bảng Màu & Giá Len",
  description,
  alternates: { canonical },
  openGraph: {
    title: "Len Sợi Đan Móc – Bảng Màu & Giá Len | Tiệm Len Nhà Tiny",
    description,
    url: canonical,
    images: ["/images/yarn_collection_800.jpg"]
  },
  robots: { index: true, follow: true }
};

export default async function YarnCategoryPage() {
  const products = await getAllYarnProducts();
  const catalogStartingPrice = getYarnCatalogStartingPrice(products);
  const catalogPriceCopy = catalogStartingPrice === null
    ? "Xem bảng màu & giá của từng dòng len tại Tiệm Len Nhà Tiny."
    : `Nhiều dòng len, bảng màu dễ đối chiếu. Giá từ ${formatYarnPrice(catalogStartingPrice)} cho sản phẩm đang có thể đặt.`;

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
          <h1>Len sợi đan móc – bảng màu, giá và các loại len đang bán</h1>
          <p>{catalogPriceCopy}</p>
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
      <section className="yc-help" aria-labelledby="yarn-guides-heading">
        <h2 id="yarn-guides-heading">Hướng dẫn chọn len</h2>
        <p>Đối chiếu thông số sợi và kim móc trước khi chọn mã màu.</p>
        <ul>
          <li><Link href="/blog/nguoi-moi-hoc-moc-len-nen-chon-loai-len-nao">Người mới học móc nên chọn loại len nào?</Link></li>
          <li><Link href="/blog/chon-kim-moc-bao-nhieu-cho-milk-bo-nhung-dua-nhung-gau-va-mac-den">Chọn kim móc cho các dòng len đang bán</Link></li>
          <li><Link href="/blog/huong-dan-dat-len-tren-website-tiem-len-nha-tiny">Hướng dẫn đặt len trên website</Link></li>
        </ul>
      </section>
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
