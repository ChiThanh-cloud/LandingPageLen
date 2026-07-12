"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { BlogPost } from "@/types/post";

type BlogIndexProps = {
  posts: BlogPost[];
};

const filters = [
  { label: "Tất cả", value: "all" },
  { label: "Quà handmade", value: "qua-handmade" },
  { label: "Hướng dẫn", value: "huong-dan" },
  { label: "Người mới", value: "nguoi-moi" }
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function tagClass(tag: string) {
  if (tag === "huong-dan") return "blog-tag blog-tag-guide";
  if (tag === "nguoi-moi") return "blog-tag blog-tag-free";
  return "blog-tag";
}

function tagLabel(tag: string) {
  if (tag === "qua-handmade") return "Quà handmade";
  if (tag === "huong-dan") return "Hướng dẫn";
  if (tag === "nguoi-moi") return "Người mới";
  return tag;
}

export function BlogIndex({ posts }: BlogIndexProps) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredPosts = useMemo(() => {
    const normalizedQuery = normalize(query.trim());

    return posts.filter((post) => {
      const matchesFilter = activeFilter === "all" || post.tags.includes(activeFilter);
      const matchesSearch =
        normalizedQuery.length === 0 ||
        normalize(`${post.title} ${post.description} ${post.searchText}`).includes(normalizedQuery);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, posts, query]);

  return (
    <main className="blog-page blog-index-page">
      <div className="blog-shell">
        <section className="blog-hero">
          <p className="blog-eyebrow">Blog LenTiny</p>
          <h1 className="blog-title">Blog đồ len handmade và chart móc len</h1>
          <p className="blog-lead">
            Góc nhỏ chia sẻ cách chọn quà len handmade, kinh nghiệm móc len cho người mới và những mẹo giữ đồ len luôn xinh.
          </p>
        </section>

        <section className="blog-panel blog-controls" aria-label="Lọc bài viết blog">
          <label className="blog-field">
            Tìm bài viết
            <input
              className="blog-search"
              type="search"
              placeholder="Tìm theo quà len, chart móc, len cho người mới..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <div className="blog-filter-row" role="group" aria-label="Chủ đề bài viết">
            {filters.map((filter) => (
              <button
                key={filter.value}
                className={`blog-filter${activeFilter === filter.value ? " blog-active" : ""}`}
                type="button"
                aria-pressed={activeFilter === filter.value}
                onClick={() => setActiveFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </section>

        <section className="blog-grid" aria-label="Danh sách bài viết">
          {filteredPosts.map((post) => (
            <article className="blog-card" key={post.slug}>
              <Link
                className="blog-media"
                href={`/blog/${post.slug}`}
                data-fallback="Ảnh bài viết LenTiny"
                aria-label={post.h1}
              >
                <Image src={post.image} alt={post.imageAlt} width={800} height={1000} loading="lazy" />
              </Link>
              <div className="blog-card-body">
                <div className="blog-card-meta">
                  {post.category} - {formatDate(post.publishedAt)}
                </div>
                <h2 className="blog-card-title">
                  <Link href={`/blog/${post.slug}`}>{post.h1}</Link>
                </h2>
                <p className="blog-card-desc">{post.excerpt}</p>
                <div className="blog-card-tags" aria-label="Chủ đề">
                  {post.tags.map((tag) => (
                    <span className={tagClass(tag)} key={tag}>
                      {tagLabel(tag)}
                    </span>
                  ))}
                </div>
                <Link className="blog-button blog-button-soft" href={`/blog/${post.slug}`}>
                  Đọc bài viết
                </Link>
              </div>
            </article>
          ))}
        </section>

        <p className={`blog-empty${filteredPosts.length === 0 ? " blog-show" : ""}`}>
          Chưa tìm thấy bài viết phù hợp. Thử một từ khóa nhẹ hơn nhé.
        </p>
      </div>
    </main>
  );
}
