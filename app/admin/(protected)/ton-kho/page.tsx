import Image from "next/image";
import Link from "next/link";
import { StockEditor } from "@/components/admin/StockEditor";
import { normalizeAdminPage } from "@/lib/admin/admin-pagination";
import { getAdminInventory } from "@/lib/admin/admin-service";
import styles from "@/components/admin/Admin.module.css";

const movementLabels: Record<string, string> = { payment_sale: "Bán qua chuyển khoản", cod_confirm: "Xác nhận COD", admin_adjustment: "Admin điều chỉnh", admin_restock: "Admin nhập tồn", order_cancel_restore: "Hoàn tồn khi hủy" };

export default async function AdminInventoryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const value = (key: string) => typeof params[key] === "string" ? params[key] : "";
  const productValue = Number.parseInt(value("product"), 10);
  const productId = Number.isInteger(productValue) && productValue > 0 ? productValue : undefined;
  const stockValue = value("stock");
  const stock = ["in-stock", "out-of-stock", "unmanaged"].includes(stockValue)
    ? stockValue as "in-stock" | "out-of-stock" | "unmanaged"
    : "all";
  const query = value("q");
  const result = await getAdminInventory({
    query,
    productId,
    stock,
    page: normalizeAdminPage(value("page")),
    movementPage: normalizeAdminPage(value("movementPage"))
  });
  const { products, variants, movements, pagination, movementPagination } = result;
  const names = new Map(products.map((product) => [String(product.id), product.name]));
  const movementVariants = new Map(movements.map((movement) => [String(movement.variant_id), movement.variant]));

  function pageHref(changes: { page?: number; movementPage?: number }) {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (productId) next.set("product", String(productId));
    if (stock !== "all") next.set("stock", stock);
    const page = changes.page ?? pagination.page;
    const movementPage = changes.movementPage ?? movementPagination.page;
    if (page > 1) next.set("page", String(page));
    if (movementPage > 1) next.set("movementPage", String(movementPage));
    return next.size ? `?${next.toString()}` : "/admin/ton-kho";
  }

  return (
    <div>
      <header className={styles.pageHeader}><div><p className={styles.eyebrow}>Tồn kho</p><h1>Len sợi và mã màu</h1><p>Cập nhật số lượng và theo dõi lịch sử thay đổi tồn kho.</p></div><span className={styles.headerBadge}>{pagination.total} mã màu</span></header>
      <form className={styles.filters} method="get">
        <label>Tìm mã hoặc tên màu<input name="q" type="search" defaultValue={query} /></label>
        <label>Sản phẩm<select name="product" defaultValue={productId ? String(productId) : "all"}><option value="all">Tất cả len sợi</option>{products.map((product) => <option key={String(product.id)} value={String(product.id)}>{product.name || `Sản phẩm ${product.id}`}</option>)}</select></label>
        <label>Tồn kho<select name="stock" defaultValue={stock}><option value="all">Tất cả</option><option value="in-stock">Còn hàng</option><option value="out-of-stock">Hết hàng</option><option value="unmanaged">Chưa quản lý</option></select></label>
        {movementPagination.page > 1 ? <input type="hidden" name="movementPage" value={movementPagination.page} /> : null}
        <button type="submit">Lọc tồn kho</button>
      </form>
      <div className={styles.inventoryGrid}>{variants.map((variant) => <article className={styles.inventoryCard} key={variant.id}><div className={styles.inventoryVisual}>{variant.image_url ? <Image src={variant.image_url} alt="" width={84} height={84} /> : <span className={styles.imagePlaceholder}>Chưa có ảnh</span>}</div><div className={styles.inventoryInfo}><span className={styles.inventoryProduct}>{names.get(String(variant.product_id)) || "Sản phẩm"}</span><strong>{variant.color_name || variant.color_code || variant.name}</strong><span className={variant.stock === null ? styles.stockUnmanaged : styles.stockManaged}>{variant.stock === null ? "Chưa quản lý tồn" : `Còn ${variant.stock.toLocaleString("vi-VN")} cuộn`}</span></div><StockEditor variantId={String(variant.id)} stock={variant.stock} /></article>)}</div>
      {!variants.length ? <p className={styles.empty}>Chưa có mã màu thuộc danh mục len.</p> : null}
      {pagination.totalPages > 1 ? <div className={styles.pagination}>
        {pagination.page > 1 ? <Link href={pageHref({ page: pagination.page - 1 })} prefetch={false} className={styles.pageButton}>&larr; Trang trước</Link> : <span className={`${styles.pageButton} ${styles.disabled}`}>&larr; Trang trước</span>}
        <span className={styles.pageInfo}>Trang {pagination.page} / {pagination.totalPages}</span>
        {pagination.page < pagination.totalPages ? <Link href={pageHref({ page: pagination.page + 1 })} prefetch={false} className={styles.pageButton}>Trang sau &rarr;</Link> : <span className={`${styles.pageButton} ${styles.disabled}`}>Trang sau &rarr;</span>}
      </div> : null}
      <section className={styles.panel}><div className={styles.panelTitleRow}><div><p className={styles.eyebrow}>Nhật ký</p><h2>Lịch sử thay đổi gần đây</h2></div><span>{movementPagination.total} hoạt động</span></div><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Thời gian</th><th>Loại</th><th>Mã màu</th><th>Thay đổi</th><th>Trước → Sau</th><th>Ghi chú</th></tr></thead><tbody>{movements.map((movement) => {
        const variant = movementVariants.get(String(movement.variant_id));
        return <tr key={movement.id}><td>{new Date(movement.created_at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</td><td>{movementLabels[movement.movement_type] || movement.movement_type}</td><td>{variant?.color_name || variant?.color_code || variant?.name || movement.variant_id}</td><td className={styles.numberCell}>{movement.quantity_delta === null ? "—" : movement.quantity_delta > 0 ? `+${movement.quantity_delta}` : movement.quantity_delta}</td><td>{movement.stock_before === null ? "Chưa quản lý" : movement.stock_before} → {movement.stock_after === null ? "Chưa quản lý" : movement.stock_after}</td><td>{movement.note || "—"}</td></tr>;
      })}</tbody></table></div>
      {movementPagination.totalPages > 1 ? <div className={styles.pagination}>
        {movementPagination.page > 1 ? <Link href={pageHref({ movementPage: movementPagination.page - 1 })} prefetch={false} className={styles.pageButton}>&larr; Trang trước</Link> : <span className={`${styles.pageButton} ${styles.disabled}`}>&larr; Trang trước</span>}
        <span className={styles.pageInfo}>Trang {movementPagination.page} / {movementPagination.totalPages}</span>
        {movementPagination.page < movementPagination.totalPages ? <Link href={pageHref({ movementPage: movementPagination.page + 1 })} prefetch={false} className={styles.pageButton}>Trang sau &rarr;</Link> : <span className={`${styles.pageButton} ${styles.disabled}`}>Trang sau &rarr;</span>}
      </div> : null}</section>
    </div>
  );
}
