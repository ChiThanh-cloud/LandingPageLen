"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminIcon, type AdminIconName } from "./AdminIcon";
import styles from "./Admin.module.css";

const navigation: Array<{ href: string; label: string; icon: AdminIconName; exact?: boolean }> = [
  { href: "/admin", label: "Tổng quan", icon: "dashboard", exact: true },
  { href: "/admin/don-hang", label: "Đơn hàng", icon: "orders" },
  { href: "/admin/ton-kho", label: "Tồn kho", icon: "inventory" },
  { href: "/admin/san-pham", label: "Sản phẩm", icon: "products" }
];

export function AdminNavigation() {
  const pathname = usePathname();
  return (
    <nav className={styles.adminNav} aria-label="Điều hướng quản trị">
      {navigation.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link href={item.href} key={item.href} className={active ? styles.navLinkActive : styles.navLink} aria-current={active ? "page" : undefined}>
            <span className={styles.navIcon}><AdminIcon name={item.icon} /></span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
