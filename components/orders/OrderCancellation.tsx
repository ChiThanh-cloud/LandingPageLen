"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { siteConfig } from "@/data/site";
import styles from "./OrderCancellation.module.css";

type CancellationApiResponse = {
  status?: string;
  alreadyCancelled?: boolean;
  code?: string;
  message?: string;
};

export function OrderCancellation({
  orderCode,
  canCancel,
  status
}: {
  orderCode: string;
  canCancel: boolean;
  status: string;
}) {
  const router = useRouter();
  const phoneRef = useRef<HTMLInputElement>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [showContact, setShowContact] = useState(false);
  const [cancelled, setCancelled] = useState(status === "cancelled");

  if (!canCancel && !cancelled) return null;

  function openConfirmation() {
    setIsConfirming(true);
    setMessage("");
    setShowContact(false);
    requestAnimationFrame(() => phoneRef.current?.focus());
  }

  function closeConfirmation() {
    if (isSubmitting) return;
    setIsConfirming(false);
    setPhone("");
    setMessage("");
    setShowContact(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const submittedPhone = phone.trim();
    if (!submittedPhone) {
      setMessage("Vui lòng nhập số điện thoại đã dùng khi đặt hàng.");
      phoneRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setShowContact(false);

    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(orderCode)}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: submittedPhone })
      });
      const result = await response.json().catch(() => ({})) as CancellationApiResponse;

      if (!response.ok || result.status !== "cancelled") {
        setMessage(result.message || "Tiny chưa thể hủy đơn lúc này. Vui lòng thử lại sau.");
        setShowContact(
          result.code === "PAID_ORDER_CONTACT_TINY"
          || result.code === "ORDER_NOT_CANCELLABLE"
        );
        return;
      }

      setCancelled(true);
      setPhone("");
      setIsConfirming(false);
      setMessage("Đơn hàng đã được hủy.");
      router.refresh();
    } catch {
      setMessage("Không thể kết nối hệ thống đơn hàng. Vui lòng kiểm tra mạng và thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (cancelled) {
    return (
      <div className={styles.successMessage} role="status" aria-live="polite">
        <strong>Đơn hàng đã được hủy thành công.</strong>
        <p>Cảm ơn bạn đã thông báo cho Tiny.</p>
      </div>
    );
  }

  return (
    <section className={styles.cancellation} aria-labelledby="cancel-order-heading">
      {!isConfirming ? (
        <div className={styles.entryRow}>
          <div>
            <h2 id="cancel-order-heading">Bạn cần thay đổi kế hoạch?</h2>
            <p>Đơn chưa xử lý có thể được hủy sau khi xác minh số điện thoại đặt hàng.</p>
          </div>
          <button type="button" className={styles.openButton} onClick={openConfirmation}>
            Hủy đơn hàng
          </button>
        </div>
      ) : (
        <form className={styles.confirmPanel} onSubmit={handleSubmit} noValidate>
          <div className={styles.confirmHeading}>
            <span aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.4 2.5 17a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.4a2 2 0 0 0-3.4 0Z" />
              </svg>
            </span>
            <div>
              <h2 id="cancel-order-heading">Bạn chắc chắn muốn hủy đơn {orderCode}?</h2>
              <p>Nhập lại số điện thoại đã dùng khi đặt hàng để xác minh.</p>
            </div>
          </div>

          <label className={styles.phoneField}>
            <span>Số điện thoại đặt hàng</span>
            <input
              ref={phoneRef}
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value);
                setMessage("");
                setShowContact(false);
              }}
              aria-invalid={Boolean(message)}
              aria-describedby={message ? "cancel-order-message" : "cancel-order-help"}
              disabled={isSubmitting}
              maxLength={24}
            />
            <small id="cancel-order-help">Có thể nhập với khoảng trắng, dấu chấm hoặc dấu gạch ngang.</small>
          </label>

          {message ? (
            <div id="cancel-order-message" className={styles.feedback} role="alert" aria-live="assertive">
              <p>{message}</p>
              {showContact ? (
                <a href={siteConfig.zaloUrl} target="_blank" rel="noopener noreferrer">
                  Liên hệ Tiny qua Zalo
                </a>
              ) : null}
            </div>
          ) : null}

          <div className={styles.confirmActions}>
            <button type="button" className={styles.keepButton} onClick={closeConfirmation} disabled={isSubmitting}>
              Giữ đơn
            </button>
            <button type="submit" className={styles.cancelButton} disabled={isSubmitting} aria-busy={isSubmitting}>
              {isSubmitting ? "Đang hủy đơn…" : "Xác nhận hủy"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
