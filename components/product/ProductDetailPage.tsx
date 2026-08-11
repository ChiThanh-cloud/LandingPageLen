import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/data/site";
import type { ProductEntry } from "@/types/product";
import { ProductJsonLd } from "./ProductJsonLd";
import { ProductSections } from "./ProductSections";

export function ProductDetailPage({ product, canonicalPath }: { product: ProductEntry; canonicalPath?: string }) {
  const isYarnGuide = product.slug === "len-soi";

  return (
    <main className="blog-page product-page">
      <ProductJsonLd product={product} path={canonicalPath} />
      <article className="blog-shell blog-post-layout">
        <section className="blog-post-hero">
          <nav className="blog-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Trang chủ</Link>
            <span>&gt;</span>
            <span>{product.name}</span>
          </nav>
          <p className="blog-eyebrow">{product.eyebrow}</p>
          <h1 className="blog-post-title">{product.h1}</h1>
          <p className="blog-post-lead">{product.lead}</p>
        </section>

        <div className="blog-media blog-post-media">
          <Image src={product.image} alt={product.imageAlt} width={800} height={600} priority />
        </div>

        <ProductSections product={product} />

        <section className="blog-cta">
          <h2>
            {isYarnGuide
              ? "Sẵn sàng chọn len cho dự án của bạn?"
              : product.kind === "service"
              ? "Sẵn sàng đặt một bé thú len theo ý muốn?"
              : "Muốn Tiny tư vấn mẫu phù hợp cho bạn?"}
          </h2>
          <p className="blog-text">
            {isYarnGuide
              ? "Xem catalog hiện tại để kiểm tra sản phẩm, giá, màu và tình trạng trước khi chọn."
              : "Nhắn Tiny qua Zalo để được tư vấn mẫu, màu sắc, ngân sách và thời gian hoàn thiện phù hợp nhất."}
          </p>
          <div className="blog-cta-actions">
            {isYarnGuide ? (
              <Link className="sp-zalo-btn" href="/len-soi">
                Xem len đang bán
              </Link>
            ) : null}
            <a
              className={isYarnGuide ? "blog-button blog-button-soft" : "sp-zalo-btn"}
              href={siteConfig.zaloUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-track="contact_zalo_click"
            >
              {isYarnGuide ? "Nhắn Tiny để được tư vấn" : `Nhắn Zalo ${siteConfig.phoneDisplay}`}
            </a>
            <Link className="blog-button blog-button-soft" href="/">
              Về trang chủ
            </Link>
          </div>
        </section>
      </article>
    </main>
  );
}
