"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { CartHeaderLink } from "@/components/cart/CartHeaderLink";
import { trackSiteEvent } from "@/lib/siteTracking";

type NavItem = {
  href: string;
  label: string;
  styleIndex: number;
  className?: string;
  trackKey?: string;
};

const navItems: NavItem[] = [
  { href: "/len-soi-va-phu-kien", label: "Sản phẩm", styleIndex: 1 },
  { href: "/len-soi", label: "Len sợi", styleIndex: 2 },
  { href: "/#quy-trinh-dat-hang", label: "Đặt theo yêu cầu", styleIndex: 3 },
  { href: "/#khach-chia-se", label: "Khách hàng", styleIndex: 4 },
  { href: "/tra-cuu-don-hang", label: "Tra cứu đơn hàng", styleIndex: 5 },
  { href: "/blog", label: "Blog", styleIndex: 6 },
  {
    href: "/#lien-he-tu-van",
    label: "Nhắn Tiny",
    styleIndex: 7,
    className: "nav-cta",
    trackKey: "nav_order_click"
  }
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(true);
  const navRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    document.body.classList.toggle("menu-open", isOpen);
    if (isOpen) {
      menuRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    } else if (wasOpenRef.current) {
      toggleRef.current?.focus();
    }
    wasOpenRef.current = isOpen;

    return () => {
      document.body.classList.remove("menu-open");
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    const closeOnOutsidePress = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && !navRef.current?.contains(target)) setIsOpen(false);
    };

    const desktopQuery = window.matchMedia("(min-width: 769px)");
    const closeOnDesktop = () => desktopQuery.matches && setIsOpen(false);

    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOnOutsidePress);
    desktopQuery.addEventListener("change", closeOnDesktop);

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      desktopQuery.removeEventListener("change", closeOnDesktop);
    };
  }, [isOpen]);

  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero || !("IntersectionObserver" in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsScrolled(!entry.isIntersecting),
      { rootMargin: "-60px 0px 0px", threshold: 0 }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  const closeMenu = () => setIsOpen(false);

  return (
    <nav ref={navRef} className={`navbar${isScrolled ? " scrolled" : ""}`} id="navbar">
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
        <ul
          ref={menuRef}
          className={`nav-links${isOpen ? " open" : ""}`}
          id="navLinks"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeMenu();
          }}
        >
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
        <CartHeaderLink />
        <button
          ref={toggleRef}
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
