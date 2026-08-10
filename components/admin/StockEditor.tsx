"use client";

import { useActionState, useState } from "react";
import { adjustStockAction, type AdminActionState } from "@/app/admin/(protected)/actions";
import styles from "./Admin.module.css";

const initial: AdminActionState = { ok: false, message: "" };

export function StockEditor({ variantId, stock }: { variantId: string; stock: number | null }) {
  const [state, action, pending] = useActionState(adjustStockAction, initial);
  const [value, setValue] = useState(stock === null ? "" : String(stock));
  const [confirmUnmanaged, setConfirmUnmanaged] = useState(false);
  const removingTracking = stock !== null && value === "";

  return (
    <form
      action={action}
      className={styles.stockForm}
      onSubmit={(event) => {
        if (removingTracking && !confirmUnmanaged) {
          event.preventDefault();
          setConfirmUnmanaged(true);
        }
      }}
    >
      <input type="hidden" name="variantId" value={variantId} />
      <label className={styles.srOnly} htmlFor={`stock-${variantId}`}>Tồn kho</label>
      <div className={styles.stockControl}>
        <button type="button" disabled={pending || value === "" || Number(value) <= 0} onClick={() => setValue(String(Math.max(0, Number(value) - 1)))} aria-label="Giảm tồn kho">−</button>
        <input
          id={`stock-${variantId}`}
          name="stock"
          type="number"
          inputMode="numeric"
          min="0"
          value={value}
          placeholder="Chưa quản lý"
          onChange={(event) => {
            setValue(event.target.value);
            setConfirmUnmanaged(false);
          }}
          disabled={pending}
        />
        <button type="button" disabled={pending} onClick={() => setValue(String((value === "" ? 0 : Number(value)) + 1))} aria-label="Tăng tồn kho">+</button>
      </div>
      <input name="reason" type="text" maxLength={500} placeholder="Lý do điều chỉnh (không bắt buộc)" disabled={pending} />
      {confirmUnmanaged ? <p className={styles.warning}>Việc này sẽ chuyển mã màu sang “Chưa quản lý tồn”. Bấm lưu lần nữa để xác nhận.</p> : null}
      <button type="submit" disabled={pending}>{pending ? "Đang lưu…" : confirmUnmanaged ? "Xác nhận bỏ quản lý tồn" : "Lưu tồn kho"}</button>
      {state.message ? <p className={state.ok ? styles.success : styles.error} role="status">{state.message}</p> : null}
    </form>
  );
}

