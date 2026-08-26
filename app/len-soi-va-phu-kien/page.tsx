import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CommerceCatalog } from "@/components/commerce/CommerceCatalog";
import { siteConfig } from "@/data/site";
import { getAllSellableProducts } from "@/lib/products/commerce-products";

const canonical = `${siteConfig.url}/len-soi-va-phu-kien`;
const description = "Khám phá len sợi, kim móc, bông gòn và phụ kiện móc len tại Tiệm Len Nhà Tiny, với bộ lọc rõ ràng và trang chi tiết riêng cho từng sản phẩm.";

export const metadata: Metadata = {
  title: "Len sợi & phụ kiện móc len",
  description,
  alternates: { canonical },
  openGraph: {
    title: "Len sợi & phụ kiện móc len | Tiệm Len Nhà Tiny",
    description,
    url: canonical,
    images: ["/images/yarn_collection_800.jpg"]
  },
  robots: { index: true, follow: true }
};

export default async function CommerceCatalogPage() {
  const products = await getAllSellableProducts();

  return (
    <main className="yc-page">
      <nav className="yc-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Trang chủ</Link>
        <span aria-hidden="true">›</span>
        <span aria-current="page">Len sợi & phụ kiện</span>
      </nav>
      <section className="yc-hero">
        <div>
          <p className="yc-eyebrow">Cuộn len & Phụ kiện móc</p>
          <h1>Len sợi & phụ kiện móc len đang bán</h1>
          <p>Xem toàn bộ len sợi và phụ kiện trong cùng một catalog, rồi chuyển nhanh sang trang chuyên biệt khi cần.</p>
        </div>
        <Image
          src="https://res.cloudinary.com/djn2kd2hh/image/upload/ChatGPT_Image_Aug_17_2026_01_16_34_PM_jrbtpk.png"
          alt="Len sợi và phụ kiện móc len tại Tiệm Len Nhà Tiny"
          width={800}
          height={600}
          priority
        />
      </section>
      <CommerceCatalog products={products} scope="all" heading="Tất cả sản phẩm" />
      <section className="yc-help">
        <div>
          <h2>Muốn chọn nhanh theo nhu cầu?</h2>
          <p>Vào trang Len sợi hoặc Phụ kiện để xem nội dung chuyên sâu và bộ lọc đúng từng nhóm.</p>
        </div>
        <Link href="/len-soi">Xem riêng len sợi</Link>
      </section>
    </main>
  );
}
