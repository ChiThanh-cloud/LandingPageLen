"use client";

import { useRef, useState, type FormEvent } from "react";
import { PayOSPayment } from "@/components/payments/PayOSPayment";
import {
  getOrderStatusLabel,
  getPaymentMethodLabel,
  getPaymentStatusLabel
} from "@/lib/orders/order-display";
import {
  ORDER_LOOKUP_NOT_FOUND_MESSAGE,
  ORDER_TIMELINE_STEPS,
  getOrderTimelineProgress
} from "@/lib/orders/order-lookup-display";
import type { CustomerOrderLookup } from "@/lib/orders/order-lookup";
import styles from "./OrderLookup.module.css";

type LookupApiError = {
  code?: string;
  message?: string;
};

function formatCurrency(value: number | null) {
  if (value === null) return "Chưa xác định";
  return `${value.toLocaleString("vi-VN")}đ`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

function isOrderLookupResult(value: unknown): value is CustomerOrderLookup {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<CustomerOrderLookup>;
  return typeof candidate.orderCode === "string"
    && typeof candidate.createdAt === "string"
    && typeof candidate.orderStatus === "string"
    && typeof candidate.paymentStatus === "string"
    && typeof candidate.paymentMethod === "string"
    && Array.isArray(candidate.items)
    && typeof candidate.subtotal === "number";
}

function StatusTimeline({ status }: { status: CustomerOrderLookup["orderStatus"] }) {
  if (status === "cancelled") {
    return (
      <div className={styles.cancelledState} role="status">
        <span aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="m9 9 6 6M15 9l-6 6" />
          </svg>
        </span>
        <div>
          <strong>Đơn hàng đã hủy</strong>
          <p>Đơn hàng này đã được hủy và không tiếp tục xử lý.</p>
        </div>
      </div>
    );
  }

  const progress = getOrderTimelineProgress(status);
  return (
    <ol className={styles.timeline} aria-label="Tiến trình đơn hàng">
      {ORDER_TIMELINE_STEPS.map((step, index) => {
        const state = index < progress ? "complete" : index === progress ? "current" : "upcoming";
        return (
          <li key={step} data-state={state} aria-current={state === "current" ? "step" : undefined}>
            <span className={styles.stepMarker} aria-hidden="true">
              {index < progress ? (
                <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 10 3 3 7-7" />
                </svg>
              ) : index + 1}
            </span>
            <span className={styles.stepLabel}>{step}</span>
          </li>
        );
      })}
    </ol>
  );
}

function OrderResult({
  order,
  payOSEnabled
}: {
  order: CustomerOrderLookup;
  payOSEnabled: boolean;
}) {
  const isCancelled = order.orderStatus === "cancelled";
  const isBankTransfer = order.paymentMethod === "bank_transfer";
  const isUnpaid = order.paymentStatus === "unpaid";
  const showPayOS = payOSEnabled && isBankTransfer && isUnpaid && !isCancelled;

  return (
    <div className={styles.resultStack}>
      <section className={styles.resultCard} aria-labelledby="lookup-result-heading">
        <header className={styles.resultHeader}>
          <div>
            <p className={styles.resultEyebrow}>Thông tin đơn hàng</p>
            <h2 id="lookup-result-heading">{order.orderCode}</h2>
            <p>Đặt lúc <time dateTime={order.createdAt}>{formatDate(order.createdAt)}</time></p>
          </div>
          <span className={styles.statusBadge} data-status={order.orderStatus}>
            {getOrderStatusLabel(order.orderStatus)}
          </span>
        </header>

        <div className={styles.statusPanel}>
          <div className={styles.sectionHeading}>
            <p className={styles.sectionEyebrow}>Tiến trình</p>
            <h3>Trạng thái đơn hàng</h3>
          </div>
          <StatusTimeline status={order.orderStatus} />
        </div>

        <div className={styles.paymentSummary}>
          <div>
            <span>Phương thức thanh toán</span>
            <strong>{getPaymentMethodLabel(order.paymentMethod)}</strong>
          </div>
          <div>
            <span>Trạng thái thanh toán</span>
            <strong>{getPaymentStatusLabel(order.paymentStatus)}</strong>
          </div>
        </div>

        {order.paymentMethod === "cod" && !isCancelled ? (
          <p className={styles.paymentNote}>Bạn sẽ thanh toán khi nhận hàng. Tiny sẽ liên hệ xác nhận trước khi giao.</p>
        ) : null}
        {isBankTransfer && isUnpaid && !payOSEnabled && !isCancelled ? (
          <p className={styles.paymentNote}>Tiny sẽ liên hệ để hướng dẫn thanh toán cho đơn hàng này.</p>
        ) : null}
      </section>

      <section className={styles.itemsCard} aria-labelledby="lookup-items-heading">
        <div className={styles.sectionHeading}>
          <p className={styles.sectionEyebrow}>Chi tiết sản phẩm</p>
          <h3 id="lookup-items-heading">Sản phẩm trong đơn</h3>
        </div>

        <div className={styles.itemList}>
          {order.items.map((item, index) => (
            <article className={styles.item} key={`${item.productName}-${item.variantName}-${index}`}>
              <div className={styles.itemIdentity}>
                <span className={styles.itemNumber} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h4>{item.productName}</h4>
                  <p>
                    {item.variantName}
                    {item.colorCode ? <span> · Mã màu {item.colorCode}</span> : null}
                  </p>
                </div>
              </div>
              <dl className={styles.itemNumbers}>
                <div><dt>Số lượng</dt><dd>{item.quantity}</dd></div>
                <div><dt>Đơn giá</dt><dd>{formatCurrency(item.unitPrice)}</dd></div>
                <div><dt>Thành tiền</dt><dd>{formatCurrency(item.lineTotal)}</dd></div>
              </dl>
            </article>
          ))}
        </div>

        <dl className={styles.totals}>
          <div><dt>Tạm tính sản phẩm</dt><dd>{formatCurrency(order.subtotal)}</dd></div>
          <div><dt>Phí vận chuyển</dt><dd>{formatCurrency(order.shippingFee)}</dd></div>
          <div className={styles.grandTotal}><dt>Tổng thanh toán</dt><dd>{formatCurrency(order.total)}</dd></div>
        </dl>
      </section>

      {showPayOS ? <PayOSPayment orderCode={order.orderCode} /> : null}
    </div>
  );
}

export function OrderLookupPage({ payOSEnabled }: { payOSEnabled: boolean }) {
  const orderCodeRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const [orderCode, setOrderCode] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<CustomerOrderLookup | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function resetResult() {
    setOrder(null);
    setMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) return;

    if (!orderCode.trim() || !phone.trim()) {
      setOrder(null);
      setMessage("Vui lòng nhập đầy đủ mã đơn và số điện thoại đặt hàng.");
      if (!orderCode.trim()) orderCodeRef.current?.focus();
      return;
    }

    setIsLoading(true);
    setMessage("");
    setOrder(null);

    try {
      const response = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ orderCode, phone })
      });
      const result = await response.json().catch(() => ({})) as unknown;

      if (!response.ok) {
        const error = result as LookupApiError;
        throw new Error(error.message || ORDER_LOOKUP_NOT_FOUND_MESSAGE);
      }
      if (!isOrderLookupResult(result)) {
        throw new Error("Tiny chưa thể hiển thị thông tin đơn hàng lúc này. Vui lòng thử lại sau.");
      }

      setOrder(result);
      requestAnimationFrame(() => resultRef.current?.focus());
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Không thể kết nối hệ thống đơn hàng. Vui lòng kiểm tra mạng và thử lại."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.intro} aria-labelledby="order-lookup-heading">
          <div className={styles.introCopy}>
            <p className={styles.eyebrow}>Hỗ trợ đơn hàng</p>
            <h1 id="order-lookup-heading">Tra cứu đơn hàng</h1>
            <p>Nhập mã đơn và số điện thoại đã dùng khi đặt hàng để xem tiến trình mới nhất.</p>
          </div>

          <form className={styles.formCard} onSubmit={handleSubmit} noValidate aria-busy={isLoading}>
            <div className={styles.field}>
              <label htmlFor="lookup-order-code">Mã đơn hàng</label>
              <input
                ref={orderCodeRef}
                id="lookup-order-code"
                name="orderCode"
                type="text"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="TINY-XXXXXXXXXXXX"
                value={orderCode}
                onChange={(event) => {
                  setOrderCode(event.target.value.toUpperCase());
                  resetResult();
                }}
                aria-invalid={Boolean(message)}
                aria-describedby="lookup-order-code-help"
                maxLength={17}
                disabled={isLoading}
                required
              />
              <small id="lookup-order-code-help">Mã đơn được hiển thị sau khi bạn đặt hàng thành công.</small>
            </div>

            <div className={styles.field}>
              <label htmlFor="lookup-phone">Số điện thoại đặt hàng</label>
              <input
                id="lookup-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="Ví dụ: 090 123 4567"
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value);
                  resetResult();
                }}
                aria-invalid={Boolean(message)}
                aria-describedby="lookup-phone-help"
                maxLength={24}
                disabled={isLoading}
                required
              />
              <small id="lookup-phone-help">Có thể nhập với khoảng trắng, dấu chấm hoặc dấu gạch ngang.</small>
            </div>

            <button type="submit" disabled={isLoading} aria-busy={isLoading}>
              {isLoading ? (
                <>
                  <span className={styles.spinner} aria-hidden="true" />
                  Đang tra cứu…
                </>
              ) : "Tra cứu đơn hàng"}
            </button>

            {message ? (
              <p className={styles.feedback} role="alert" aria-live="assertive">{message}</p>
            ) : null}
          </form>
        </section>

        {order ? (
          <div ref={resultRef} className={styles.resultFocus} tabIndex={-1}>
            <OrderResult order={order} payOSEnabled={payOSEnabled} />
          </div>
        ) : null}
      </div>
    </main>
  );
}
