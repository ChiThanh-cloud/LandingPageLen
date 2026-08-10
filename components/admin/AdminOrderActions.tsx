"use client";

import { useActionState, useState } from "react";
import {
  cancelOrderAction,
  confirmOrderAction,
  transitionOrderAction,
  type AdminActionState
} from "@/app/admin/(protected)/actions";
import styles from "./Admin.module.css";

const initial: AdminActionState = { ok: false, message: "" };

export function AdminOrderActions({
  orderCode,
  orderStatus,
  paymentStatus
}: {
  orderCode: string;
  orderStatus: string;
  paymentStatus: string;
}) {
  const [confirmState, confirmAction, confirming] = useActionState(confirmOrderAction, initial);
  const [transitionState, transitionAction, transitioning] = useActionState(transitionOrderAction, initial);
  const [cancelState, cancelAction, cancelling] = useActionState(cancelOrderAction, initial);
  const [showCancellation, setShowCancellation] = useState(false);
  const canConfirm = ["pending_confirmation", "pending_payment"].includes(orderStatus);
  const canCancel = ["pending_confirmation", "pending_payment", "confirmed"].includes(orderStatus);
  const nextStatus = orderStatus === "confirmed"
    ? "shipping"
    : orderStatus === "shipping"
      ? "completed"
      : null;

  return (
    <section className={styles.actionPanel} aria-labelledby="order-actions-heading">
      <h2 id="order-actions-heading">Xử lý đơn hàng</h2>
      <div className={styles.actionRow}>
        {canConfirm ? (
          <form action={confirmAction}>
            <input type="hidden" name="orderCode" value={orderCode} />
            <button type="submit" disabled={confirming}>{confirming ? "Đang xác nhận…" : "Xác nhận đơn"}</button>
          </form>
        ) : null}
        {nextStatus ? (
          <form action={transitionAction}>
            <input type="hidden" name="orderCode" value={orderCode} />
            <input type="hidden" name="nextStatus" value={nextStatus} />
            <button type="submit" disabled={transitioning}>
              {transitioning ? "Đang cập nhật…" : nextStatus === "shipping" ? "Đang giao" : "Hoàn thành"}
            </button>
          </form>
        ) : null}
        {canCancel && !showCancellation ? (
          <button type="button" className={styles.dangerButton} onClick={() => setShowCancellation(true)}>Hủy đơn</button>
        ) : null}
      </div>

      {showCancellation ? (
        <form action={cancelAction} className={styles.confirmBox}>
          <strong>Bạn chắc chắn muốn hủy đơn {orderCode}?</strong>
          {paymentStatus === "paid" ? (
            <p className={styles.warning}>Đơn này đã thanh toán. Hủy đơn không tự động hoàn tiền.</p>
          ) : null}
          <label htmlFor="admin-cancel-note">Ghi chú nội bộ</label>
          <textarea id="admin-cancel-note" name="note" maxLength={500} />
          <input type="hidden" name="orderCode" value={orderCode} />
          <div className={styles.actionRow}>
            <button type="button" className={styles.secondaryButton} disabled={cancelling} onClick={() => setShowCancellation(false)}>Giữ đơn</button>
            <button type="submit" className={styles.dangerButton} disabled={cancelling}>{cancelling ? "Đang hủy…" : "Xác nhận hủy"}</button>
          </div>
        </form>
      ) : null}

      {[confirmState, transitionState, cancelState].map((state, index) => state.message ? (
        <p key={index} className={state.ok ? styles.success : styles.error} role="status">{state.message}</p>
      ) : null)}
    </section>
  );
}

