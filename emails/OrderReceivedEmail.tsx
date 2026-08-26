import React from "react";
import { EmailLayout } from "@/emails/components/EmailLayout";
import { OrderSummary, type OrderReceivedEmailItem } from "@/emails/components/OrderSummary";

export type OrderReceivedEmailProps = {
  customerName: string;
  customerEmail: string;
  orderCode: string;
  items: OrderReceivedEmailItem[];
  subtotal: number | null;
  shippingFee: number | null;
  total: number | null;
  paymentMethod: "cod" | "bank_transfer";
  shippingAddress: {
    customerName: string;
    addressLine: string;
    ward: string;
    district: string;
    province: string;
  };
};

const preheader = "Thông tin đơn hàng của bạn đã được Tiny ghi nhận.";

export function OrderReceivedEmail({
  customerName,
  orderCode,
  items,
  subtotal,
  shippingFee,
  total,
  paymentMethod,
  shippingAddress
}: OrderReceivedEmailProps) {
  return (
    <EmailLayout preheader={preheader}>
      <tr>
        <td style={{ backgroundColor: "#172554", color: "#ffffff", padding: "24px 28px" }}>
          <p style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "0.04em", margin: 0, textTransform: "uppercase" }}>Tiệm Len Nhà Tiny</p>
          <h1 style={{ fontSize: "26px", lineHeight: "34px", margin: "10px 0 0" }}>Tiny đã nhận đơn của bạn</h1>
        </td>
      </tr>
      <tr>
        <td style={{ padding: "28px" }}>
          <p style={{ fontSize: "16px", lineHeight: "25px", margin: "0 0 16px" }}>Chào {customerName},</p>
          <p style={{ color: "#38475b", fontSize: "16px", lineHeight: "25px", margin: "0 0 20px" }}>
            Cảm ơn bạn đã đặt hàng tại Tiệm Len Nhà Tiny. Tiny đã ghi nhận thông tin đơn hàng và sẽ kiểm tra sản phẩm trước khi xử lý bước tiếp theo.
          </p>
          <table cellPadding={0} cellSpacing={0} role="presentation" style={{ backgroundColor: "#f1f5f9", border: "1px solid #dbe6f0", borderRadius: "12px", marginBottom: "24px", width: "100%" }}>
            <tbody>
              <tr>
                <td style={{ padding: "16px" }}>
                  <span style={{ color: "#526173", display: "block", fontSize: "13px", lineHeight: "19px" }}>Mã đơn hàng</span>
                  <strong style={{ color: "#172554", display: "block", fontSize: "18px", letterSpacing: "0.02em", lineHeight: "26px", marginTop: "3px" }}>{orderCode}</strong>
                  <span style={{ backgroundColor: "#dbeafe", borderRadius: "999px", color: "#1d4ed8", display: "inline-block", fontSize: "13px", fontWeight: 700, lineHeight: "20px", marginTop: "10px", padding: "3px 10px" }}>Đã nhận đơn</span>
                </td>
              </tr>
            </tbody>
          </table>
          <h2 style={{ color: "#172554", fontSize: "18px", lineHeight: "26px", margin: "0 0 8px" }}>Sản phẩm trong đơn</h2>
          <OrderSummary items={items} subtotal={subtotal} shippingFee={shippingFee} total={total} paymentMethod={paymentMethod} />
          <h2 style={{ color: "#172554", fontSize: "18px", lineHeight: "26px", margin: "28px 0 8px" }}>Địa chỉ nhận hàng</h2>
          <p style={{ color: "#38475b", fontSize: "16px", lineHeight: "24px", margin: 0 }}>
            <strong style={{ color: "#172554" }}>{shippingAddress.customerName}</strong><br />
            {shippingAddress.addressLine}<br />
            {shippingAddress.ward}, {shippingAddress.district}<br />
            {shippingAddress.province}
          </p>
          <table cellPadding={0} cellSpacing={0} role="presentation" style={{ marginTop: "28px" }}>
            <tbody>
              <tr>
                <td style={{ backgroundColor: "#1d4ed8", borderRadius: "8px", textAlign: "center" }}>
                  <a href="https://lentiny.xyz/tra-cuu-don-hang" style={{ color: "#ffffff", display: "inline-block", fontSize: "15px", fontWeight: 700, lineHeight: "20px", minHeight: "44px", padding: "12px 20px", textDecoration: "none" }}>TRA CỨU ĐƠN HÀNG</a>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
      <tr>
        <td style={{ borderTop: "1px solid #e8edf2", color: "#64748b", fontSize: "13px", lineHeight: "20px", padding: "18px 28px 22px" }}>
          <strong style={{ color: "#334155" }}>Tiệm Len Nhà Tiny</strong><br />
          853 Ba Đình, Phường Chánh Hưng, TP. Hồ Chí Minh<br />
          <a href="tel:+84937511107" style={{ color: "#1d4ed8", textDecoration: "none" }}>093.751.1107</a>
          <span aria-hidden="true"> · </span>
          <a href="https://lentiny.xyz" style={{ color: "#1d4ed8", textDecoration: "none" }}>lentiny.xyz</a><br />
          <a href="https://zalo.me/0937511107" style={{ color: "#1d4ed8", textDecoration: "none" }}>Zalo</a>
          <span aria-hidden="true"> · </span>
          <a href="https://m.me/61559447375156" style={{ color: "#1d4ed8", textDecoration: "none" }}>Messenger</a>
        </td>
      </tr>
    </EmailLayout>
  );
}
