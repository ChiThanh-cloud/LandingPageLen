import Link from "next/link";
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
  return (
    <section className={styles.info}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Trang chủ</Link><span>/</span><Link href="/len-soi">Len sợi</Link><span>/</span><span>{product.shortName}</span>
      </nav>
      <p className={styles.category}>Len sợi và nguyên liệu móc</p>
      <h1 className={styles.title}>{product.name}</h1>
      <dl className={styles.metadata}>
        <div><dt>Thương hiệu</dt><dd>Đang cập nhật</dd></div>
        <div><dt>Loại sản phẩm</dt><dd>Len sợi</dd></div>
      </dl>
      <p className={styles.pricePanel}>{displayedPrice.toLocaleString("vi-VN")}đ <small>/ cuộn</small></p>
      {children}
    </section>
  );
}
