import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/data/site";
import type { BlogPost } from "@/types/post";
import { BlogReadingProgress } from "./BlogReadingProgress";
import { PostJsonLd } from "./PostJsonLd";
import { PostSections } from "./PostSections";

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function BlogPostPage({ post }: { post: BlogPost }) {
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
          <Image src={post.image} alt={post.imageAlt} width={800} height={1000} priority style={{ width: "100%", height: "auto" }} />
        </div>

        <PostSections post={post} />

        <section className="blog-cta">
          <h2>Cần Tiny tư vấn thêm về đồ len handmade?</h2>
          <p className="blog-text">
            Nhắn Tiny qua Messenger hoặc Zalo để được gợi ý mẫu len, set tự móc hoặc món quà handmade phù hợp.
          </p>
          <div className="blog-cta-actions">
            <a
              className="blog-button blog-button-primary"
              href={siteConfig.messengerUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Nhắn Tiny
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
