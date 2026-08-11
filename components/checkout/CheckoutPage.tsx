"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { useCart } from "@/components/cart/CartProvider";
import {
  checkoutFormSchema,
  createCheckoutPayload,
  resolveCheckoutItems,
  type CheckoutFormValues
} from "@/lib/checkout/checkout-schema";
import { calculateCheckoutDisplayTotals } from "@/lib/orders/order-display";
import type { YarnProduct } from "@/types/yarn-product";
import styles from "./Checkout.module.css";

type CheckoutErrors = Partial<Record<keyof CheckoutFormValues, string>>;

type ServerCartIssue = {
  productId: string;
  variantId: string;
  message: string;
};

type OrderApiError = {
  code?: string;
  message?: string;
  item?: {
    productId?: string;
    variantId?: string;
    availableStock?: number;
  };
};

const initialValues: CheckoutFormValues = {
  customerName: "",
  phone: "",
  email: "",
  province: "",
  district: "",
  ward: "",
  addressLine: "",
  shippingNote: "",
  paymentMethod: "cod"
};

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return <span id={id} className={styles.fieldError} role="alert">{message}</span>;
}

export function CheckoutPage({ availableProducts }: { availableProducts: YarnProduct[] }) {
  const router = useRouter();
  const { items, hydrated, clearCart } = useCart();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<CheckoutFormValues>(initialValues);
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [formMessage, setFormMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverCartIssue, setServerCartIssue] = useState<ServerCartIssue | null>(null);

  const resolvedItems = useMemo(
    () => resolveCheckoutItems(items, availableProducts),
    [availableProducts, items]
  );
  const hasCartIssues = resolvedItems.some((entry) => entry.issue !== null);

  // DISPLAY ONLY. POST /api/orders re-queries Supabase and calculates trusted totals.
  const displaySubtotal = resolvedItems.reduce(
    (total, entry) => total + entry.displayPrice * entry.item.quantity,
    0
  );
  const displayTotals = calculateCheckoutDisplayTotals(displaySubtotal);

  function setField<Key extends keyof CheckoutFormValues>(field: Key, value: CheckoutFormValues[Key]) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    if (items.length === 0 || hasCartIssues || serverCartIssue) {
      setFormMessage("Vui lòng quay lại giỏ hàng để cập nhật sản phẩm trước khi tiếp tục.");
      return;
    }

    const result = checkoutFormSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      const nextErrors: CheckoutErrors = {};
      for (const [field, messages] of Object.entries(fieldErrors)) {
        const message = messages?.[0];
        if (message) nextErrors[field as keyof CheckoutFormValues] = message;
      }
      setErrors(nextErrors);
      setFormMessage("Vui lòng kiểm tra lại các thông tin được đánh dấu.");

      const firstInvalidField = Object.keys(nextErrors)[0];
      requestAnimationFrame(() => {
        formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalidField}"]`)?.focus();
      });
      return;
    }

    const payload = createCheckoutPayload(result.data, items);
    setErrors({});
    setFormMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({})) as OrderApiError & { orderCode?: string };

      if (!response.ok || !data.orderCode) {
        if (
          data.item?.productId
          && data.item.variantId
          && ["OUT_OF_STOCK", "PRODUCT_UNAVAILABLE", "VARIANT_UNAVAILABLE"].includes(data.code || "")
        ) {
          const affected = resolvedItems.find((entry) => (
            entry.item.productId === data.item?.productId
            && entry.item.variantId === data.item?.variantId
          ));
          const label = affected
            ? `${affected.productName} — mã ${affected.variantName}`
            : "Một sản phẩm trong giỏ";
          setServerCartIssue({
            productId: data.item.productId,
            variantId: data.item.variantId,
            message: `${label}: ${data.message || "số lượng đã chọn hiện không còn đủ."}`
          });
          setFormMessage("Tồn kho vừa thay đổi. Vui lòng quay lại giỏ hàng để cập nhật.");
        } else {
          setFormMessage(data.message || "Tiny chưa thể tạo đơn lúc này. Vui lòng thử lại sau.");
        }
        return;
      }

      clearCart();
      router.push(`/dat-hang-thanh-cong/${encodeURIComponent(data.orderCode)}`);
    } catch {
      setFormMessage("Không thể gửi yêu cầu đặt hàng. Vui lòng kiểm tra mạng và thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!hydrated) {
    return (
      <main className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.loading} role="status" aria-live="polite">Đang tải thông tin đặt hàng…</div>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className={styles.page}>
        <div className={styles.shell}>
          <section className={styles.emptyState}>
            <span className={styles.emptyIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 4h2l2.1 10.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L20 7H6" />
                <circle cx="9.5" cy="19.5" r="1" /><circle cx="17.5" cy="19.5" r="1" />
              </svg>
            </span>
            <p className={styles.eyebrow}>Thanh toán không cần tài khoản</p>
            <h1>Giỏ hàng của bạn đang trống</h1>
            <p>Bạn cần chọn ít nhất một sản phẩm len hoặc phụ kiện trước khi điền thông tin giao hàng.</p>
            <Link href="/len-soi" className={styles.primaryLink}>Quay lại mua len</Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.pageHeader}>
          <p className={styles.eyebrow}>Thanh toán không cần tài khoản</p>
          <h1>Thông tin giao hàng</h1>
          <p>Không cần tạo tài khoản. Tiny sẽ dùng thông tin này để tạo và xác nhận đơn hàng.</p>
        </header>

        <div className={styles.checkoutLayout}>
          <form ref={formRef} className={styles.checkoutForm} onSubmit={handleSubmit} noValidate>
            <section className={styles.formSection} aria-labelledby="customer-heading">
              <div className={styles.sectionHeading}>
                <span>01</span>
                <div><h2 id="customer-heading">Thông tin khách hàng</h2><p>Các trường có dấu * là bắt buộc.</p></div>
              </div>

              <div className={styles.fieldGrid}>
                <label className={styles.field}>
                  <span>Họ và tên <b aria-hidden="true">*</b></span>
                  <input
                    name="customerName"
                    type="text"
                    autoComplete="name"
                    value={values.customerName}
                    onChange={(event) => setField("customerName", event.target.value)}
                    aria-invalid={Boolean(errors.customerName)}
                    aria-describedby={errors.customerName ? "customerName-error" : undefined}
                  />
                  <FieldError id="customerName-error" message={errors.customerName} />
                </label>

                <label className={styles.field}>
                  <span>Số điện thoại <b aria-hidden="true">*</b></span>
                  <input
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={values.phone}
                    onChange={(event) => setField("phone", event.target.value)}
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={errors.phone ? "phone-error" : undefined}
                  />
                  <FieldError id="phone-error" message={errors.phone} />
                </label>

                <label className={`${styles.field} ${styles.fullWidth}`}>
                  <span>Email <small>(không bắt buộc)</small></span>
                  <input
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={values.email}
                    onChange={(event) => setField("email", event.target.value)}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                  <FieldError id="email-error" message={errors.email} />
                </label>
              </div>
            </section>

            <section className={styles.formSection} aria-labelledby="shipping-heading">
              <div className={styles.sectionHeading}>
                <span>02</span>
                <div><h2 id="shipping-heading">Địa chỉ giao hàng</h2><p>Shop sẽ dùng địa chỉ này để xác nhận phương án giao hàng.</p></div>
              </div>

              <div className={styles.fieldGrid}>
                <label className={styles.field}>
                  <span>Tỉnh / Thành phố <b aria-hidden="true">*</b></span>
                  <input
                    name="province"
                    type="text"
                    autoComplete="address-level1"
                    value={values.province}
                    onChange={(event) => setField("province", event.target.value)}
                    aria-invalid={Boolean(errors.province)}
                    aria-describedby={errors.province ? "province-error" : undefined}
                  />
                  <FieldError id="province-error" message={errors.province} />
                </label>

                <label className={styles.field}>
                  <span>Quận / Huyện <b aria-hidden="true">*</b></span>
                  <input
                    name="district"
                    type="text"
                    autoComplete="address-level2"
                    value={values.district}
                    onChange={(event) => setField("district", event.target.value)}
                    aria-invalid={Boolean(errors.district)}
                    aria-describedby={errors.district ? "district-error" : undefined}
                  />
                  <FieldError id="district-error" message={errors.district} />
                </label>

                <label className={styles.field}>
                  <span>Phường / Xã <b aria-hidden="true">*</b></span>
                  <input
                    name="ward"
                    type="text"
                    autoComplete="address-level3"
                    value={values.ward}
                    onChange={(event) => setField("ward", event.target.value)}
                    aria-invalid={Boolean(errors.ward)}
                    aria-describedby={errors.ward ? "ward-error" : undefined}
                  />
                  <FieldError id="ward-error" message={errors.ward} />
                </label>

                <label className={styles.field}>
                  <span>Địa chỉ cụ thể <b aria-hidden="true">*</b></span>
                  <input
                    name="addressLine"
                    type="text"
                    autoComplete="street-address"
                    value={values.addressLine}
                    onChange={(event) => setField("addressLine", event.target.value)}
                    aria-invalid={Boolean(errors.addressLine)}
                    aria-describedby={errors.addressLine ? "addressLine-error" : undefined}
                  />
                  <FieldError id="addressLine-error" message={errors.addressLine} />
                </label>

                <label className={`${styles.field} ${styles.fullWidth}`}>
                  <span>Ghi chú giao hàng <small>(không bắt buộc)</small></span>
                  <textarea
                    name="shippingNote"
                    rows={3}
                    value={values.shippingNote}
                    onChange={(event) => setField("shippingNote", event.target.value)}
                  />
                </label>
              </div>
            </section>

            <fieldset className={styles.formSection}>
              <legend className={styles.sectionHeading}>
                <span>03</span>
                <div><h2>Phương thức thanh toán</h2><p>Chọn cách thanh toán phù hợp với bạn.</p></div>
              </legend>

              <div className={styles.paymentOptions}>
                <label className={`${styles.paymentOption} ${values.paymentMethod === "cod" ? styles.paymentSelected : ""}`}>
                  <input
                    name="paymentMethod"
                    type="radio"
                    value="cod"
                    checked={values.paymentMethod === "cod"}
                    onChange={() => setField("paymentMethod", "cod")}
                  />
                  <span><strong>Thanh toán khi nhận hàng (COD)</strong><small>Bạn thanh toán khi nhận được đơn hàng.</small></span>
                </label>
                <label className={`${styles.paymentOption} ${values.paymentMethod === "bank_transfer" ? styles.paymentSelected : ""}`}>
                  <input
                    name="paymentMethod"
                    type="radio"
                    value="bank_transfer"
                    checked={values.paymentMethod === "bank_transfer"}
                    onChange={() => setField("paymentMethod", "bank_transfer")}
                  />
                  <span><strong>Chuyển khoản ngân hàng</strong><small>Hướng dẫn thanh toán sẽ được cung cấp sau khi đơn hàng được tạo. Các sản phẩm đủ điều kiện sẽ được giữ trong 30 phút.</small></span>
                </label>
              </div>
            </fieldset>

            {hasCartIssues || serverCartIssue ? (
              <div className={styles.cartIssueCallout} role="alert">
                <strong>Giỏ hàng cần được cập nhật</strong>
                <p>{serverCartIssue?.message || "Một hoặc nhiều sản phẩm không còn đủ điều kiện để tiếp tục."}</p>
                <Link href="/gio-hang">Quay lại giỏ hàng để cập nhật</Link>
              </div>
            ) : null}

            <button
              type="submit"
              className={styles.placeOrderButton}
              disabled={hasCartIssues || Boolean(serverCartIssue) || isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? "Đang tạo đơn…" : "Đặt hàng"}
            </button>
            <p className={styles.formMessage} role="alert" aria-live="assertive">{formMessage}</p>
          </form>

          <aside className={styles.orderSummary} aria-labelledby="order-summary-heading">
            <div className={styles.summaryHeader}>
              <div><p className={styles.eyebrow}>Đơn hàng</p><h2 id="order-summary-heading">Sản phẩm đã chọn</h2></div>
              <Link href="/gio-hang">Chỉnh sửa</Link>
            </div>

            <div className={styles.summaryItems}>
              {resolvedItems.map((entry) => {
                const serverIssueMessage = serverCartIssue
                  && serverCartIssue.productId === entry.item.productId
                  && serverCartIssue.variantId === entry.item.variantId
                  ? serverCartIssue.message
                  : null;
                return (
                <article className={`${styles.summaryItem} ${entry.issue || serverIssueMessage ? styles.summaryItemInvalid : ""}`} key={`${entry.item.productId}-${entry.item.variantId}`}>
                  <div className={styles.summaryImage}>
                    <Image src={entry.imageUrl} alt={`${entry.productName}, màu ${entry.variantName}`} width={80} height={80} sizes="72px" />
                    <span aria-label={`Số lượng ${entry.item.quantity}`}>{entry.item.quantity}</span>
                  </div>
                  <div className={styles.summaryDetails}>
                    <strong>{entry.productName}</strong>
                    <span>Mã màu: {entry.variantName}</span>
                    <span>{entry.displayPrice.toLocaleString("vi-VN")}đ × {entry.item.quantity}</span>
                    {entry.issueMessage || serverIssueMessage
                      ? <p role="alert">{entry.issueMessage || serverIssueMessage}</p>
                      : entry.variant?.stock === null
                        ? <small>Liên hệ Tiny để xác nhận số lượng lớn.</small>
                        : null}
                  </div>
                  <strong className={styles.linePrice}>{(entry.displayPrice * entry.item.quantity).toLocaleString("vi-VN")}đ</strong>
                </article>
                );
              })}
            </div>

            <div className={styles.summaryTotals}>
              <div><span>Tạm tính sản phẩm</span><strong>{displayTotals.subtotal.toLocaleString("vi-VN")}đ</strong></div>
              <div><span>Phí vận chuyển</span><strong>{displayTotals.shippingFee.toLocaleString("vi-VN")}đ</strong></div>
              <div className={styles.grandTotal}><span>Tổng thanh toán</span><strong>{displayTotals.total.toLocaleString("vi-VN")}đ</strong></div>
            </div>
            <p className={styles.totalNotice}>Giá và tình trạng sản phẩm sẽ được kiểm tra lại khi bạn đặt hàng.</p>
          </aside>
        </div>
      </div>
    </main>
  );
}
