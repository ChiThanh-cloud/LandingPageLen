import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { getVerifiedAdmin } from "@/lib/admin/auth";
import styles from "@/components/admin/Admin.module.css";

export default async function AdminLoginPage() {
  if (await getVerifiedAdmin()) redirect("/admin");
  return (
    <main className={styles.loginPage}>
      <section className={styles.loginCard} aria-labelledby="admin-login-heading">
        <p className={styles.eyebrow}>Tiny Admin</p>
        <h1 id="admin-login-heading">Đăng nhập quản trị</h1>
        <p>Quản lý sản phẩm, đơn hàng và tồn kho của Tiệm Len Nhà Tiny.</p>
        <AdminLoginForm />
      </section>
    </main>
  );
}

