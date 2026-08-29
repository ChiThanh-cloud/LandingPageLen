"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { siteConfig } from "@/data/site";
import type { HandmadePortfolioItem } from "@/lib/products/handmade-portfolio";
import styles from "@/app/do-moc-theo-yeu-cau/page.module.css";

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase()
    .trim();
}

function buildMessengerUrl(itemName?: string) {
  const message = itemName
    ? `Chào Tiny, mình muốn đặt một mẫu tương tự "${itemName}" và điều chỉnh theo ý tưởng riêng. Tiny tư vấn giúp mình nhé.`
    : "Chào Tiny, mình muốn gửi ảnh mẫu để được tư vấn đồ móc theo yêu cầu.";
  return `${siteConfig.messengerUrl}?text=${encodeURIComponent(message)}`;
}

export function HandmadePortfolioGallery({ items }: { items: HandmadePortfolioItem[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [selectedItem, setSelectedItem] = useState<HandmadePortfolioItem | null>(null);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const imageZoomTriggerRef = useRef<HTMLButtonElement>(null);
  const imageZoomCloseRef = useRef<HTMLButtonElement>(null);

  const categories = useMemo(() => {
    const uniqueCategories = new Map<string, string>();
    items.forEach((item) => uniqueCategories.set(item.category, item.categoryLabel));
    return Array.from(uniqueCategories, ([value, label]) => ({ value, label }));
  }, [items]);

  const visibleItems = useMemo(() => {
    const normalizedQuery = normalizeText(query);
    return items.filter((item) => {
      const matchesCategory = category === "all" || item.category === category;
      const matchesQuery = !normalizedQuery
        || normalizeText(`${item.name} ${item.categoryLabel}`).includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, items, query]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (selectedItem && !dialog.open) dialog.showModal();
    if (!selectedItem && dialog.open) dialog.close();
  }, [selectedItem]);

  useEffect(() => {
    if (isImageZoomed) imageZoomCloseRef.current?.focus();
  }, [isImageZoomed]);

  const openPortfolioItem = (item: HandmadePortfolioItem) => {
    setIsImageZoomed(false);
    setSelectedItem(item);
  };

  const closeLightbox = () => {
    setIsImageZoomed(false);
    setSelectedItem(null);
  };

  const closeImageZoom = () => {
    setIsImageZoomed(false);
    requestAnimationFrame(() => imageZoomTriggerRef.current?.focus());
  };

  if (items.length === 0) {
    return (
      <div className={styles.galleryUnavailable} role="status">
        <p>Gallery đang tạm thời chưa tải được.</p>
        <a
          className={styles.textLink}
          href={buildMessengerUrl()}
          target="_blank"
          rel="noopener noreferrer"
          data-track="product_messenger_click"
          data-category="handmade"
        >
          Gửi mẫu trực tiếp cho Tiny
        </a>
      </div>
    );
  }

  return (
    <>
      <div className={styles.galleryTools}>
        <div className={styles.searchField}>
          <label htmlFor="handmade-search">Tìm trong mẫu Tiny đã làm</label>
          <input
            id="handmade-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ví dụ: túi, hoa, thỏ..."
            autoComplete="off"
          />
        </div>

        <div className={styles.filters} aria-label="Lọc mẫu theo nhóm">
          <button
            type="button"
            className={category === "all" ? styles.filterActive : undefined}
            aria-pressed={category === "all"}
            onClick={() => setCategory("all")}
          >
            Tất cả
          </button>
          {categories.map((item) => (
            <button
              key={item.value}
              type="button"
              className={category === item.value ? styles.filterActive : undefined}
              aria-pressed={category === item.value}
              onClick={() => setCategory(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <p className={styles.resultCount} aria-live="polite">
        {visibleItems.length} mẫu phù hợp
      </p>

      {visibleItems.length > 0 ? (
        <div className={styles.portfolioGrid}>
          {visibleItems.map((item) => (
            <article className={styles.portfolioCard} key={item.id}>
              <button
                className={styles.portfolioImageButton}
                type="button"
                onClick={() => openPortfolioItem(item)}
                aria-label={`Xem ảnh lớn mẫu ${item.name}`}
              >
                <Image
                  src={item.image}
                  alt={item.imageAlt}
                  fill
                  sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, (max-width: 1279px) 33vw, 25vw"
                />
              </button>
              <div className={styles.portfolioCardBody}>
                <p className={styles.portfolioCategory}>{item.categoryLabel}</p>
                <h3>{item.name}</h3>
                {item.description && <p className={styles.portfolioDescription}>{item.description}</p>}
                <a
                  className={styles.cardCta}
                  href={buildMessengerUrl(item.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-track="product_messenger_click"
                  data-category="handmade"
                  data-product={item.name}
                >
                  Đặt mẫu tương tự
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState} role="status">
          <p>Chưa thấy mẫu khớp với từ khóa này.</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
          >
            Xem lại tất cả mẫu
          </button>
        </div>
      )}

      <dialog
        ref={dialogRef}
        className={styles.lightbox}
        aria-labelledby="handmade-lightbox-title"
        onCancel={(event) => {
          if (isImageZoomed) {
            event.preventDefault();
            closeImageZoom();
            return;
          }
          closeLightbox();
        }}
        onClose={closeLightbox}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeLightbox();
        }}
      >
        {selectedItem && (
          <div
            className={styles.lightboxPanel}
            aria-hidden={isImageZoomed}
            inert={isImageZoomed ? true : undefined}
          >
            <button
              className={styles.lightboxClose}
              type="button"
              onClick={closeLightbox}
            >
              Đóng
            </button>
            <button
              ref={imageZoomTriggerRef}
              className={styles.lightboxImage}
              type="button"
              aria-label={`Mở ảnh lớn: ${selectedItem.name}`}
              onClick={() => setIsImageZoomed(true)}
            >
              <Image
                src={selectedItem.fullImage}
                alt={selectedItem.imageAlt}
                fill
                sizes="(max-width: 768px) 94vw, 72vw"
              />
            </button>
            <div className={styles.lightboxCaption}>
              <p>{selectedItem.categoryLabel}</p>
              <h3 id="handmade-lightbox-title">{selectedItem.name}</h3>
              <a
                href={buildMessengerUrl(selectedItem.name)}
                target="_blank"
                rel="noopener noreferrer"
                data-track="product_messenger_click"
                data-category="handmade"
                data-product={selectedItem.name}
              >
                Nhờ Tiny tư vấn mẫu tương tự
              </a>
            </div>
          </div>
        )}
        {selectedItem && isImageZoomed ? (
          <div
            className={styles.imageZoomOverlay}
            role="dialog"
            aria-modal="true"
            aria-label={`Ảnh lớn: ${selectedItem.name}`}
            onClick={(event) => {
              if (event.target === event.currentTarget) closeImageZoom();
            }}
          >
            <button
              ref={imageZoomCloseRef}
              className={styles.imageZoomClose}
              type="button"
              aria-label="Đóng ảnh lớn"
              onClick={closeImageZoom}
            >
              ×
            </button>
            <button
              className={styles.imageZoomFrame}
              type="button"
              aria-label="Đóng ảnh lớn"
              onClick={closeImageZoom}
            >
              <Image
                src={selectedItem.fullImage}
                alt={selectedItem.imageAlt}
                fill
                sizes="96vw"
              />
            </button>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
