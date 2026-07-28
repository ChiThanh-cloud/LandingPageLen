import { siteConfig } from "@/data/site";

type BlogCalloutProps = {
  kicker: string;
  title: string;
  text: string;
  ctaLabel: string;
};

export function BlogCallout({ kicker, title, text, ctaLabel }: BlogCalloutProps) {
  return (
    <section className="blog-product-callout">
      <p className="blog-callout-kicker">{kicker}</p>
      <h2>{title}</h2>
      <p>{text}</p>
      <a
        className="blog-button blog-button-primary"
        href={siteConfig.messengerUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        {ctaLabel}
      </a>
    </section>
  );
}
