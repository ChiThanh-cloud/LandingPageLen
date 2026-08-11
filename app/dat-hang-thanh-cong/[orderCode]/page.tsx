import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderCancellation } from "@/components/orders/OrderCancellation";
import { PayOSPayment } from "@/components/payments/PayOSPayment";
import { siteConfig } from "@/data/site";
import {
  getOrderStatusLabel,
  getPaymentMethodLabel,
  getPaymentStatusLabel
} from "@/lib/orders/order-display";
import { getPublicOrderSummary } from "@/lib/orders/order-service";
import styles from "./OrderSuccess.module.css";

export const metadata: Metadata = {
  title: "Đặt hàng thành công",
  description: "Thông tin xác nhận đơn hàng tại Tiệm Len Nhà Tiny.",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

function formatCurrency(value: number) {
  return `${value.toLocaleString("vi-VN")}đ`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

export default async function OrderSuccessPage({
  params
}: {
  params: Promise<{ orderCode: string }>;
}) {
  const { orderCode } = await params;
  const normalizedCode = orderCode.toUpperCase();
  if (!/^TINY-[A-F0-9]{12}$/.test(normalizedCode)) notFound();

  const order = await getPublicOrderSummary(normalizedCode);
  if (!order) notFound();

  const isBankTransfer = order.paymentMethod === "bank_transfer";
  const isCancelled = order.orderStatus === "cancelled";
  const isPaid = order.paymentStatus === "paid";
  const isUnpaid = order.paymentStatus === "unpaid";
  const shippingFeeLabel = order.shippingFee === null
    ? "Chưa xác định"
    : formatCurrency(order.shippingFee);
  const totalLabel = order.total === null
    ? "Chưa xác định"
    : formatCurrency(order.total);

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="order-success-heading">
        <span className={styles.icon} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        <p className={styles.eyebrow}>{isCancelled ? "Trạng thái đơn hàng" : "Tiny đã nhận đơn"}</p>
        <h1 id="order-success-heading">{isCancelled ? "Đơn hàng đã được hủy" : "Đặt hàng thành công"}</h1>
        <p className={styles.intro}>
          {isCancelled
            ? "Đơn hàng của bạn đã được hủy thành công."
            : "Đơn hàng đã được ghi nhận. Tiny sẽ kiểm tra tình trạng sản phẩm và liên hệ xác nhận với bạn."}
        </p>

        <dl className={styles.details}>
          <div><dt>Mã đơn</dt><dd className={styles.orderCode}>{order.orderCode}</dd></div>
          <div><dt>Trạng thái đơn hàng</dt><dd>{getOrderStatusLabel(order.orderStatus)}</dd></div>
          <div><dt>Tạm tính sản phẩm</dt><dd>{formatCurrency(order.subtotal)}</dd></div>
          <div><dt>Phí vận chuyển</dt><dd>{shippingFeeLabel}</dd></div>
          <div><dt>Tổng thanh toán</dt><dd>{totalLabel}</dd></div>
          <div><dt>Phương thức thanh toán</dt><dd>{getPaymentMethodLabel(order.paymentMethod)}</dd></div>
          <div><dt>Trạng thái thanh toán</dt><dd>{getPaymentStatusLabel(order.paymentStatus)}</dd></div>
        </dl>

        {isCancelled ? (
          <div className={styles.notice} role="status">
            <strong>Đơn hàng đã được hủy thành công.</strong>
            <p>Cảm ơn bạn đã thông báo cho Tiny. Nếu sản phẩm vẫn còn hàng, bạn có thể đặt lại bất cứ lúc nào.</p>
          </div>
        ) : null}

        {isPaid && !isCancelled ? (
          <div className={styles.notice}>
            <strong>Đơn hàng đã được thanh toán</strong>
            <p>Vui lòng liên hệ Tiny nếu bạn cần hỗ trợ hủy hoặc hoàn tiền.</p>
            <p><a href={siteConfig.zaloUrl} target="_blank" rel="noopener noreferrer">Liên hệ Tiny qua Zalo</a></p>
          </div>
        ) : null}

        {order.stockConfirmationRequired ? (
          <div className={styles.notice}>
            <strong>Chờ Tiny xác nhận tình trạng sản phẩm</strong>
            <p>Tiny sẽ kiểm tra một số sản phẩm trong đơn và xác nhận với bạn.</p>
          </div>
        ) : null}

        {!isCancelled && isUnpaid && isBankTransfer ? (
          <>
            <PayOSPayment orderCode={order.orderCode} />
            {order.reservationExpiresAt ? (
              <div className={styles.notice}>
                <strong>Thời gian giữ sản phẩm</strong>
                <p>
                  Tiny tạm giữ các sản phẩm đủ điều kiện đến <b>{formatTime(order.reservationExpiresAt)}</b>.
                  Nếu chưa thanh toán trước thời điểm này, thời gian giữ hàng sẽ kết thúc.
                </p>
              </div>
            ) : null}
          </>
        ) : !isCancelled && isUnpaid ? (
          <div className={styles.notice}>
            <strong>Thanh toán khi nhận hàng (COD)</strong>
            <p>Tiny sẽ liên hệ để xác nhận đơn hàng và tình trạng sản phẩm.</p>
          </div>
        ) : null}

        {order.shippingFee === null || order.total === null ? (
          <p className={styles.finalTotalNote}>Tiny sẽ liên hệ để xác nhận tổng thanh toán của đơn hàng này.</p>
        ) : null}

        {order.canCancel ? (
          <OrderCancellation
            orderCode={order.orderCode}
            canCancel={order.canCancel}
            status={order.orderStatus}
          />
        ) : null}

        <div className={styles.actions}>
          <Link href="/len-soi" className={styles.primaryAction}>Tiếp tục mua len</Link>
          <Link href="/" className={styles.secondaryAction}>Về trang chủ</Link>
        </div>
      </section>
    </main>
  );
}
