import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/data/site";
import type { ProductEntry } from "@/types/product";
import { ProductJsonLd } from "./ProductJsonLd";
import { ProductSections } from "./ProductSections";

export function CategoryLandingPage({
  product,
  canonicalPath,
  categoryLabel,
  breadcrumbLabel,
}: {
  product: ProductEntry;
  canonicalPath?: string;
  /** Badge / nhãn hiển thị trên hero */
  categoryLabel?: string;
  /** Tên breadcrumb item cuối (mặc định = product.name) */
  breadcrumbLabel?: string;
}) {
  return (
    <main className="cat-page">
      <ProductJsonLd product={product} path={canonicalPath} />

      {/* ── HERO ── */}
      <header className="cat-hero">
        <div className="cat-hero-content">
          <nav className="cat-breadcrumb" aria-label="Breadcrumb">
            <ol>
              <li><Link href="/">Trang chủ</Link></li>
              <li aria-current="page">{breadcrumbLabel ?? product.name}</li>
            </ol>
          </nav>

          {categoryLabel && (
            <span className="cat-eyebrow">{categoryLabel}</span>
          )}

          <h1 className="cat-hero-title">{product.h1}</h1>
          <p className="cat-hero-lead">{product.lead}</p>

          <div className="cat-hero-ctas">
            <a
              className="cat-btn-primary"
              href={siteConfig.zaloUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-track="contact_zalo_click"
            >
              Nhắn Zalo tư vấn
            </a>
            <a
              className="cat-btn-secondary"
              href={siteConfig.messengerUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-track="contact_messenger_click"
            >
              Messenger
            </a>
          </div>
        </div>

        <figure className="cat-hero-image">
          <Image
            src={product.image}
            alt={product.imageAlt}
            width={800}
            height={640}
            priority
            sizes="(max-width: 767px) 100vw, 50vw"
          />
        </figure>
      </header>

      {/* ── CONTENT SECTIONS ── */}
      <div className="cat-body">
        <div className="cat-sections">
          <ProductSections product={product} />
        </div>
      </div>

      {/* ── FINAL CTA ── */}
      <section className="cat-cta-section" aria-label="Liên hệ đặt hàng">
        <div className="cat-cta-inner">
          <h2>
            {product.kind === "service"
              ? "Sẵn sàng đặt hàng?"
              : "Muốn Tiny tư vấn thêm?"}
          </h2>
          <p>
            Nhắn Tiny qua Zalo để được tư vấn mẫu, màu sắc, ngân sách và thời
            gian hoàn thiện phù hợp nhất.
          </p>
          <div className="cat-cta-actions">
            <a
              className="cat-btn-primary"
              href={siteConfig.zaloUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-track="contact_zalo_cta_click"
            >
              Nhắn Zalo {siteConfig.phoneDisplay}
            </a>
            <Link className="cat-btn-ghost" href="/">
              Về trang chủ
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
