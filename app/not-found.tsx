import type { Metadata } from "next";
import Link from "next/link";
import styles from "./not-found.module.css";

export const metadata: Metadata = {
  title: "Không tìm thấy trang",
  robots: { index: false, follow: false }
};

export default function NotFound() {
  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="not-found-title">
        <p className={styles.code}>404</p>
        <h1 id="not-found-title">Trang này không còn ở đây</h1>
        <p className={styles.description}>
          Có thể đường dẫn đã thay đổi hoặc bạn vừa đi lạc một chút. Mình cùng quay lại góc len của Tiny nhé.
        </p>
        <div className={styles.actions}>
          <Link href="/" className={styles.primaryAction}>Trang chủ</Link>
          <Link href="/len-soi" className={styles.secondaryAction}>Xem len sợi</Link>
          <Link href="/blog" className={styles.textAction}>Blog</Link>
        </div>
      </section>
    </main>
  );
}
