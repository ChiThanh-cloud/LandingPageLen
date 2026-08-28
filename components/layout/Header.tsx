"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { CartHeaderLink } from "@/components/cart/CartHeaderLink";
import { siteConfig } from "@/data/site";
import { trackSiteEvent } from "@/lib/siteTracking";
import styles from "./Header.module.css";

type NavItem = {
  href: string;
  label: string;
  styleIndex: number;
  description?: string;
  className?: string;
  trackKey?: string;
};

const productNavItems = [
  { href: "/len-soi-va-phu-kien", label: "Tất cả sản phẩm" },
  { href: "/len-soi", label: "Len sợi" },
  { href: "/phu-kien", label: "Phụ kiện" }
] as const;

const navItems: NavItem[] = [
  { href: "/do-moc-theo-yeu-cau", label: "Đặt theo yêu cầu", description: "Gửi mẫu để Tiny tư vấn", styleIndex: 2 },
  { href: "/#khach-chia-se", label: "Khách hàng", description: "Lời nhắn từ khách nhà Tiny", styleIndex: 3 },
  { href: "/tra-cuu-don-hang", label: "Tra cứu đơn hàng", description: "Kiểm tra trạng thái đơn", styleIndex: 4 },
  { href: "/blog", label: "Blog", description: "Mẹo chọn len và quà handmade", styleIndex: 5 },
  {
    href: "/#lien-he-tu-van",
    label: "Nhắn Tiny",
    styleIndex: 6,
    className: "nav-cta",
    trackKey: "nav_order_click"
  }
];

function isPathActive(pathname: string, href: string) {
  if (href.startsWith("/#")) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileProductMenuOpen, setIsMobileProductMenuOpen] = useState(false);
  const [isDesktopProductMenuOpen, setIsDesktopProductMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(!isHomePage);
  const navRef = useRef<HTMLElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const desktopProductMenuPanelRef = useRef<HTMLUListElement>(null);
  const desktopProductMenuToggleRef = useRef<HTMLButtonElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const wasMobileMenuOpenRef = useRef(false);
  const shouldRestoreToggleFocusRef = useRef(false);
  const previousPathnameRef = useRef(pathname);

  const isYarnRoute = pathname === "/len-soi" || pathname.startsWith("/len-soi/");
  const isAccessoryRoute = pathname === "/phu-kien" || pathname.startsWith("/phu-kien/");
  const isProductCatalogRoute = pathname === "/len-soi-va-phu-kien";
  const isProductMenuActive = isProductCatalogRoute || isYarnRoute || isAccessoryRoute;
  const isDesktopNavigation = () => window.matchMedia("(min-width: 769px)").matches;

  const closeMobileNavigation = useCallback((restoreToggleFocus = false) => {
    shouldRestoreToggleFocusRef.current = restoreToggleFocus;
    setIsMobileMenuOpen(false);
    setIsMobileProductMenuOpen(false);
  }, []);

  const closeAllNavigation = useCallback((restoreToggleFocus = false) => {
    closeMobileNavigation(restoreToggleFocus);
    setIsDesktopProductMenuOpen(false);
  }, [closeMobileNavigation]);

  useEffect(() => {
    document.body.classList.toggle("menu-open", isMobileMenuOpen);
    let focusFrame = 0;

    if (isMobileMenuOpen) {
      focusFrame = window.requestAnimationFrame(() => {
        mobileMenuRef.current
          ?.querySelector<HTMLElement>("[data-mobile-menu-initial]")
          ?.focus({ preventScroll: true });
      });
    } else if (wasMobileMenuOpenRef.current && shouldRestoreToggleFocusRef.current) {
      toggleRef.current?.focus({ preventScroll: true });
    }

    wasMobileMenuOpenRef.current = isMobileMenuOpen;

    return () => {
      if (focusFrame) window.cancelAnimationFrame(focusFrame);
      document.body.classList.remove("menu-open");
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (previousPathnameRef.current === pathname) return;
    previousPathnameRef.current = pathname;
    closeAllNavigation(false);
  }, [closeAllNavigation, pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen && !isDesktopProductMenuOpen) return;

    const desktopQuery = window.matchMedia("(min-width: 769px)");

    const closeOnKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (desktopQuery.matches && isDesktopProductMenuOpen) {
          const focusWasInProductMenu = Boolean(
            desktopProductMenuPanelRef.current?.contains(document.activeElement)
          );
          setIsDesktopProductMenuOpen(false);
          if (focusWasInProductMenu) desktopProductMenuToggleRef.current?.focus();
        }

        if (isMobileMenuOpen) closeMobileNavigation(true);
        return;
      }

      if (event.key !== "Tab" || !isMobileMenuOpen || !mobileMenuRef.current) return;
      const focusable = Array.from(
        mobileMenuRef.current.querySelectorAll<HTMLElement>(
          'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"])'
        )
      ).filter((element) => element.getClientRects().length > 0);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const closeOnOutsidePress = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && !navRef.current?.contains(target)) closeAllNavigation(true);
    };

    const closeOnBreakpointChange = () => {
      if (desktopQuery.matches) {
        closeMobileNavigation(false);
      } else {
        setIsDesktopProductMenuOpen(false);
      }
    };

    document.addEventListener("keydown", closeOnKeydown);
    document.addEventListener("pointerdown", closeOnOutsidePress);
    desktopQuery.addEventListener("change", closeOnBreakpointChange);

    return () => {
      document.removeEventListener("keydown", closeOnKeydown);
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      desktopQuery.removeEventListener("change", closeOnBreakpointChange);
    };
  }, [closeAllNavigation, closeMobileNavigation, isDesktopProductMenuOpen, isMobileMenuOpen]);

  /* eslint-disable react-hooks/set-state-in-effect -- The root-layout header syncs DOM state before observing the hero. */
  useLayoutEffect(() => {
    if (!isHomePage) {
      setIsScrolled(true);
      return;
    }

    const hero = document.getElementById("hero");
    if (!hero || !("IntersectionObserver" in window)) {
      setIsScrolled(true);
      return;
    }

    setIsScrolled(hero.getBoundingClientRect().bottom <= 0);
    const observer = new IntersectionObserver(
      ([entry]) => setIsScrolled(entry.boundingClientRect.bottom <= 0),
      { threshold: 0 }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, [isHomePage]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <nav ref={navRef} className={`navbar${isScrolled ? " scrolled" : ""}`} id="navbar">
      <div className="nav-container">
        <Link href="/" className="nav-logo" aria-label="Về trang chủ Tiệm Len Nhà Tiny" onClick={() => closeAllNavigation(false)}>
          <Image
            src="/images/logo_160.png"
            alt="Logo Tiệm Len Nhà Tiny - shop len handmade tại TP.HCM"
            className="logo-img"
            width={160}
            height={160}
            priority
          />
        </Link>

        <ul className="nav-links nav-links--desktop">
          <li
            className={`nav-product-menu${isDesktopProductMenuOpen ? " is-open" : ""}`}
            onMouseEnter={() => {
              if (isDesktopNavigation()) setIsDesktopProductMenuOpen(true);
            }}
            onMouseLeave={(event) => {
              if (isDesktopNavigation() && !event.currentTarget.matches(":focus-within")) {
                setIsDesktopProductMenuOpen(false);
              }
            }}
            onFocus={() => {
              if (isDesktopNavigation()) setIsDesktopProductMenuOpen(true);
            }}
            onBlur={(event) => {
              if (isDesktopNavigation() && !event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setIsDesktopProductMenuOpen(false);
              }
            }}
          >
            <div className="nav-product-menu__trigger">
              <Link
                href="/len-soi-va-phu-kien"
                className={`nav-product-menu__primary${isProductMenuActive ? " active-nav" : ""}`}
                style={{ "--i": 1 } as CSSProperties}
                aria-current={isProductCatalogRoute ? "page" : undefined}
                onClick={() => closeAllNavigation(false)}
              >
                Sản phẩm
              </Link>
              <button
                ref={desktopProductMenuToggleRef}
                className="nav-product-menu__toggle"
                type="button"
                aria-label={isDesktopProductMenuOpen ? "Đóng danh mục Sản phẩm" : "Mở danh mục Sản phẩm"}
                aria-expanded={isDesktopProductMenuOpen}
                aria-controls="desktopProductNavMenu"
                onClick={() => setIsDesktopProductMenuOpen(true)}
              />
            </div>
            <ul
              ref={desktopProductMenuPanelRef}
              className="nav-product-menu__panel"
              id="desktopProductNavMenu"
              aria-label="Danh mục sản phẩm"
            >
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
                      onClick={() => closeAllNavigation(false)}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
          {navItems.map((item) => {
            const isActive = isPathActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={[item.className, isActive ? "active-nav" : undefined].filter(Boolean).join(" ") || undefined}
                  style={{ "--i": item.styleIndex } as CSSProperties}
                  aria-current={isActive ? "page" : undefined}
                  data-track={item.trackKey}
                  data-track-handled={item.trackKey ? "true" : undefined}
                  onClick={() => {
                    closeAllNavigation(false);
                    if (item.trackKey) trackSiteEvent(item.trackKey, { label: item.label, href: item.href });
                  }}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <CartHeaderLink />
        <button
          ref={toggleRef}
          className={`hamburger${isMobileMenuOpen ? " active" : ""}`}
          id="hamburger"
          type="button"
          aria-label={isMobileMenuOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobileNavigation"
          onClick={() => {
            if (isMobileMenuOpen) {
              closeMobileNavigation(true);
              return;
            }
            shouldRestoreToggleFocusRef.current = false;
            setIsMobileProductMenuOpen(isProductMenuActive);
            setIsMobileMenuOpen(true);
          }}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <button
        type="button"
        className={`${styles.backdrop}${isMobileMenuOpen ? ` ${styles.backdropOpen}` : ""}`}
        aria-label="Đóng menu"
        aria-hidden={!isMobileMenuOpen}
        tabIndex={-1}
        onClick={() => closeMobileNavigation(true)}
      />

      <div
        ref={mobileMenuRef}
        className={`${styles.sheet}${isMobileMenuOpen ? ` ${styles.sheetOpen}` : ""}`}
        id="mobileNavigation"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobileNavigationTitle"
        aria-hidden={!isMobileMenuOpen}
        inert={!isMobileMenuOpen}
      >
        <div className={styles.sheetHeader}>
          <div>
            <p className={styles.sheetEyebrow}>Tiệm Len Nhà Tiny</p>
            <h2 id="mobileNavigationTitle">Bạn muốn ghé đâu?</h2>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Đóng menu"
            data-mobile-menu-initial
            onClick={() => closeMobileNavigation(true)}
          >
            Đóng
          </button>
        </div>

        <div className={styles.mobileNavigation} role="navigation" aria-label="Điều hướng trên điện thoại">
          <div className={`${styles.productGroup}${isProductMenuActive ? ` ${styles.activeGroup}` : ""}`}>
            <button
              type="button"
              className={styles.productButton}
              aria-expanded={isMobileProductMenuOpen}
              aria-controls="mobileProductNavMenu"
              onClick={() => setIsMobileProductMenuOpen((current) => !current)}
            >
              <span className={styles.rowCopy}>
                <strong>Sản phẩm</strong>
                <small>Len sợi và phụ kiện</small>
              </span>
              <span className={`${styles.chevron}${isMobileProductMenuOpen ? ` ${styles.chevronOpen}` : ""}`} aria-hidden="true" />
            </button>
            <div className={`${styles.submenuReveal}${isMobileProductMenuOpen ? ` ${styles.submenuRevealOpen}` : ""}`}>
              <ul id="mobileProductNavMenu" className={styles.submenu} aria-label="Danh mục sản phẩm">
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
                        className={isActive ? styles.activeLink : undefined}
                        aria-current={pathname === item.href ? "page" : undefined}
                        tabIndex={isMobileProductMenuOpen ? undefined : -1}
                        onClick={() => closeAllNavigation(false)}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <ul className={styles.primaryLinks}>
            {navItems.filter((item) => !item.className).map((item) => {
              const isActive = isPathActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={isActive ? styles.activeLink : undefined}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => closeAllNavigation(false)}
                  >
                    <span className={styles.rowCopy}>
                      <strong>{item.label}</strong>
                      {item.description ? <small>{item.description}</small> : null}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <a
            href={siteConfig.messengerUrl}
            className={styles.contactCta}
            target="_blank"
            rel="noopener noreferrer"
            data-track="nav_order_click"
            data-track-handled="true"
            onClick={() => {
              trackSiteEvent("nav_order_click", { label: "Nhắn Tiny", href: siteConfig.messengerUrl });
              closeAllNavigation(false);
            }}
          >
            <span>Nhắn Tiny</span>
            <small>Messenger</small>
          </a>
        </div>
      </div>
    </nav>
  );
}
