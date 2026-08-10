import Link from "next/link";
import { getAdminOrders } from "@/lib/admin/admin-service";
import { getOrderStatusLabel, getPaymentMethodLabel, getPaymentStatusLabel } from "@/lib/orders/order-display";
import styles from "@/components/admin/Admin.module.css";

function formatCurrency(value: number | string | null) {
  return value === null ? "Chưa xác định" : `${Number(value).toLocaleString("vi-VN")}đ`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const value = (key: string) => typeof params[key] === "string" ? params[key] : "";
  const orders = await getAdminOrders({ query: value("q"), status: value("status"), paymentMethod: value("method"), paymentStatus: value("payment") });
  return (
    <div>
      <header className={styles.pageHeader}><div><p className={styles.eyebrow}>Đơn hàng</p><h1>Danh sách đơn</h1><p>Tìm kiếm, lọc và theo dõi toàn bộ đơn hàng của Tiny.</p></div><span className={styles.headerBadge}>{orders.length} đơn</span></header>
      <form className={styles.filters} method="get">
        <label>Tìm mã đơn hoặc khách<input name="q" type="search" defaultValue={value("q")} /></label>
        <label>Trạng thái<select name="status" defaultValue={value("status") || "all"}><option value="all">Tất cả</option><option value="pending_confirmation">Chờ xác nhận</option><option value="pending_payment">Chờ thanh toán</option><option value="confirmed">Đã xác nhận</option><option value="shipping">Đang giao</option><option value="completed">Hoàn thành</option><option value="cancelled">Đã hủy</option></select></label>
        <label>Phương thức<select name="method" defaultValue={value("method") || "all"}><option value="all">Tất cả</option><option value="cod">COD</option><option value="bank_transfer">Chuyển khoản</option></select></label>
        <label>Thanh toán<select name="payment" defaultValue={value("payment") || "all"}><option value="all">Tất cả</option><option value="unpaid">Chưa thanh toán</option><option value="paid">Đã thanh toán</option><option value="failed">Chưa thành công</option><option value="refunded">Đã hoàn tiền</option></select></label>
        <button type="submit">Lọc đơn</button>
      </form>
      <div className={styles.tableWrap}>
        <table className={`${styles.table} ${styles.ordersTable}`}>
          <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Ngày đặt</th><th>Tổng</th><th>Phương thức</th><th>Thanh toán</th><th>Trạng thái</th></tr></thead>
          <tbody>{orders.map((order) => <tr key={order.id} className={order.inventory_attention_required ? styles.attentionRow : undefined}><td data-label="Mã đơn"><Link href={`/admin/don-hang/${order.order_code}`}>{order.order_code}</Link></td><td data-label="Khách hàng">{order.customer_name}</td><td data-label="Ngày đặt">{formatDate(order.created_at)}</td><td data-label="Tổng" className={styles.numberCell}>{formatCurrency(order.total)}</td><td data-label="Phương thức">{getPaymentMethodLabel(order.payment_method)}</td><td data-label="Thanh toán"><span className={styles.statusBadge}>{getPaymentStatusLabel(order.payment_status)}</span></td><td data-label="Trạng thái"><span className={styles.statusBadge}>{getOrderStatusLabel(order.order_status)}</span>{order.inventory_attention_required ? <small className={styles.rowWarning}>Cần kiểm tra tồn</small> : null}</td></tr>)}</tbody>
        </table>
        {!orders.length ? <p className={styles.empty}>Chưa có đơn hàng phù hợp.</p> : null}
      </div>
    </div>
  );
}
