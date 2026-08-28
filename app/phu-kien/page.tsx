import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AccessoryCatalogJsonLd } from "@/components/commerce/AccessoryCatalogJsonLd";
import { CommerceCatalog } from "@/components/commerce/CommerceCatalog";
import { siteConfig } from "@/data/site";
import { getAllAccessoryProducts } from "@/lib/products/commerce-products";

const canonical = `${siteConfig.url}/phu-kien`;
const description = "Xem phụ kiện móc len tại Tiny gồm kim móc, bông gòn, mắt thú và dụng cụ đang bán; lọc theo giá và mở trang chi tiết để chọn đúng phiên bản.";

export const metadata: Metadata = {
  title: "Phụ kiện móc len – Kim móc, bông gòn & mắt thú",
  description,
  alternates: { canonical },
  openGraph: {
    title: "Phụ kiện móc len – Kim móc, bông gòn & mắt thú | Tiệm Len Nhà Tiny",
    description,
    url: canonical,
    images: ["/images/yarn_collection_800.jpg"]
  },
  robots: { index: true, follow: true }
};

export default async function AccessoryCatalogPage() {
  const products = await getAllAccessoryProducts();

  return (
    <main className="yc-page">
      <AccessoryCatalogJsonLd products={products} />
      <nav className="yc-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Trang chủ</Link>
        <span aria-hidden="true">›</span>
        <span aria-current="page">Phụ kiện</span>
      </nav>
      <section className="yc-hero">
        <div>
          <p className="yc-eyebrow">Phụ kiện móc len</p>
          <h1>Phụ kiện móc len – kim móc, bông gòn và dụng cụ</h1>
          <p>Xem các phụ kiện đang bán tại Tiny, so sánh mức giá và mở từng sản phẩm để chọn đúng phiên bản.</p>
        </div>
        <Image
          src="https://res.cloudinary.com/djn2kd2hh/image/upload/ChatGPT_Image_Aug_17_2026_01_16_34_PM_jrbtpk.png"
          alt="Phụ kiện và đồ móc len tại Tiệm Len Nhà Tiny"
          width={800}
          height={600}
          priority
        />
      </section>
      <CommerceCatalog products={products} scope="accessory" heading="Phụ kiện đang bán" />
      <section className="yc-help">
        <div>
          <h2>Chưa chắc nên chọn phụ kiện nào?</h2>
          <p>Đối chiếu mẫu đang móc, cỡ sợi và nhu cầu sử dụng trước khi chọn kim, bông hoặc phụ kiện hoàn thiện.</p>
        </div>
        <a href={siteConfig.zaloUrl} target="_blank" rel="noopener noreferrer">Nhắn Tiny tư vấn</a>
      </section>
    </main>
  );
}
