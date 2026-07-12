import Link from "next/link";
import { siteConfig } from "@/data/site";
import type { ProductEntry, ProductSection } from "@/types/product";

function ProductList({ section }: { section: Extract<ProductSection, { type: "list" }> }) {
  return (
    <section className="blog-content-card">
      <h2>{section.title}</h2>
      {section.intro ? <p>{section.intro}</p> : null}
      <ul className="blog-list">
        {section.items.map((item) => (
          <li key={`${item.label || ""}${item.text}`}>
            {item.label ? <strong>{item.label}: </strong> : null}
            {item.text}
          </li>
        ))}
      </ul>
      {section.outro ? <p>{section.outro}</p> : null}
    </section>
  );
}

function ProductText({ section }: { section: Extract<ProductSection, { type: "text" }> }) {
  return (
    <section className="blog-content-card">
      <h2>{section.title}</h2>
      {section.paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </section>
  );
}

function PriceTable({ section }: { section: Extract<ProductSection, { type: "priceTable" }> }) {
  return (
    <section className="blog-content-card">
      <h2>{section.title}</h2>
      {section.intro ? <p>{section.intro}</p> : null}
      <table className="sp-price-table">
        <thead>
          <tr>
            {section.table.headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {section.table.rows.map((row) => (
            <tr key={row.join("-")}>
              {row.map((cell) => (
                <td key={cell}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {section.outro ? <p>{section.outro}</p> : null}
    </section>
  );
}

function ProductSteps({ section }: { section: Extract<ProductSection, { type: "steps" }> }) {
  return (
    <section className="blog-content-card">
      <h2>{section.title}</h2>
      <div className="sp-steps">
        {section.steps.map((step, index) => (
          <div className="sp-step" key={step.title}>
            <div className="sp-step-num">{index + 1}</div>
            <div className="sp-step-body">
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function OccasionGrid({ section }: { section: Extract<ProductSection, { type: "occasionGrid" }> }) {
  return (
    <section className="blog-content-card">
      <h2>{section.title}</h2>
      <div className="sp-occasion-grid">
        {section.items.map((item) => (
          <div className="sp-occasion-item" key={item.label}>
            <span className="sp-occasion-icon" aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
          </div>
        ))}
      </div>
      {section.outro ? <p>{section.outro}</p> : null}
    </section>
  );
}

function ProductCallout({ section }: { section: Extract<ProductSection, { type: "callout" }> }) {
  return (
    <aside className="blog-product-callout">
      <p className="blog-callout-kicker">{section.kicker}</p>
      <h2>{section.title}</h2>
      <p>{section.text}</p>
      <a
        className="sp-zalo-btn"
        href={siteConfig.zaloUrl}
        target="_blank"
        rel="noopener noreferrer"
        data-track={section.ctaTrackKey}
      >
        {section.ctaLabel}
      </a>
    </aside>
  );
}

function RelatedLinks({ section }: { section: Extract<ProductSection, { type: "related" }> }) {
  return (
    <section className="blog-content-card">
      <h2>{section.title}</h2>
      <div className="blog-related-grid">
        {section.links.map((link) => (
          <Link className="blog-related-card" href={link.href} key={link.href}>
            <div className="blog-related-body">
              <h3>{link.title}</h3>
              <p>{link.text}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ProductFaq({ product }: { product: ProductEntry }) {
  return (
    <section className="blog-content-card">
      <h2>Câu hỏi thường gặp về {product.name.toLowerCase()}</h2>
      {product.faq.map((item) => (
        <details className="sp-faq-item" key={item.question}>
          <summary>{item.question}</summary>
          <p>{item.answer}</p>
        </details>
      ))}
    </section>
  );
}

export function ProductSections({ product }: { product: ProductEntry }) {
  return (
    <>
      {product.sections.map((section) => {
        switch (section.type) {
          case "text":
            return <ProductText key={section.title} section={section} />;
          case "list":
            return <ProductList key={section.title} section={section} />;
          case "priceTable":
            return <PriceTable key={section.title} section={section} />;
          case "steps":
            return <ProductSteps key={section.title} section={section} />;
          case "occasionGrid":
            return <OccasionGrid key={section.title} section={section} />;
          case "callout":
            return <ProductCallout key={section.title} section={section} />;
          case "related":
            return <RelatedLinks key={section.title} section={section} />;
          default:
            return null;
        }
      })}
      <ProductFaq product={product} />
    </>
  );
}
