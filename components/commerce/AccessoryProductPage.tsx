"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { getCommerceStatusLabel } from "@/lib/products/commerce-catalog";
import {
  canAddAccessoryToCart,
  createAccessoryCartItem,
  getAccessoryDetailPriceLabel,
  getAccessoryOptionStatusLabel,
  getAccessoryQuantity,
  getAccessoryStockLabel,
  getCommerceStockLimit,
  getInitialAccessoryVariantId
} from "@/lib/products/accessory-product-detail";
import type { CommerceProduct, CommerceVariant } from "@/types/commerce-product";
import styles from "./AccessoryProductPage.module.css";

function getAddMessage(
  code: "added" | "updated" | "stock-capped" | "stock-limit" | "out-of-stock" | "invalid-quantity" | "not-found",
  product: CommerceProduct,
  variant: CommerceVariant,
  acceptedQuantity: number
) {
  const option = `${product.name} – ${variant.name}`;
  if (code === "stock-capped") {
    return acceptedQuantity > 0
      ? `Đã thêm ${acceptedQuantity} ${product.unitLabel} ${option}. Giỏ hàng đã đạt số lượng hiện có.`
      : `${option} đã đạt số lượng hiện có trong giỏ hàng.`;
  }
  if (code === "stock-limit") return `${option} đã đạt số lượng hiện có trong giỏ hàng.`;
  if (code === "out-of-stock") return `${option} hiện đã hết hàng.`;
  if (code === "invalid-quantity") return "Số lượng cần ít nhất là 1.";
  if (code === "not-found") return "Tiny chưa thể thêm lựa chọn này vào giỏ hàng.";
  return `Đã thêm ${product.name} – ${variant.name} vào giỏ hàng.`;
}

function ProductImage({ image, productName }: { image: string; productName: string }) {
  if (!image) {
    return <div className={styles.imageEmpty} role="img" aria-label={`Sản phẩm ${productName} chưa có ảnh`}>Chưa có ảnh sản phẩm</div>;
  }

  return <Image src={image} alt={productName} width={760} height={760} sizes="(max-width: 800px) 100vw, 48vw" priority />;
}

export function AccessoryProductPage({ product }: { product: CommerceProduct }) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(() => getInitialAccessoryVariantId(product.variants));
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const { addItem } = useCart();

  const selectedVariant = product.variants.find((variant) => variant.id === selectedVariantId) || null;
  const stockLimit = selectedVariant ? getCommerceStockLimit(selectedVariant.stock) : null;
  const canAdd = canAddAccessoryToCart(product, selectedVariant);
  const displayedImage = selectedVariant?.image || product.image;
  const productStatus = getCommerceStatusLabel(product.status);
  const variantStatus = selectedVariant ? getCommerceStatusLabel(selectedVariant.status) : null;

  const selectVariant = (variant: CommerceVariant) => {
    setSelectedVariantId(variant.id);
    setQuantity(1);
    setMessage("");
  };

  const changeQuantity = (nextQuantity: number) => {
    const next = selectedVariant ? getAccessoryQuantity(nextQuantity, selectedVariant.stock) : null;
    if (next !== null) setQuantity(next);
  };

  const addToCart = () => {
    if (!selectedVariant) {
      setMessage(`Hãy chọn ${product.optionLabel.toLocaleLowerCase("vi-VN")} trước khi thêm vào giỏ hàng.`);
      return;
    }

    const item = createAccessoryCartItem(product, selectedVariant, quantity);
    if (!item || !canAdd) {
      setMessage(getAccessoryStockLabel(selectedVariant.stock, product.unitLabel));
      return;
    }

    const result = addItem(item, selectedVariant.stock);
    setMessage(getAddMessage(result.code, product, selectedVariant, result.acceptedQuantity));
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.productLayout}>
          <section className={styles.gallery} aria-label={`Ảnh ${product.name}`}>
            <div className={styles.imageFrame}>
              <ProductImage image={displayedImage} productName={product.name} />
            </div>
          </section>

          <section className={styles.info}>
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <Link href="/">Trang chủ</Link>
              <span aria-hidden="true">›</span>
              <Link href="/len-soi-va-phu-kien">Cuộn len &amp; phụ kiện</Link>
              <span aria-hidden="true">›</span>
              <span aria-current="page">{product.name}</span>
            </nav>

            <p className={styles.category}>Phụ kiện</p>
            <h1 className={styles.title}>{product.name}</h1>
            {product.description ? <p className={styles.description}>{product.description}</p> : null}

            <dl className={styles.metadata}>
              <div>
                <dt>Đơn vị</dt>
                <dd>{product.unitLabel}</dd>
              </div>
              {productStatus ? (
                <div>
                  <dt>Tình trạng</dt>
                  <dd>{productStatus}</dd>
                </div>
              ) : null}
            </dl>

            <p className={styles.pricePanel} aria-live="polite">{getAccessoryDetailPriceLabel(product, selectedVariant)}</p>

            {product.variants.length === 0 ? (
              <section className={styles.noVariants} role="status">
                <strong>Sản phẩm chưa có lựa chọn bán.</strong>
                <p>Vui lòng liên hệ Tiny để được hỗ trợ.</p>
              </section>
            ) : (
              <>
                <fieldset className={styles.variants}>
                  <legend>{product.optionLabel}{selectedVariant ? <><span aria-hidden="true">: </span><strong>{selectedVariant.name}</strong></> : null}</legend>
                  <div className={styles.optionGrid}>
                    {product.variants.map((variant) => {
                      const optionStockLimit = getCommerceStockLimit(variant.stock);
                      const isOutOfStock = optionStockLimit === 0;
                      const visibleOptionStatus = getAccessoryOptionStatusLabel(variant.stock, variant.status);
                      return (
                        <button
                          key={variant.id}
                          type="button"
                          className={variant.id === selectedVariantId ? styles.optionActive : undefined}
                          onClick={() => selectVariant(variant)}
                          disabled={isOutOfStock}
                          aria-pressed={variant.id === selectedVariantId}
                          aria-label={`${product.optionLabel}: ${variant.name}${visibleOptionStatus ? `, ${visibleOptionStatus.toLocaleLowerCase("vi-VN")}` : ""}`}
                        >
                          <span>{variant.name}</span>
                          {visibleOptionStatus ? <small>{visibleOptionStatus}</small> : null}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {selectedVariant ? (
                  <>
                    <div className={styles.stockRow}>
                      <span>{getAccessoryStockLabel(selectedVariant.stock, product.unitLabel)}</span>
                      {variantStatus ? <strong>{variantStatus}</strong> : null}
                    </div>
                    <div className={styles.quantityRow}>
                      <span className={styles.quantityLabel}>Số lượng</span>
                      <div className={styles.quantity} aria-label="Chọn số lượng">
                        <button type="button" onClick={() => changeQuantity(quantity - 1)} disabled={quantity <= 1 || stockLimit === 0} aria-label="Giảm số lượng">−</button>
                        <output aria-live="polite">{quantity}</output>
                        <button type="button" onClick={() => changeQuantity(quantity + 1)} disabled={stockLimit !== null && quantity >= stockLimit} aria-label="Tăng số lượng">+</button>
                      </div>
                    </div>
                    <button type="button" className={styles.addButton} disabled={!canAdd} onClick={addToCart}>Thêm vào giỏ hàng</button>
                  </>
                ) : (
                  <p className={styles.selectionPrompt} role="status">Chọn {product.optionLabel.toLocaleLowerCase("vi-VN")} để xem giá và thêm vào giỏ hàng.</p>
                )}
                <p className={styles.actionMessage} role="status" aria-live="polite">{message}</p>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
