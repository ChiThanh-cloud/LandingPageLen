import Link from "next/link";
import type { RelatedPostLink } from "@/types/post";

export function BlogRelatedPosts({
  title,
  links
}: {
  title: string;
  links: RelatedPostLink[];
}) {
  return (
    <section className="blog-content-card blog-related">
      <h2>{title}</h2>
      <div className="blog-related-grid">
        {links.map((link) => (
          <Link className="blog-related-card" href={`/blog/${link.slug}`} key={link.slug}>
            <div className="blog-related-body">
              <h3 className="blog-related-title">{link.title}</h3>
              <p>{link.text}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
