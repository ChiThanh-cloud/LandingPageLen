"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import styles from "./PayOSPayment.module.css";

type PaymentResponse = {
  orderCode: string;
  amount: number;
  status: "pending";
  checkoutUrl: string;
  qrDataUrl: string;
  statusToken: string;
};

type PaymentPhase = "idle" | "loading" | "pending" | "paid" | "cancelled" | "error";

function formatCurrency(value: number) {
  return `${value.toLocaleString("vi-VN")}đ`;
}

function isPaymentResponse(value: unknown): value is PaymentResponse {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PaymentResponse>;
  return typeof candidate.orderCode === "string"
    && typeof candidate.amount === "number"
    && candidate.amount > 0
    && candidate.status === "pending"
    && typeof candidate.checkoutUrl === "string"
    && candidate.checkoutUrl.startsWith("https://")
    && typeof candidate.qrDataUrl === "string"
    && candidate.qrDataUrl.startsWith("data:image/png;base64,")
    && typeof candidate.statusToken === "string";
}

export function PayOSPayment({ orderCode }: { orderCode: string }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [phase, setPhase] = useState<PaymentPhase>("idle");
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (phase !== "pending" || !payment) return;

    let stopped = false;
    let checking = false;
    const checkStatus = async () => {
      if (checking || stopped) return;
      checking = true;
      try {
        const response = await fetch(
          `/api/orders/${encodeURIComponent(orderCode)}/payment-status?token=${encodeURIComponent(payment.statusToken)}`,
          { cache: "no-store" }
        );
        if (!response.ok || stopped) return;
        const result = await response.json() as { status?: string };
        if (result.status === "paid") {
          setPhase("paid");
          setMessage("Đơn hàng đã được thanh toán.");
          router.refresh();
        } else if (result.status === "cancelled") {
          setPhase("cancelled");
          setMessage("Đơn hàng đã được hủy.");
        }
      } catch {
        // A later polling cycle retries transient network errors.
      } finally {
        checking = false;
      }
    };

    const interval = window.setInterval(checkStatus, 6000);
    void checkStatus();
    return () => {
      stopped = true;
      window.clearInterval(interval);
    };
  }, [orderCode, payment, phase, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (phase === "loading") return;

    setPhase("loading");
    setMessage("");
    try {
      const response = await fetch("/api/payments/payos/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderCode, phone })
      });
      const result = await response.json() as unknown;

      if (!response.ok) {
        const error = result as { code?: string; message?: string };
        if (error.code === "ORDER_ALREADY_PAID") {
          setPhase("paid");
          setMessage("Đơn hàng đã được thanh toán.");
          router.refresh();
          return;
        }
        throw new Error(error.message || "Chưa thể tạo mã thanh toán. Vui lòng thử lại.");
      }

      if (!isPaymentResponse(result)) {
        throw new Error("Chưa thể tạo mã thanh toán. Vui lòng thử lại.");
      }

      setPayment(result);
      setPhone("");
      setPhase("pending");
      setMessage("Đang chờ thanh toán");
    } catch (error) {
      setPhase("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Chưa thể tạo mã thanh toán. Vui lòng thử lại."
      );
    }
  }

  return (
    <section className={styles.payment} aria-labelledby="payment-heading">
      <div className={styles.headingRow}>
        <div>
          <p className={styles.eyebrow}>Chuyển khoản ngân hàng</p>
          <h2 id="payment-heading">
            {phase === "paid" ? "Đã thanh toán" : "Chờ thanh toán"}
          </h2>
        </div>
        <span className={styles.status} data-state={phase}>
          {phase === "paid" ? "Đã thanh toán" : "Đang chờ thanh toán"}
        </span>
      </div>

      {!payment && phase !== "paid" && phase !== "cancelled" ? (
        <form className={styles.form} onSubmit={handleSubmit} aria-busy={phase === "loading"}>
          <p className={styles.helper}>
            Nhập lại số điện thoại dùng khi đặt hàng để mở mã thanh toán an toàn.
          </p>
          <label htmlFor={`payment-phone-${orderCode}`}>Số điện thoại đặt hàng</label>
          <div className={styles.formRow}>
            <input
              id={`payment-phone-${orderCode}`}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Ví dụ: 090 123 4567"
              maxLength={24}
              required
              disabled={phase === "loading"}
            />
            <button type="submit" disabled={phase === "loading"}>
              {phase === "loading" ? "Đang tạo mã…" : "Thanh toán ngay"}
            </button>
          </div>
        </form>
      ) : null}

      {payment && phase !== "paid" && phase !== "cancelled" ? (
        <div className={styles.qrPanel}>
          <div className={styles.qrFrame}>
            <Image
              src={payment.qrDataUrl}
              alt={`Mã QR thanh toán cho đơn ${payment.orderCode}`}
              width={360}
              height={360}
              unoptimized
              priority
            />
          </div>
          <div className={styles.paymentDetails}>
            <p className={styles.qrTitle}>Quét mã QR để thanh toán</p>
            <dl>
              <div><dt>Mã đơn</dt><dd>{payment.orderCode}</dd></div>
              <div><dt>Số tiền</dt><dd>{formatCurrency(payment.amount)}</dd></div>
            </dl>
            <p className={styles.qrNote}>
              Mã QR đã có sẵn số tiền và nội dung chuyển khoản. Bạn không cần nhập lại.
            </p>
            <a href={payment.checkoutUrl} target="_blank" rel="noopener noreferrer">
              Mở trang thanh toán
            </a>
          </div>
        </div>
      ) : null}

      {message ? (
        <p
          className={styles.feedback}
          data-state={phase}
          role={phase === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}

