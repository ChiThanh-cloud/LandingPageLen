"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./CartProvider";
import styles from "./Cart.module.css";

export function CartHeaderLink() {
  const pathname = usePathname();
  const { hydrated, totalQuantity } = useCart();
  const isCartScope = pathname === "/gio-hang" || pathname === "/thanh-toan" || pathname.startsWith("/len-soi");

  if (!isCartScope) return null;

  const count = hydrated ? totalQuantity : 0;
  return (
    <Link
      href="/gio-hang"
      className={styles.cartHeaderLink}
      aria-label={`Giỏ hàng, ${count} sản phẩm`}
      aria-current={pathname === "/gio-hang" ? "page" : undefined}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 4h2l2.1 10.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L20 7H6" />
        <circle cx="9.5" cy="19.5" r="1" />
        <circle cx="17.5" cy="19.5" r="1" />
      </svg>
      <span className={styles.cartHeaderLabel}>Giỏ hàng</span>
      {count > 0 ? <span className={styles.cartBadge} aria-hidden="true">{count > 99 ? "99+" : count}</span> : null}
    </Link>
  );
}
