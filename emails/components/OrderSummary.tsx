import React from "react";

export type OrderReceivedEmailItem = {
  productName: string;
  variantName: string;
  colorCode: string | null;
  quantity: number;
  lineTotal: number | null;
};

type OrderSummaryProps = {
  items: OrderReceivedEmailItem[];
  subtotal: number | null;
  shippingFee: number | null;
  total: number | null;
  paymentMethod: "cod" | "bank_transfer";
};

function formatMoney(value: number | null) {
  if (value === null || !Number.isFinite(value) || value < 0) return "Chưa xác nhận";
  return `${value.toLocaleString("vi-VN")}đ`;
}

function getPaymentMethodLabel(paymentMethod: OrderSummaryProps["paymentMethod"]) {
  return paymentMethod === "bank_transfer"
    ? "Chuyển khoản ngân hàng"
    : "Thanh toán khi nhận hàng (COD)";
}

function getVariantSummary(item: OrderReceivedEmailItem) {
  const colorCode = item.colorCode?.trim();
  if (!colorCode || item.variantName.includes(colorCode)) return item.variantName;
  return `${item.variantName} · Mã ${colorCode}`;
}

export function OrderSummary({ items, subtotal, shippingFee, total, paymentMethod }: OrderSummaryProps) {
  return (
    <table cellPadding={0} cellSpacing={0} role="presentation" style={{ borderCollapse: "collapse", width: "100%" }}>
      <tbody>
        {items.map((item, index) => (
          <tr key={`${item.productName}-${item.variantName}-${index}`}>
            <td style={{ borderBottom: "1px solid #e8edf2", padding: "12px 0" }}>
              <strong style={{ color: "#172554", display: "block", fontSize: "16px", lineHeight: "24px" }}>{item.productName}</strong>
              <span style={{ color: "#526173", display: "block", fontSize: "14px", lineHeight: "21px" }}>
                {getVariantSummary(item)} · SL: {item.quantity}
              </span>
            </td>
            <td align="right" style={{ borderBottom: "1px solid #e8edf2", color: "#172554", fontSize: "15px", padding: "12px 0 12px 16px", verticalAlign: "top", whiteSpace: "nowrap" }}>
              {formatMoney(item.lineTotal)}
            </td>
          </tr>
        ))}
        <tr>
          <td style={{ color: "#526173", fontSize: "15px", paddingTop: "16px" }}>Tạm tính</td>
          <td align="right" style={{ color: "#172554", fontSize: "15px", paddingTop: "16px" }}>{formatMoney(subtotal)}</td>
        </tr>
        <tr>
          <td style={{ color: "#526173", fontSize: "15px", paddingTop: "8px" }}>Phí vận chuyển</td>
          <td align="right" style={{ color: "#172554", fontSize: "15px", paddingTop: "8px" }}>{formatMoney(shippingFee)}</td>
        </tr>
        <tr>
          <td style={{ color: "#172554", fontSize: "17px", fontWeight: 700, paddingTop: "14px" }}>Tổng cộng</td>
          <td align="right" style={{ color: "#172554", fontSize: "17px", fontWeight: 700, paddingTop: "14px" }}>{formatMoney(total)}</td>
        </tr>
        <tr>
          <td colSpan={2} style={{ color: "#526173", fontSize: "14px", lineHeight: "21px", paddingTop: "10px" }}>
            Phương thức thanh toán: {getPaymentMethodLabel(paymentMethod)}
          </td>
        </tr>
      </tbody>
    </table>
  );
}
