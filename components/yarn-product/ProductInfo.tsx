import Link from "next/link";
import { getYarnProductHeading } from "@/lib/products/yarn-product-seo";
import { getCommerceStatusLabel } from "@/lib/products/commerce-catalog";
import type { YarnProduct } from "@/types/yarn-product";
import styles from "./YarnProductDetail.module.css";

export function ProductInfo({
  product,
  selectedPrice,
  children
}: {
  product: YarnProduct;
  selectedPrice?: number | null;
  children: React.ReactNode;
}) {
  const displayedPrice = selectedPrice ?? product.price;
  const statusLabel = getCommerceStatusLabel(product.status);
  return (
    <section className={styles.info}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Trang chủ</Link><span>/</span><Link href="/len-soi">Len sợi</Link><span>/</span><span>{product.shortName}</span>
      </nav>
      <p className={styles.category}>Len sợi và nguyên liệu móc</p>
      <h1 className={styles.title}>{getYarnProductHeading(product)}</h1>
      {statusLabel ? <p className={styles.productStatus}>{statusLabel}</p> : null}
      <p className={styles.pricePanel}>{displayedPrice.toLocaleString("vi-VN")}đ <small>/ cuộn</small></p>
      {children}
    </section>
  );
}
