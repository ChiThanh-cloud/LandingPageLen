"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { CartHeaderLink } from "@/components/cart/CartHeaderLink";
import { trackSiteEvent } from "@/lib/siteTracking";

type NavItem = {
  href: string;
  label: string;
  styleIndex: number;
  className?: string;
  trackKey?: string;
};

const productNavItems = [
  { href: "/len-soi-va-phu-kien", label: "Tất cả sản phẩm" },
  { href: "/len-soi", label: "Len sợi" },
  { href: "/phu-kien", label: "Phụ kiện" }
] as const;

const navItems: NavItem[] = [
  { href: "/#quy-trinh-dat-hang", label: "Đặt theo yêu cầu", styleIndex: 2 },
  { href: "/#khach-chia-se", label: "Khách hàng", styleIndex: 3 },
  { href: "/tra-cuu-don-hang", label: "Tra cứu đơn hàng", styleIndex: 4 },
  { href: "/blog", label: "Blog", styleIndex: 5 },
  {
    href: "/#lien-he-tu-van",
    label: "Nhắn Tiny",
    styleIndex: 6,
    className: "nav-cta",
    trackKey: "nav_order_click"
  }
];

export function Header() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isProductMenuOpen, setIsProductMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(true);
  const navRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const productMenuPanelRef = useRef<HTMLUListElement>(null);
  const productMenuToggleRef = useRef<HTMLButtonElement>(null);
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
    if (!isOpen && !isProductMenuOpen) return;

    const desktopQuery = window.matchMedia("(min-width: 769px)");

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        const shouldRestoreProductMenuFocus = desktopQuery.matches
          && isProductMenuOpen
          && Boolean(productMenuPanelRef.current?.contains(document.activeElement));

        if (shouldRestoreProductMenuFocus) productMenuToggleRef.current?.focus();

        setIsOpen(false);
        setIsProductMenuOpen(false);
      }
    };

    const closeOnOutsidePress = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && !navRef.current?.contains(target)) {
        setIsOpen(false);
        setIsProductMenuOpen(false);
      }
    };

    const closeOnDesktop = () => {
      if (desktopQuery.matches) {
        setIsOpen(false);
        setIsProductMenuOpen(false);
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOnOutsidePress);
    desktopQuery.addEventListener("change", closeOnDesktop);

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      desktopQuery.removeEventListener("change", closeOnDesktop);
    };
  }, [isOpen, isProductMenuOpen]);

  useEffect(() => {
    const isHomePage = window.location.pathname === "/";

    const updateScrolledState = () => {
      const nextIsScrolled = !isHomePage || window.scrollY > 12;
      setIsScrolled((current) => current === nextIsScrolled ? current : nextIsScrolled);
    };

    updateScrolledState();
    window.addEventListener("scroll", updateScrolledState, { passive: true });
    return () => window.removeEventListener("scroll", updateScrolledState);
  }, []);

  const isYarnRoute = pathname === "/len-soi" || pathname.startsWith("/len-soi/");
  const isAccessoryRoute = pathname === "/phu-kien" || pathname.startsWith("/phu-kien/");
  const isProductCatalogRoute = pathname === "/len-soi-va-phu-kien";
  const isProductMenuActive = isProductCatalogRoute || isYarnRoute || isAccessoryRoute;
  const isDesktopNavigation = () => window.matchMedia("(min-width: 769px)").matches;
  const isMobileNavigation = () => window.matchMedia("(max-width: 768px)").matches;

  const closeNavigation = () => {
    setIsOpen(false);
    setIsProductMenuOpen(false);
  };

  return (
    <nav ref={navRef} className={`navbar${isScrolled ? " scrolled" : ""}`} id="navbar">
      <div className="nav-container">
        <Link href="/" className="nav-logo" aria-label="Về trang chủ Tiệm Len Nhà Tiny" onClick={closeNavigation}>
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
            if (event.target === event.currentTarget) closeNavigation();
          }}
        >
          <li
            className={`nav-product-menu${isProductMenuOpen ? " is-open" : ""}`}
            onMouseEnter={() => {
              if (isDesktopNavigation()) setIsProductMenuOpen(true);
            }}
            onMouseLeave={(event) => {
              if (isDesktopNavigation() && !event.currentTarget.matches(":focus-within")) {
                setIsProductMenuOpen(false);
              }
            }}
            onFocus={() => {
              if (isDesktopNavigation()) setIsProductMenuOpen(true);
            }}
            onBlur={(event) => {
              if (isDesktopNavigation() && !event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setIsProductMenuOpen(false);
              }
            }}
          >
            <div className="nav-product-menu__trigger">
              <Link
                href="/len-soi-va-phu-kien"
                className={`nav-product-menu__primary${isProductMenuActive ? " active-nav" : ""}`}
                style={{ "--i": 1 } as CSSProperties}
                aria-current={isProductCatalogRoute ? "page" : undefined}
                onClick={(event) => {
                  if (isMobileNavigation()) {
                    event.preventDefault();
                    setIsProductMenuOpen((current) => !current);
                    return;
                  }
                  closeNavigation();
                }}
              >
                Sản phẩm
              </Link>
              <button
                ref={productMenuToggleRef}
                className="nav-product-menu__toggle"
                type="button"
                aria-label={isProductMenuOpen ? "Đóng danh mục Sản phẩm" : "Mở danh mục Sản phẩm"}
                aria-expanded={isProductMenuOpen}
                aria-controls="productNavMenu"
                onClick={() => {
                  if (isMobileNavigation()) {
                    setIsProductMenuOpen((current) => !current);
                    return;
                  }
                  setIsProductMenuOpen(true);
                }}
              />
            </div>
            <ul ref={productMenuPanelRef} className="nav-product-menu__panel" id="productNavMenu" aria-label="Danh mục sản phẩm">
              {productNavItems.map((item) => {
                const isActive = item.href === "/len-soi"
                  ? isYarnRoute
                  : item.href === "/phu-kien"
                    ? isAccessoryRoute
                    : isProductCatalogRoute;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={isActive ? "active-nav" : undefined}
                      aria-current={pathname === item.href ? "page" : undefined}
                      onClick={closeNavigation}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={item.className}
                style={{ "--i": item.styleIndex } as CSSProperties}
                data-track={item.trackKey}
                data-track-handled={item.trackKey ? "true" : undefined}
                onClick={() => {
                  closeNavigation();
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
          onClick={() => {
            if (isOpen) {
              closeNavigation();
              return;
            }
            setIsOpen(true);
          }}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </nav>
  );
}
