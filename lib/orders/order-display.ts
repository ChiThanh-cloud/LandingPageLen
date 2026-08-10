export const FIXED_SHIPPING_FEE_VND = 30_000;

export function calculateCheckoutDisplayTotals(subtotal: number) {
  return {
    subtotal,
    shippingFee: FIXED_SHIPPING_FEE_VND,
    total: subtotal + FIXED_SHIPPING_FEE_VND
  };
}

export function getOrderStatusLabel(status: string) {
  if (status === "pending_confirmation") return "Chờ Tiny xác nhận";
  if (status === "pending_payment") return "Chờ thanh toán";
  if (status === "confirmed") return "Đã xác nhận";
  if (status === "shipping") return "Đang giao hàng";
  if (status === "cancelled") return "Đã hủy";
  if (status === "completed") return "Hoàn thành";
  return "Đang xử lý";
}

export function getPaymentStatusLabel(status: string) {
  if (status === "unpaid") return "Chưa thanh toán";
  if (status === "paid") return "Đã thanh toán";
  if (status === "failed") return "Thanh toán chưa thành công";
  if (status === "refunded") return "Đã hoàn tiền";
  return "Đang cập nhật";
}

export function getPaymentMethodLabel(method: string) {
  if (method === "bank_transfer") return "Chuyển khoản ngân hàng";
  if (method === "cod") return "Thanh toán khi nhận hàng (COD)";
  return "Đang cập nhật";
}
