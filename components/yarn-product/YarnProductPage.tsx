"use client";

import { useState } from "react";
import type { YarnProduct, YarnVariant } from "@/types/yarn-product";
import { ProductActions } from "./ProductActions";
import { ProductDescription } from "./ProductDescription";
import { ProductGallery } from "./ProductGallery";
import { ProductInfo } from "./ProductInfo";
import { ProductSeoContent } from "./ProductSeoContent";
import { QuantitySelector } from "./QuantitySelector";
import { RelatedProducts } from "./RelatedProducts";
import { VariantSelector } from "./VariantSelector";
import { WholesalePricingTable } from "./WholesalePricingTable";
import { YarnProductJsonLd } from "./YarnProductJsonLd";
import styles from "./YarnProductDetail.module.css";

export function YarnProductPage({ product, relatedProducts }: { product: YarnProduct; relatedProducts: YarnProduct[] }) {
  const firstAvailable = product.variants.find((variant) => variant.stock === null || variant.stock > 0) || product.variants[0];
  const [variant, setVariant] = useState<YarnVariant | null>(firstAvailable || null);
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState(firstAvailable?.image || product.image);

  const chooseVariant = (next: YarnVariant) => {
    setVariant(next);
    setQuantity(1);
    setMainImage(next.image || product.image);
  };

  return (
    <main className={`yp-page ${styles.page}`}>
      <YarnProductJsonLd product={product} />
      <div className={`yp-shell ${styles.shell}`}>
        <div className={styles.productLayout}>
          <ProductGallery images={product.images} mainImage={mainImage} product={product} selectedVariant={variant} onSelect={setMainImage} />
          <ProductInfo product={product} selectedPrice={variant?.price}>
            {variant ? (
              <>
                <VariantSelector variants={product.variants} selected={variant} onSelect={chooseVariant} />
                <QuantitySelector quantity={quantity} stock={variant.stock} onChange={setQuantity} />
                <ProductActions product={product} variant={variant} quantity={quantity} />
                <WholesalePricingTable tiers={product.wholesaleTiers} />
              </>
            ) : (
              <div className={styles.noVariants} role="status">
                <strong>Chưa có bảng màu</strong>
                <p>Vui lòng nhắn Tiny để kiểm tra màu hiện có của sản phẩm này.</p>
              </div>
            )}
          </ProductInfo>
        </div>
        <ProductDescription product={product} />
        <ProductSeoContent product={product} />
        <RelatedProducts products={relatedProducts} />
      </div>
    </main>
  );
}
