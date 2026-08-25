import type { Metadata } from "next";
import Link from "next/link";
import { policies, type PolicyKey } from "@/data/policies";
import { siteConfig } from "@/data/site";
import styles from "./PolicyPage.module.css";

export function createPolicyMetadata(policyKey: PolicyKey): Metadata {
  const policy = policies[policyKey];
  const canonical = `${siteConfig.url}/${policy.slug}`;
  const title = `${policy.title} | ${siteConfig.name}`;

  return {
    title: { absolute: title },
    description: policy.description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description: policy.description,
      url: canonical,
      type: "article",
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      images: [{
        url: `${siteConfig.url}/images/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "Tiệm Len Nhà Tiny"
      }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: policy.description,
      images: [`${siteConfig.url}/images/og-image.jpg`]
    }
  };
}

export function PolicyPage({ policyKey }: { policyKey: PolicyKey }) {
  const policy = policies[policyKey];

  return (
    <main className={styles.page}>
      <article className={styles.article}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/">Trang chủ</Link>
          <span aria-hidden="true">›</span>
          <span>{policy.title}</span>
        </nav>

        <header className={styles.header}>
          <p className={styles.eyebrow}>Thông tin hỗ trợ</p>
          <h1>{policy.title}</h1>
          <p className={styles.lead}>{policy.description}</p>
        </header>

        {policy.intro ? (
          <div className={styles.intro}>
            {policy.intro.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
        ) : null}

        <div className={styles.sections}>
          {policy.sections.map((section) => (
            <section className={styles.section} key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </section>
          ))}
        </div>

        <aside className={styles.support} aria-label="Liên hệ hỗ trợ">
          <h2>Cần Tiny hỗ trợ thêm?</h2>
          <p>Hãy liên hệ Tiny để được kiểm tra thông tin đơn hàng hoặc trao đổi thêm.</p>
          <div className={styles.actions}>
            <Link href="/#lien-he-tu-van" className={styles.primaryAction}>Liên hệ Tiny</Link>
            <Link href="/" className={styles.secondaryAction}>Về trang chủ</Link>
          </div>
        </aside>
      </article>
    </main>
  );
}
