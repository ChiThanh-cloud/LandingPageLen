import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { siteConfig } from "@/data/site";
import type { BlogPostMeta } from "@/types/post";
import { BlogReadingProgress } from "./BlogReadingProgress";
import { PostJsonLd } from "./PostJsonLd";

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function BlogPostPage({
  post,
  children
}: {
  post: BlogPostMeta;
  children: ReactNode;
}) {
  return (
    <main className="blog-page blog-article-page">
      <PostJsonLd post={post} />
      <BlogReadingProgress />
      <article className="blog-shell blog-post-layout">
        <section className="blog-post-hero">
          <nav className="blog-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Trang chủ</Link>
            <span>&gt;</span>
            <Link href="/blog">Blog</Link>
            <span>&gt;</span>
            <span>{post.breadcrumbLabel}</span>
          </nav>
          <p className="blog-eyebrow">{post.eyebrow}</p>
          <h1 className="blog-post-title">{post.h1}</h1>
          <p className="blog-post-lead">{post.lead}</p>
          {post.heroCta ? (
            <div className="blog-cta-actions" aria-label="Chọn quà tốt nghiệp">
              <a
                className="blog-button blog-button-primary"
                href={siteConfig.messengerUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {post.heroCta.primaryLabel}
              </a>
              <Link className="blog-button blog-button-soft" href={post.heroCta.secondaryHref}>
                {post.heroCta.secondaryLabel}
              </Link>
            </div>
          ) : null}
          <div className="blog-info-grid" aria-label="Thông tin bài viết">
            <div className="blog-info-item">
              <span className="blog-info-label">Ngày đăng</span>
              <span className="blog-info-value">{formatDate(post.publishedAt)}</span>
            </div>
            <div className="blog-info-item">
              <span className="blog-info-label">Cập nhật</span>
              <span className="blog-info-value">{formatDate(post.updatedAt)}</span>
            </div>
            <div className="blog-info-item">
              <span className="blog-info-label">Chủ đề</span>
              <span className="blog-info-value">{post.category}</span>
            </div>
            <div className="blog-info-item">
              <span className="blog-info-label">Tác giả</span>
              <span className="blog-info-value">{post.author}</span>
            </div>
          </div>
        </section>

        <div className="blog-media blog-post-media">
          <Image
            src={post.image}
            alt={post.imageAlt}
            width={1200}
            height={900}
            sizes="(max-width: 920px) 100vw, 800px"
            priority
          />
        </div>

        {children}

        <section className="blog-cta">
          <h2>{post.heroCta ? "Đã hình dung món quà bạn muốn dành tặng?" : "Cần Tiny tư vấn thêm về đồ len handmade?"}</h2>
          <p className="blog-text">
            {post.heroCta
              ? "Kể Tiny nghe ngày bạn muốn trao quà, khoảng giá cảm thấy phù hợp và phong cách người nhận. Tiny sẽ kiểm tra lịch, gợi ý mẫu và báo giá trước khi bạn quyết định."
              : "Nhắn Tiny qua Messenger hoặc Zalo để được gợi ý mẫu len, set tự móc hoặc món quà handmade phù hợp."}
          </p>
          <div className="blog-cta-actions">
            <a
              className="blog-button blog-button-primary"
              href={siteConfig.messengerUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {post.heroCta?.primaryLabel ?? "Nhắn Tiny"}
            </a>
            <a className="blog-button blog-button-soft" href={siteConfig.zaloUrl} target="_blank" rel="noopener noreferrer">
              Zalo {siteConfig.phoneDisplay}
            </a>
            <Link className="blog-button blog-button-soft" href="/blog">
              Về blog
            </Link>
          </div>
        </section>
      </article>
    </main>
  );
}
