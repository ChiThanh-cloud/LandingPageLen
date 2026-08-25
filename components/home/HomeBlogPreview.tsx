import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import type { BlogPostMeta } from "@/types/post";

type HomeBlogPreviewProps = {
  posts: readonly BlogPostMeta[];
};

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function HomeBlogPreview({ posts }: HomeBlogPreviewProps) {
  if (posts.length === 0) return null;

  return (
    <section className="home-blog section" id="blog-noi-bat">
      <div className="container">
        <h2 className="section-title center">Blog nổi bật từ <span className="highlight">LenTiny</span></h2>
        <p className="section-sub center">Một vài bài nhẹ nhàng giúp bạn chọn quà, chọn len và chăm món đồ handmade lâu đẹp hơn.</p>
        <div className="home-blog-grid">
          {posts.map((post) => {
            const href = `/blog/${post.slug}`;

            return (
              <article className="home-blog-card" key={href}>
                <Link className="home-blog-media" href={href} aria-label={post.h1}>
                  <Image src={post.image} alt={post.imageAlt || post.h1} width={800} height={600} sizes="(max-width: 768px) 100vw, 33vw" />
                </Link>
                <div className="home-blog-body">
                  <p className="home-blog-meta"><time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time></p>
                  <h3><Link href={href}>{post.h1}</Link></h3>
                  <p>{post.excerpt || post.description}</p>
                  <Link className="home-blog-link" href={href}>Đọc bài →</Link>
                </div>
              </article>
            );
          })}
        </div>
        <div className="home-blog-actions">
          <Link href="/blog" className="btn btn-primary">Xem tất cả bài viết</Link>
        </div>
      </div>
    </section>
  );
}
