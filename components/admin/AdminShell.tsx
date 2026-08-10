import Link from "next/link";
import { signOutAdmin, type VerifiedAdmin } from "@/lib/admin/auth";
import { AdminIcon } from "./AdminIcon";
import { AdminNavigation } from "./AdminNavigation";
import styles from "./Admin.module.css";

export function AdminShell({
  admin,
  children
}: {
  admin: VerifiedAdmin;
  children: React.ReactNode;
}) {
  const initial = admin.email.slice(0, 1).toLocaleUpperCase("vi");
  const today = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date());

  return (
    <div className={styles.adminRoot}>
      <a className={styles.skipLink} href="#admin-content">Đi đến nội dung chính</a>
      <aside className={styles.sidebar}>
        <Link href="/admin" className={styles.adminBrand} aria-label="Tiny Admin — Tổng quan">
          <span className={styles.brandMark}>T</span>
          <span><strong>Tiny Admin</strong><small>Quản lý cửa hàng</small></span>
        </Link>
        <div className={styles.navGroup}>
          <span className={styles.navLabel}>Không gian làm việc</span>
          <AdminNavigation />
        </div>
        <div className={styles.adminIdentity}>
          <span className={styles.userAvatar}>{initial}</span>
          <span className={styles.userCopy}><strong>Quản trị viên</strong><small>{admin.email}</small></span>
          <form action={signOutAdmin}><button type="submit" aria-label="Đăng xuất"><AdminIcon name="logout" /><span>Đăng xuất</span></button></form>
        </div>
      </aside>
      <div className={styles.adminMain}>
        <header className={styles.topBar}>
          <div className={styles.topBarDate}><AdminIcon name="calendar" /><span><small>Hôm nay</small><strong>{today}</strong></span></div>
          <Link href="/" target="_blank" className={styles.storefrontLink}>Xem cửa hàng <AdminIcon name="external" /></Link>
        </header>
        <main id="admin-content" className={styles.adminContent} tabIndex={-1}>{children}</main>
      </div>
    </div>
  );
}
