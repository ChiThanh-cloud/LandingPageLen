"use client";

import { useEffect } from "react";

export function HomepageEffects() {
  useEffect(() => {
    const revealEls = document.querySelectorAll(
      ".trust-item, .product-card, .step, .review-card, .shop-info-faq-item, .home-blog-card, .about-grid, .contact-card"
    );

    if (!revealEls.length || !("IntersectionObserver" in window)) {
      revealEls.forEach((el) => el.classList.add("visible"));
      return;
    }

    revealEls.forEach((el) => el.classList.add("reveal"));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            window.setTimeout(() => entry.target.classList.add("visible"), index * 80);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    revealEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = document.getElementById("heroVideo");
    const fallback = () => {
      const wrap = document.querySelector<HTMLElement>(".hero-video-wrap");
      if (wrap) wrap.style.background = "linear-gradient(135deg, #2d1f28 0%, #c96a8a 100%)";
    };

    video?.addEventListener("error", fallback);
    return () => video?.removeEventListener("error", fallback);
  }, []);

  useEffect(() => {
    const updateActiveNav = () => {
      const sections = document.querySelectorAll("section[id]");
      const navAnchors = document.querySelectorAll<HTMLAnchorElement>('.nav-links a[href^="/#"]');
      let current = "";

      sections.forEach((section) => {
        if (window.scrollY >= (section as HTMLElement).offsetTop - 120) current = section.id;
      });

      navAnchors.forEach((anchor) => {
        anchor.classList.toggle("active-nav", anchor.getAttribute("href") === `/#${current}`);
      });
    };

    updateActiveNav();
    window.addEventListener("scroll", updateActiveNav, { passive: true });
    return () => window.removeEventListener("scroll", updateActiveNav);
  }, []);

  useEffect(() => {
    const interactiveSelector = [
      ".btn",
      ".nav-links a",
      ".product-card[role='button']",
      ".contact-card",
      ".home-blog-card",
      ".shop-info-faq-item summary",
      ".review-card",
      ".step",
      ".float-btn",
      ".mobile-cta-bar",
      ".blog-button",
      ".blog-card",
      ".blog-related-card"
    ].join(",");

    const handlePointerDown = (event: PointerEvent) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>(interactiveSelector);
      if (!target || target.matches("[disabled], [aria-disabled='true']")) return;

      target.classList.add("is-pressing");
      const clearPress = () => window.setTimeout(() => target.classList.remove("is-pressing"), 90);

      target.addEventListener("pointerup", clearPress, { once: true });
      target.addEventListener("pointercancel", clearPress, { once: true });
      target.addEventListener("pointerleave", clearPress, { once: true });
    };

    document.addEventListener("pointerdown", handlePointerDown, { passive: true });
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return null;
}
