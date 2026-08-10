import { ProductManager } from "@/components/admin/ProductManager";
import styles from "@/components/admin/Admin.module.css";
import { getAdminProducts } from "@/lib/admin/admin-service";

export default async function AdminProductsPage() {
  const { products, variants } = await getAdminProducts();
  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Catalog</p>
          <h1>Sản phẩm</h1>
          <p>Quản lý catalog hiện có; tồn kho len sợi được điều chỉnh riêng ở trang Tồn kho.</p>
        </div>
      </header>
      <ProductManager products={products} variants={variants} />
    </>
  );
}
