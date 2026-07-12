import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/data/site";
import type { ProductEntry } from "@/types/product";
import { ProductJsonLd } from "./ProductJsonLd";
import { ProductSections } from "./ProductSections";

export function ProductDetailPage({ product }: { product: ProductEntry }) {
  return (
    <main className="blog-page product-page">
      <ProductJsonLd product={product} />
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
            {product.kind === "service"
              ? "Sẵn sàng đặt một bé thú len theo ý muốn?"
              : "Muốn Tiny tư vấn mẫu phù hợp cho bạn?"}
          </h2>
          <p className="blog-text">
            Nhắn Tiny qua Zalo để được tư vấn mẫu, màu sắc, ngân sách và thời gian hoàn thiện phù hợp nhất.
          </p>
          <div className="blog-cta-actions">
            <a
              className="sp-zalo-btn"
              href={siteConfig.zaloUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-track="contact_zalo_click"
            >
              Nhắn Zalo {siteConfig.phoneDisplay}
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
