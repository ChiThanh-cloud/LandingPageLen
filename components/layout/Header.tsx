"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { trackSiteEvent } from "@/lib/siteTracking";

type NavItem = {
  href: string;
  label: string;
  styleIndex: number;
  className?: string;
  trackKey?: string;
};

const navItems: NavItem[] = [
  { href: "/#thong-tin-tiny", label: "Về Tiny", styleIndex: 1 },
  { href: "/#bo-suu-tap", label: "Bộ sưu tập", styleIndex: 2 },
  { href: "/#quy-trinh-dat-hang", label: "Cách đặt hàng", styleIndex: 3 },
  { href: "/#khach-chia-se", label: "Khách chia sẻ", styleIndex: 4 },
  { href: "/blog", label: "Blog", styleIndex: 5 },
  {
    href: "/#lien-he-tu-van",
    label: "Tư vấn ngay",
    styleIndex: 6,
    className: "nav-cta",
    trackKey: "nav_order_click"
  }
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(true);

  useEffect(() => {
    document.body.classList.toggle("menu-open", isOpen);
    return () => document.body.classList.remove("menu-open");
  }, [isOpen]);

  useEffect(() => {
    const updateScrolled = () => {
      const hasHero = Boolean(document.getElementById("hero"));
      setIsScrolled(!hasHero || window.scrollY > 60);
    };

    updateScrolled();
    window.addEventListener("scroll", updateScrolled, { passive: true });
    window.addEventListener("resize", updateScrolled);

    return () => {
      window.removeEventListener("scroll", updateScrolled);
      window.removeEventListener("resize", updateScrolled);
    };
  }, []);

  const closeMenu = () => setIsOpen(false);

  return (
    <nav className={`navbar${isScrolled ? " scrolled" : ""}`} id="navbar">
      <div className="nav-container">
        <Link href="/" className="nav-logo" aria-label="Về trang chủ Tiệm Len Nhà Tiny" onClick={closeMenu}>
          <Image
            src="/images/logo_160.png"
            alt="Logo Tiệm Len Nhà Tiny - shop len handmade tại TP.HCM"
            className="logo-img"
            width={160}
            height={160}
            priority
          />
        </Link>
        <ul className={`nav-links${isOpen ? " open" : ""}`} id="navLinks">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={item.className}
                style={{ "--i": item.styleIndex } as CSSProperties}
                data-track={item.trackKey}
                data-track-handled={item.trackKey ? "true" : undefined}
                onClick={() => {
                  closeMenu();
                  if (item.trackKey) {
                    trackSiteEvent(item.trackKey, {
                      label: item.label,
                      href: item.href
                    });
                  }
                }}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <button
          className={`hamburger${isOpen ? " active" : ""}`}
          id="hamburger"
          type="button"
          aria-label={isOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={isOpen}
          aria-controls="navLinks"
          onClick={() => setIsOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </nav>
  );
}
