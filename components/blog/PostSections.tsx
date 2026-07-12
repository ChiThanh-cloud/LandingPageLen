import Link from "next/link";
import { siteConfig } from "@/data/site";
import Image from "next/image";
import type { BlogPost, PostSection, RichText } from "@/types/post";

function renderRichText(content: RichText) {
  return content.map((part, index) => {
    if (typeof part === "string") {
      return part;
    }

    const isInternal = part.href.startsWith("/");

    if (isInternal) {
      return (
        <Link href={part.href} key={`${part.href}-${index}`}>
          {part.text}
        </Link>
      );
    }

    return (
      <a href={part.href} key={`${part.href}-${index}`} target="_blank" rel="noopener noreferrer">
        {part.text}
      </a>
    );
  });
}

function Section({ section }: { section: PostSection }) {
  if (section.type === "paragraphs") {
    return (
      <section className="blog-content-card">
        {section.title ? <h2>{section.title}</h2> : null}
        {section.paragraphs.map((paragraph, index) => (
          <p key={index}>{renderRichText(paragraph)}</p>
        ))}
      </section>
    );
  }

  if (section.type === "subsections") {
    return (
      <section className="blog-content-card">
        <h2>{section.title}</h2>
        {section.subsections.map((subsection) => (
          <div key={subsection.title}>
            <h3>{subsection.title}</h3>
            {subsection.paragraphs.map((paragraph, index) => (
              <p key={index}>{renderRichText(paragraph)}</p>
            ))}
          </div>
        ))}
      </section>
    );
  }

  if (section.type === "list") {
    return (
      <section className="blog-content-card">
        <h2>{section.title}</h2>
        {section.intro ? <p>{renderRichText(section.intro)}</p> : null}
        <ul className="blog-list">
          {section.items.map((item) => (
            <li key={`${item.label || ""}-${item.text}`}>
              {item.label ? <strong>{item.label}: </strong> : null}
              {item.text}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (section.type === "callout") {
    return (
      <section className="blog-product-callout">
        <p className="blog-callout-kicker">{section.kicker}</p>
        <h2>{section.title}</h2>
        <p>{section.text}</p>
        <a className="blog-button blog-button-primary" href={siteConfig.messengerUrl} target="_blank" rel="noopener noreferrer">
          {section.ctaLabel}
        </a>
      </section>
    );
  }

  if (section.type === "image") {
    return (
      <figure className="blog-content-card blog-image-section" style={{ margin: "2rem 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ position: "relative", width: "100%", maxWidth: "800px", aspectRatio: "4/3", borderRadius: "12px", overflow: "hidden" }}>
          <Image src={section.src} alt={section.alt} fill style={{ objectFit: "cover" }} sizes="(max-width: 768px) 100vw, 800px" />
        </div>
        {section.caption ? <figcaption style={{ marginTop: "0.75rem", fontSize: "0.9rem", color: "var(--color-text-light)", fontStyle: "italic", textAlign: "center" }}>{section.caption}</figcaption> : null}
      </figure>
    );
  }

  return (
    <section className="blog-content-card blog-related">
      <h2>{section.title}</h2>
      <div className="blog-related-grid">
        {section.links.map((link) => (
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

export function PostSections({ post }: { post: BlogPost }) {
  return (
    <>
      {post.sections.map((section, index) => (
        <Section section={section} key={`${section.type}-${"title" in section ? section.title : index}`} />
      ))}
    </>
  );
}
