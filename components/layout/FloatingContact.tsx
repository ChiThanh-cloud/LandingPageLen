"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { trackSiteEvent } from "@/lib/siteTracking";

const messengerUrl = "https://m.me/61559447375156";
const zaloUrl = "https://zalo.me/0937511107";
const backToTopThreshold = 600;

export function FloatingContact() {
  const pathname = usePathname();
  const [inHero, setInHero] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect -- This persistent root-layout control must reset stale hero visibility as the route DOM changes. */
  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 768px)");
    const updateMobile = () => setIsMobile(mobileQuery.matches);
    updateMobile();
    mobileQuery.addEventListener("change", updateMobile);

    return () => mobileQuery.removeEventListener("change", updateMobile);
  }, []);

  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero || !("IntersectionObserver" in window)) {
      setInHero(false);
      return;
    }

    setInHero(hero.getBoundingClientRect().bottom > 0);
    const observer = new IntersectionObserver(
      ([entry]) => setInHero(entry.isIntersecting),
      { threshold: 0.05 }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    const updateBackToTopVisibility = () => {
      setShowBackToTop(window.scrollY >= backToTopThreshold);
    };

    updateBackToTopVisibility();
    window.addEventListener("scroll", updateBackToTopVisibility, { passive: true });

    return () => window.removeEventListener("scroll", updateBackToTopVisibility);
  }, [pathname]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const isBackToTopVisible = isMobile ? showBackToTop : !inHero;

  const handleBackToTop = () => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    trackSiteEvent("float_top_click", { label: "Lên đầu", href: "/#hero" });
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  };

  return (
    <>
      <div className="float-buttons floating-actions">
        <a
          href={zaloUrl}
          target="_blank"
          rel="noopener"
          className="float-btn zalo-float"
          id="float-zalo"
          aria-label="Nhắn Tiny qua Zalo"
          data-track="float_zalo_click"
          data-track-handled="true"
          onClick={() => trackSiteEvent("float_zalo_click", { label: "Zalo", href: zaloUrl })}
        >
          <svg viewBox="0 0 48 48" width="26" height="26" aria-hidden="true">
            <text
              x="50%"
              y="56%"
              dominantBaseline="middle"
              textAnchor="middle"
              fill="currentColor"
              fontSize="18"
              fontWeight="bold"
              fontFamily="Arial, sans-serif"
            >
              Za
            </text>
          </svg>
          <span className="float-label">Zalo</span>
        </a>
        <a
          href={messengerUrl}
          target="_blank"
          rel="noopener"
          className="float-btn fb-float"
          id="float-fb"
          aria-label="Nhắn Tiny qua Messenger"
          data-track="float_facebook_click"
          data-track-handled="true"
          onClick={() =>
            trackSiteEvent("float_facebook_click", {
              label: "Messenger",
              href: messengerUrl
            })
          }
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.145 2 11.259c0 2.915 1.455 5.515 3.728 7.213V22l3.405-1.868c.909.251 1.872.386 2.867.386 5.523 0 10-4.145 10-9.259C22 6.145 17.523 2 12 2Zm.994 12.468-2.546-2.715-4.968 2.715 5.465-5.803 2.608 2.715 4.906-2.715-5.465 5.803Z"
            />
          </svg>
          <span className="float-label">Messenger</span>
        </a>
        <button
          type="button"
          className={`float-btn top-float${isBackToTopVisible ? "" : " is-hidden"}`}
          id="float-top"
          aria-label="Về đầu trang"
          data-track="float_top_click"
          data-track-handled="true"
          onClick={handleBackToTop}
        >
          <svg
            className="lucide lucide-arrow-up"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m5 12 7-7 7 7" />
            <path d="M12 19V5" />
          </svg>
          <span className="float-label">Lên đầu</span>
        </button>
      </div>
      <div
        id="mobile-cta-bar"
        className={`mobile-cta-bar${!isMobile || inHero ? " is-hidden" : ""}`}
      >
        <a
          href={messengerUrl}
          target="_blank"
          rel="noopener"
          className="mobile-cta-btn mobile-cta-primary"
          data-track="mobile_sticky_cta_click"
          data-track-handled="true"
          onClick={() =>
            trackSiteEvent("mobile_sticky_cta_click", {
              label: "Nhắn Tiny báo giá ngay",
              href: messengerUrl
            })
          }
        >
          Nhắn Messenger
        </a>
        <a
          href={zaloUrl}
          target="_blank"
          rel="noopener"
          className="mobile-cta-btn mobile-cta-secondary"
          data-track="float_zalo_click"
          data-track-handled="true"
          onClick={() => trackSiteEvent("float_zalo_click", { label: "Zalo", href: zaloUrl })}
        >
          Nhắn Zalo
        </a>
      </div>
    </>
  );
}
