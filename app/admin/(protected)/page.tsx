import Link from "next/link";
import { AdminIcon, type AdminIconName } from "@/components/admin/AdminIcon";
import { getAdminDashboard } from "@/lib/admin/admin-service";
import styles from "@/components/admin/Admin.module.css";

function formatCurrency(value: number) {
  return `${value.toLocaleString("vi-VN")}đ`;
}

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboard();
  const cards: Array<{ label: string; value: number; description: string; icon: AdminIconName; tone: string }> = [
    { label: "Chờ xác nhận", value: stats.pendingConfirmation, description: "Đơn cần Tiny kiểm tra", icon: "clock", tone: "toneAmber" },
    { label: "Chờ thanh toán", value: stats.pendingPayment, description: "Đang đợi khách chuyển khoản", icon: "wallet", tone: "toneBlue" },
    { label: "Đã xác nhận", value: stats.confirmed, description: "Sẵn sàng để giao", icon: "check", tone: "toneTeal" },
    { label: "Đang giao", value: stats.shipping, description: "Đơn đang trên đường", icon: "truck", tone: "toneViolet" },
    { label: "Đã thanh toán", value: stats.paid, description: "Đã ghi nhận thanh toán", icon: "wallet", tone: "toneGreen" },
    { label: "Hoàn thành", value: stats.completed, description: "Đơn đã hoàn tất", icon: "check", tone: "toneNavy" },
    { label: "Đã hủy", value: stats.cancelled, description: "Đơn không tiếp tục xử lý", icon: "cancel", tone: "toneRose" }
  ];
  return (
    <div className={styles.dashboardPage}>
      <header className={styles.pageHeader}>
        <div><p className={styles.eyebrow}>Tổng quan</p><h1>Chào Tiny, hôm nay thế nào?</h1><p>Theo dõi đơn hàng và những việc cần ưu tiên trong một màn hình.</p></div>
        <Link href="/admin/don-hang" prefetch={false} className={styles.primaryLink}>Xem tất cả đơn hàng <span aria-hidden="true">→</span></Link>
      </header>
      <section className={styles.summaryGrid} aria-label="Tổng quan đơn hàng">
        {cards.map((card) => (
          <article className={`${styles.kpiCard} ${styles[card.tone]}`} key={card.label}>
            <span className={styles.kpiIcon}><AdminIcon name={card.icon} /></span>
            <span className={styles.kpiLabel}>{card.label}</span>
            <strong>{card.value.toLocaleString("vi-VN")}</strong>
            <small>{card.description}</small>
          </article>
        ))}
      </section>

      <div className={styles.dashboardLowerGrid}>
        <section className={styles.dashboardPanel} aria-labelledby="tasks-heading">
          <div className={styles.panelHeader}><div><p className={styles.eyebrow}>Ưu tiên</p><h2 id="tasks-heading">Việc cần xử lý</h2></div><Link href="/admin/don-hang" prefetch={false}>Mở danh sách</Link></div>
          <div className={styles.taskList}>
            <Link href="/admin/don-hang?status=pending_confirmation" prefetch={false}>
              <span className={`${styles.taskIcon} ${styles.toneAmber}`}><AdminIcon name="alert" /></span>
              <span><strong>Xác nhận đơn mới</strong><small>Kiểm tra thông tin khách và tình trạng sản phẩm.</small></span>
              <b>{stats.pendingConfirmation}</b><span aria-hidden="true">→</span>
            </Link>
            <Link href="/admin/don-hang?status=pending_payment" prefetch={false}>
              <span className={`${styles.taskIcon} ${styles.toneBlue}`}><AdminIcon name="clock" /></span>
              <span><strong>Theo dõi thanh toán</strong><small>Các đơn chuyển khoản vẫn đang chờ thanh toán.</small></span>
              <b>{stats.pendingPayment}</b><span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>

        <section className={styles.dashboardPanel} aria-labelledby="today-heading">
          <div className={styles.panelHeader}><div><p className={styles.eyebrow}>Trong ngày</p><h2 id="today-heading">Tình trạng hôm nay</h2></div></div>
          <div className={styles.todayStats}>
            <article><span className={`${styles.taskIcon} ${styles.toneTeal}`}><AdminIcon name="orders" /></span><div><span>Đơn mới hôm nay</span><strong>{stats.ordersToday.toLocaleString("vi-VN")}</strong></div></article>
            <article><span className={`${styles.taskIcon} ${styles.toneGreen}`}><AdminIcon name="wallet" /></span><div><span>Doanh thu đã thanh toán</span><strong>{formatCurrency(stats.paidRevenueToday)}</strong></div></article>
          </div>
        </section>
      </div>
    </div>
  );
}
