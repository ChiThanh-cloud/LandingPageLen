"use client";

import { useActionState } from "react";
import { loginAdmin, type AdminLoginState } from "@/app/admin/login/actions";
import styles from "./Admin.module.css";

const initialState: AdminLoginState = { message: "" };

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(loginAdmin, initialState);
  return (
    <form action={action} className={styles.loginForm} aria-busy={pending}>
      <label htmlFor="admin-email">Email</label>
      <input id="admin-email" name="email" type="email" autoComplete="email" required disabled={pending} />
      <label htmlFor="admin-password">Mật khẩu</label>
      <input id="admin-password" name="password" type="password" autoComplete="current-password" required disabled={pending} />
      {state.message ? <p className={styles.error} role="alert">{state.message}</p> : null}
      <button type="submit" disabled={pending}>{pending ? "Đang đăng nhập…" : "Đăng nhập"}</button>
    </form>
  );
}

