import type { Metadata } from "next";
import Link from "next/link";
import { CommerceCatalog } from "@/components/commerce/CommerceCatalog";
import { siteConfig } from "@/data/site";
import { getAllSellableProducts } from "@/lib/products/commerce-products";
import styles from "./CommerceCatalogPage.module.css";

const canonical = `${siteConfig.url}/len-soi-va-phu-kien`;
const description = "Khám phá len sợi, kim móc, bông gòn và các phụ kiện cần thiết cho việc móc len tại Tiệm Len Nhà Tiny.";

export const metadata: Metadata = {
  title: "Cuộn len & phụ kiện móc len",
  description,
  alternates: { canonical },
  openGraph: {
    title: "Cuộn len & phụ kiện móc len | Tiệm Len Nhà Tiny",
    description,
    url: canonical
  },
  robots: { index: true, follow: true }
};

export default async function CommerceCatalogPage() {
  const products = await getAllSellableProducts();

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/">Trang chủ</Link>
          <span aria-hidden="true">›</span>
          <span aria-current="page">Cuộn len & phụ kiện</span>
        </nav>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Cuộn len & Phụ kiện móc</p>
          <h1>Cuộn len & phụ kiện</h1>
          <p>Khám phá len sợi, kim móc, bông gòn và các phụ kiện cần thiết cho việc móc len.</p>
        </section>
      </div>
      <CommerceCatalog products={products} />
    </main>
  );
}
