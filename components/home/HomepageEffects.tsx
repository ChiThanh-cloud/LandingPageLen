"use client";

import { useEffect } from "react";

export function HomepageEffects() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const revealEls = Array.from(document.querySelectorAll<HTMLElement>(
      ".trust-item, .product-card, .step, .review-card, .shop-info-faq-item, .home-blog-card, .about-grid, .contact-card"
    ));

    if (prefersReducedMotion || !revealEls.length || !("IntersectionObserver" in window)) {
      revealEls.forEach((el) => el.classList.add("visible"));
      return;
    }

    revealEls.forEach((el, index) => {
      el.classList.add("reveal");
      el.style.setProperty("--reveal-delay", `${Math.min(index * 40, 180)}ms`);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8%", threshold: 0.08 }
    );

    document.documentElement.classList.add("motion-ready");
    revealEls.forEach((el) => observer.observe(el));
    return () => {
      observer.disconnect();
      document.documentElement.classList.remove("motion-ready");
      revealEls.forEach((el) => el.style.removeProperty("--reveal-delay"));
    };
  }, []);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;

    const navAnchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('.nav-links a[href^="/#"]'));
    const sectionMap = new Map(
      navAnchors
        .map((anchor) => {
          const id = anchor.getAttribute("href")?.slice(2);
          const section = id ? document.getElementById(id) : null;
          return section && id ? [id, section] as const : null;
        })
        .filter((entry): entry is readonly [string, HTMLElement] => entry !== null)
    );

    const setActive = (id: string) => {
      navAnchors.forEach((anchor) => {
        anchor.classList.toggle("active-nav", anchor.getAttribute("href") === `/#${id}`);
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-18% 0px -62%", threshold: [0, 0.15, 0.4] }
    );

    sectionMap.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return null;
}
