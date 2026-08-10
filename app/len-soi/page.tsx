import type { Metadata } from "next";
import Image from "next/image";
import { YarnCatalog } from "@/components/yarn-product/YarnCatalog";
import { siteConfig } from "@/data/site";
import { getAllYarnProducts } from "@/lib/products/supabase-products";

export const metadata: Metadata = { title: "Len sợi, len Milk Cotton và len nhung", description: "Chọn len sợi theo chất liệu, trọng lượng và màu sắc. Xem tồn kho, giá lẻ và giá sỉ tại Tiệm Len Nhà Tiny.", alternates: { canonical: "/len-soi" }, openGraph: { title: "Len sợi và phụ kiện móc", description: "Bảng màu len sợi dành cho người mới và người móc lâu năm.", url: "/len-soi", images: ["/images/yarn_collection_800.jpg"] } };

export default async function YarnCategoryPage() {
  const products = await getAllYarnProducts();
  const jsonLd = { "@context": "https://schema.org", "@graph": [{ "@type": "CollectionPage", "@id": `${siteConfig.url}/len-soi`, name: "Len sợi và phụ kiện móc", description: "Danh mục len Milk Cotton, len nhung và cotton tại Tiệm Len Nhà Tiny." }, { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Trang chủ", item: siteConfig.url }, { "@type": "ListItem", position: 2, name: "Len sợi", item: `${siteConfig.url}/len-soi` }] }] };
  return <main className="yc-page"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} /><section className="yc-hero"><div><p className="yc-eyebrow">Len sợi và phụ kiện</p><h1>Chọn đúng sợi,<br />chọn màu bạn thích</h1><p>Mỗi dòng len có thông số, bảng màu, tồn kho và giá theo số lượng rõ ràng.</p></div><Image src="/images/yarn_hero_800.jpg" alt="Các cuộn len nhiều màu tại Tiệm Len Nhà Tiny" width={800} height={600} priority /></section><YarnCatalog products={products} /><section className="yc-help"><h2>Chưa chắc nên dùng loại nào?</h2><p>Gửi ảnh mẫu cho Tiny để được gợi ý loại sợi, cỡ kim và số cuộn phù hợp.</p><a href={siteConfig.zaloUrl} target="_blank" rel="noopener noreferrer">Nhắn Tiny tư vấn</a></section></main>;
}
