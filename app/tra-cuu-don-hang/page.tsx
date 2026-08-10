import type { Metadata } from "next";
import { OrderLookupPage } from "./OrderLookupPage";
import { isPayOSConfigured } from "@/lib/payments/payos-client";

export const metadata: Metadata = {
  title: "Tra cứu đơn hàng",
  description: "Tra cứu trạng thái đơn hàng tại Tiệm Len Nhà Tiny bằng mã đơn và số điện thoại đặt hàng.",
  robots: { index: false, follow: false }
};

export default function CustomerOrderLookupPage() {
  return <OrderLookupPage payOSEnabled={isPayOSConfigured()} />;
}
