"use client";

import Image from "next/image";
import { getYarnProductGalleryImageAlt } from "@/lib/products/yarn-product-seo";
import type { YarnProduct, YarnVariant } from "@/types/yarn-product";
import styles from "./YarnProductDetail.module.css";

export function ProductGallery({ images, mainImage, product, selectedVariant, onSelect }: { images: string[]; mainImage: string; product: YarnProduct; selectedVariant: YarnVariant | null; onSelect: (image: string) => void }) {
  const gallery = Array.from(new Set(images));
  if (!gallery.includes(mainImage)) gallery.unshift(mainImage);
  const mainImageAlt = getYarnProductGalleryImageAlt(product, mainImage, selectedVariant);
  return (
    <section className={styles.gallery} aria-label="Hình ảnh sản phẩm">
      <div className={styles.galleryMain}>
        <Image src={mainImage} alt={mainImageAlt} width={900} height={900} priority sizes="(max-width: 800px) calc(100vw - 64px), 560px" />
      </div>
      <div className={styles.thumbnails} aria-label="Thư viện ảnh sản phẩm">
        {gallery.map((image, index) => (
          <button
            type="button"
            className={`${styles.thumbnail} ${image === mainImage ? styles.thumbnailActive : ""}`}
            key={`${image}-${index}`}
            onClick={() => onSelect(image)}
            aria-label={`Xem ảnh ${index + 1}`}
            aria-pressed={image === mainImage}
          >
            <Image src={image} alt="" width={96} height={96} sizes="82px" />
          </button>
        ))}
      </div>
    </section>
  );
}
