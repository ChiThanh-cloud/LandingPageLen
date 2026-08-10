export const ORDER_LOOKUP_NOT_FOUND_MESSAGE =
  "Không tìm thấy đơn hàng. Vui lòng kiểm tra lại mã đơn và số điện thoại.";

export const ORDER_TIMELINE_STEPS = [
  "Đã đặt hàng",
  "Đã xác nhận",
  "Đang giao hàng",
  "Hoàn thành"
] as const;

export type OrderTimelineStatus =
  | "pending_confirmation"
  | "pending_payment"
  | "confirmed"
  | "shipping"
  | "cancelled"
  | "completed";

export function getOrderTimelineProgress(orderStatus: OrderTimelineStatus) {
  if (orderStatus === "completed") return 3;
  if (orderStatus === "shipping") return 2;
  if (orderStatus === "confirmed") return 1;
  if (orderStatus === "cancelled") return -1;
  return 0;
}
