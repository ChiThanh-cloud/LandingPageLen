import Image from "next/image";
import { StockEditor } from "@/components/admin/StockEditor";
import { getAdminInventory } from "@/lib/admin/admin-service";
import styles from "@/components/admin/Admin.module.css";

const movementLabels: Record<string, string> = { payment_sale: "Bán qua chuyển khoản", cod_confirm: "Xác nhận COD", admin_adjustment: "Admin điều chỉnh", admin_restock: "Admin nhập tồn", order_cancel_restore: "Hoàn tồn khi hủy" };

export default async function AdminInventoryPage() {
  const { products, variants, movements } = await getAdminInventory();
  const names = new Map(products.map((product) => [String(product.id), product.name]));
  return (
    <div>
      <header className={styles.pageHeader}><div><p className={styles.eyebrow}>Tồn kho</p><h1>Len sợi và mã màu</h1><p>Cập nhật số lượng và theo dõi lịch sử thay đổi tồn kho.</p></div><span className={styles.headerBadge}>{variants.length} mã màu</span></header>
      <div className={styles.inventoryGrid}>{variants.map((variant) => <article className={styles.inventoryCard} key={variant.id}><div className={styles.inventoryVisual}>{variant.image_url ? <Image src={variant.image_url} alt="" width={84} height={84} /> : <span className={styles.imagePlaceholder}>Chưa có ảnh</span>}</div><div className={styles.inventoryInfo}><span className={styles.inventoryProduct}>{names.get(String(variant.product_id)) || "Sản phẩm"}</span><strong>{variant.color_name || variant.color_code || variant.name}</strong><span className={variant.stock === null ? styles.stockUnmanaged : styles.stockManaged}>{variant.stock === null ? "Chưa quản lý tồn" : `Còn ${variant.stock.toLocaleString("vi-VN")} cuộn`}</span></div><StockEditor variantId={String(variant.id)} stock={variant.stock} /></article>)}</div>
      {!variants.length ? <p className={styles.empty}>Chưa có mã màu thuộc danh mục len.</p> : null}
      <section className={styles.panel}><div className={styles.panelTitleRow}><div><p className={styles.eyebrow}>Nhật ký</p><h2>Lịch sử thay đổi gần đây</h2></div><span>{movements.length} hoạt động</span></div><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Thời gian</th><th>Loại</th><th>Mã màu</th><th>Thay đổi</th><th>Trước → Sau</th><th>Ghi chú</th></tr></thead><tbody>{movements.map((movement) => <tr key={movement.id}><td>{new Date(movement.created_at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</td><td>{movementLabels[movement.movement_type] || movement.movement_type}</td><td>{variants.find((variant) => String(variant.id) === String(movement.variant_id))?.color_name || variants.find((variant) => String(variant.id) === String(movement.variant_id))?.color_code || movement.variant_id}</td><td className={styles.numberCell}>{movement.quantity_delta === null ? "—" : movement.quantity_delta > 0 ? `+${movement.quantity_delta}` : movement.quantity_delta}</td><td>{movement.stock_before === null ? "Chưa quản lý" : movement.stock_before} → {movement.stock_after === null ? "Chưa quản lý" : movement.stock_after}</td><td>{movement.note || "—"}</td></tr>)}</tbody></table></div></section>
    </div>
  );
}
