"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";

type BlogImageLightboxProps = {
  src: string;
  fullSrc: string;
  alt: string;
  caption?: string;
  orientation?: "landscape" | "portrait";
};

export function BlogImageLightbox({
  src,
  fullSrc,
  alt,
  caption,
  orientation = "landscape"
}: BlogImageLightboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const orientationClass = orientation === "portrait" ? " is-portrait" : "";

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const closeLightbox = () => {
    setIsOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  return (
    <>
      <figure className={`blog-content-card blog-image-section${orientationClass}`}>
        <button
          ref={triggerRef}
          className="blog-image-link"
          type="button"
          aria-haspopup="dialog"
          aria-label={`Xem ảnh đầy đủ: ${alt}`}
          onClick={() => setIsOpen(true)}
        >
          <span className="blog-image-frame">
            <Image
              src={src}
              alt={alt}
              fill
              sizes={orientation === "portrait" ? "(max-width: 768px) 100vw, 640px" : "(max-width: 768px) 100vw, 800px"}
            />
          </span>
          <span className="blog-image-view">Xem ảnh đầy đủ</span>
        </button>
        {caption ? <figcaption>{caption}</figcaption> : null}
      </figure>

      {isOpen ? (
        <div
          className="blog-image-lightbox"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeLightbox();
          }}
        >
          <div
            className={`blog-image-lightbox-dialog${orientationClass}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <button
              ref={closeRef}
              className="blog-image-lightbox-close"
              type="button"
              aria-label="Đóng ảnh đầy đủ"
              onClick={closeLightbox}
            >
              ×
            </button>
            <div className="blog-image-lightbox-frame">
              <Image src={fullSrc} alt={alt} fill sizes="100vw" priority />
            </div>
            <p id={titleId}>{caption || alt}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
