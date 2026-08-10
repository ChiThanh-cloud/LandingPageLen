export const CANCELLABLE_ORDER_STATUSES = [
  "pending_confirmation",
  "pending_payment"
] as const;

export function canonicalizeOrderPhone(value: string) {
  return value.trim().replace(/[\s.()-]+/g, "");
}

export type CustomerCancellationState =
  | "cancellable"
  | "already_cancelled"
  | "paid_contact_required"
  | "not_cancellable";

export function getCustomerCancellationState(
  orderStatus: string,
  paymentStatus: string
): CustomerCancellationState {
  if (orderStatus === "cancelled") return "already_cancelled";
  if (paymentStatus === "paid") return "paid_contact_required";
  if (
    paymentStatus === "unpaid"
    && CANCELLABLE_ORDER_STATUSES.some((status) => status === orderStatus)
  ) {
    return "cancellable";
  }
  return "not_cancellable";
}

export function canCustomerCancelOrder(orderStatus: string, paymentStatus: string) {
  return getCustomerCancellationState(orderStatus, paymentStatus) === "cancellable";
}
