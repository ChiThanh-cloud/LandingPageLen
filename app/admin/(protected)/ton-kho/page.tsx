import { InventoryCatalog } from "@/components/admin/InventoryCatalog";
import { getAdminInventory } from "@/lib/admin/admin-service";
import { getInventoryOptionLabel, getInventoryVariantValue } from "@/lib/admin/inventory-presentation";
import styles from "@/components/admin/Admin.module.css";

const movementLabels: Record<string, string> = { payment_sale: "Bán qua chuyển khoản", cod_confirm: "Xác nhận COD", admin_adjustment: "Admin điều chỉnh", admin_restock: "Admin nhập tồn", order_cancel_restore: "Hoàn tồn khi hủy" };

export default async function AdminInventoryPage() {
  const { products, variants, movements } = await getAdminInventory();
  const productsById = new Map(products.map((product) => [String(product.id), product]));
  const variantsById = new Map(variants.map((variant) => [String(variant.id), variant]));
  return (
    <div>
      <header className={styles.pageHeader}><div><p className={styles.eyebrow}>Tồn kho</p><h1>Tồn kho</h1><p>Quản lý tồn kho len sợi và phụ kiện.</p></div><span className={styles.headerBadge}>{variants.length} SKU</span></header>
      <InventoryCatalog products={products} variants={variants} />
      <section className={styles.panel}><div className={styles.panelTitleRow}><div><p className={styles.eyebrow}>Nhật ký</p><h2>Lịch sử thay đổi gần đây</h2></div><span>{movements.length} hoạt động</span></div><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Thời gian</th><th>Loại</th><th>Lựa chọn / SKU</th><th>Thay đổi</th><th>Trước → Sau</th><th>Ghi chú</th></tr></thead><tbody>{movements.map((movement) => {
        const variant = variantsById.get(String(movement.variant_id));
        const product = variant ? productsById.get(String(variant.product_id)) : undefined;
        const optionLabel = getInventoryOptionLabel(product || { category: null, unit_label: null, option_label: null });
        return <tr key={movement.id}><td>{new Date(movement.created_at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</td><td>{movementLabels[movement.movement_type] || movement.movement_type}</td><td>{variant ? `${optionLabel}: ${getInventoryVariantValue(product || { category: null }, variant)}${variant.sku ? ` · ${variant.sku}` : ""}` : movement.variant_id}</td><td className={styles.numberCell}>{movement.quantity_delta === null ? "—" : movement.quantity_delta > 0 ? `+${movement.quantity_delta}` : movement.quantity_delta}</td><td>{movement.stock_before === null ? "Chưa quản lý" : movement.stock_before} → {movement.stock_after === null ? "Chưa quản lý" : movement.stock_after}</td><td>{movement.note || "—"}</td></tr>;
      })}</tbody></table></div></section>
    </div>
  );
}
