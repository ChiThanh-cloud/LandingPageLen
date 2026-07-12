"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { trackSiteEvent } from "@/lib/siteTracking";

const messengerUrl = "https://m.me/61559447375156";
const zaloUrl = "https://zalo.me/0368903519";

export function FloatingContact() {
  const [inHero, setInHero] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateFloatingState = () => {
      const heroHeight = document.getElementById("hero")?.offsetHeight || 0;
      setInHero(heroHeight > 0 && window.scrollY < heroHeight);
      setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    };

    updateFloatingState();
    window.addEventListener("scroll", updateFloatingState, { passive: true });
    window.addEventListener("resize", updateFloatingState);

    return () => {
      window.removeEventListener("scroll", updateFloatingState);
      window.removeEventListener("resize", updateFloatingState);
    };
  }, []);

  return (
    <>
      <div className={`float-buttons${isMobile && inHero ? " is-mobile-hero" : ""}`}>
        <Link
          href="/#hero"
          className={`float-btn top-float${inHero ? " is-hidden" : ""}`}
          id="float-top"
          aria-label="Lên đầu trang"
          data-track="float_top_click"
          data-track-handled="true"
          onClick={() => trackSiteEvent("float_top_click", { label: "Lên đầu", href: "/#hero" })}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m18 15-6-6-6 6" />
          </svg>
          <span className="float-label">Lên đầu</span>
        </Link>
        <a
          href={zaloUrl}
          target="_blank"
          rel="noopener"
          className="float-btn zalo-float"
          id="float-zalo"
          aria-label="Chat Zalo"
          data-track="float_zalo_click"
          data-track-handled="true"
          onClick={() => trackSiteEvent("float_zalo_click", { label: "Zalo", href: zaloUrl })}
        >
          <div className="msg-badge">+1</div>
          <svg viewBox="0 0 48 48" width="26" height="26" aria-hidden="true">
            <text
              x="50%"
              y="56%"
              dominantBaseline="middle"
              textAnchor="middle"
              fill="white"
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
          aria-label="Chat Facebook"
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
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          <span className="float-label">Messenger</span>
        </a>
      </div>
      <a
        href={messengerUrl}
        target="_blank"
        rel="noopener"
        className={`mobile-cta-bar${!isMobile || inHero ? " is-hidden" : ""}`}
        id="mobile-cta-bar"
        data-track="mobile_sticky_cta_click"
        data-track-handled="true"
        onClick={() =>
          trackSiteEvent("mobile_sticky_cta_click", {
            label: "Nhắn Tiny báo giá ngay",
            href: messengerUrl
          })
        }
      >
        Nhắn Tiny báo giá ngay →
      </a>
    </>
  );
}
