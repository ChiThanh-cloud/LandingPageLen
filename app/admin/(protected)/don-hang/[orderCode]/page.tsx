import { notFound } from "next/navigation";
import { AdminOrderActions } from "@/components/admin/AdminOrderActions";
import { getAdminOrder } from "@/lib/admin/admin-service";
import { getOrderStatusLabel, getPaymentMethodLabel, getPaymentStatusLabel } from "@/lib/orders/order-display";
import styles from "@/components/admin/Admin.module.css";

const money = (value: number | string | null) => value === null ? "Chưa xác định" : `${Number(value).toLocaleString("vi-VN")}đ`;

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ orderCode: string }> }) {
  const { orderCode } = await params;
  if (!/^TINY-[A-F0-9]{12}$/i.test(orderCode)) notFound();
  const order = await getAdminOrder(orderCode.toUpperCase());
  if (!order) notFound();
  return (
    <div>
      <header className={styles.pageHeader}><div><p className={styles.eyebrow}>Chi tiết đơn hàng</p><h1>{order.order_code}</h1><p>Đặt lúc {new Date(order.created_at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</p></div><span className={styles.headerBadge}>{getOrderStatusLabel(order.order_status)}</span></header>
      {order.inventory_attention_required ? <div className={styles.warningBox}><strong>Cần kiểm tra tồn kho</strong><p>Một hoặc nhiều mã màu chưa quản lý tồn hoặc không đủ số lượng khi hệ thống xử lý.</p></div> : null}
      <div className={styles.detailGrid}>
        <section className={styles.panel}><h2>Thông tin khách hàng</h2><dl className={styles.detailList}><div><dt>Họ tên</dt><dd>{order.customer_name}</dd></div><div><dt>Điện thoại</dt><dd>{order.phone}</dd></div><div><dt>Email</dt><dd>{order.email || "Không có"}</dd></div><div><dt>Địa chỉ giao</dt><dd>{order.address_line}, {order.ward}, {order.district}, {order.province}</dd></div><div><dt>Ghi chú</dt><dd>{order.shipping_note || "Không có"}</dd></div></dl></section>
        <section className={styles.panel}><h2>Thanh toán & trạng thái</h2><dl className={styles.detailList}><div><dt>Phương thức</dt><dd>{getPaymentMethodLabel(order.payment_method)}</dd></div><div><dt>Thanh toán</dt><dd><span className={styles.statusBadge}>{getPaymentStatusLabel(order.payment_status)}</span></dd></div><div><dt>Trạng thái đơn</dt><dd><span className={styles.statusBadge}>{getOrderStatusLabel(order.order_status)}</span></dd></div><div><dt>Tạm tính</dt><dd>{money(order.subtotal)}</dd></div><div><dt>Phí vận chuyển</dt><dd>{money(order.shipping_fee)}</dd></div><div><dt>Tổng thanh toán</dt><dd><strong>{money(order.total)}</strong></dd></div></dl></section>
      </div>
      <section className={styles.panel}><div className={styles.panelTitleRow}><h2>Sản phẩm</h2><span>{order.order_items.length} dòng</span></div><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Sản phẩm</th><th>Màu / mã</th><th>Số lượng</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead><tbody>{order.order_items.map((item) => <tr key={item.id}><td><strong>{item.product_name_snapshot}</strong></td><td>{item.variant_name_snapshot}{item.color_code_snapshot ? ` · ${item.color_code_snapshot}` : ""}</td><td>{item.quantity}</td><td>{money(item.unit_price)}</td><td className={styles.numberCell}>{money(item.line_total)}</td></tr>)}</tbody></table></div></section>
      <AdminOrderActions orderCode={order.order_code} orderStatus={order.order_status} paymentStatus={order.payment_status} />
    </div>
  );
}
