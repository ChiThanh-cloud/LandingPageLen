import Link from "next/link";
import { ProductManager } from "@/components/admin/ProductManager";
import styles from "@/components/admin/Admin.module.css";
import { normalizeAdminPage } from "@/lib/admin/admin-pagination";
import { getAdminProducts } from "@/lib/admin/admin-service";

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const value = (key: string) => typeof params[key] === "string" ? params[key] : "";
  const editValue = Number.parseInt(value("edit"), 10);
  const editId = Number.isInteger(editValue) && editValue > 0 ? editValue : undefined;
  const query = value("q");
  const category = value("category") || "all";
  const result = await getAdminProducts({ query, category, page: normalizeAdminPage(value("page")), editId });

  const newProductParams = new URLSearchParams();
  if (query) newProductParams.set("q", query);
  if (category !== "all") newProductParams.set("category", category);
  if (result.pagination.page > 1) newProductParams.set("page", String(result.pagination.page));
  const newProductHref = newProductParams.size ? `?${newProductParams.toString()}` : "/admin/san-pham";

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Catalog</p>
          <h1>Sản phẩm</h1>
          <p>Quản lý catalog hiện có; tồn kho len sợi được điều chỉnh riêng ở trang Tồn kho.</p>
        </div>
        <Link href={newProductHref} prefetch={false} className={styles.primaryLink}>Sản phẩm mới</Link>
      </header>
      <ProductManager
        key={editId ? `edit-${editId}` : "new"}
        products={result.products}
        selectedProduct={result.selectedProduct}
        variants={result.variants}
        filters={{ query, category }}
        pagination={result.pagination}
      />
    </>
  );
}
