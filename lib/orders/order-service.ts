import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  cancelOrderResultSchema,
  orderCreationResultSchema,
  type CancelOrderRequest,
  type CancelOrderResult,
  type OrderCreationResult,
  type OrderRequest
} from "@/lib/orders/order-schema";
import { canCustomerCancelOrder } from "@/lib/orders/order-cancellation";
import {
  lookupCustomerOrder,
  type CustomerOrderLookup,
  type OrderLookupItemRow,
  type OrderLookupOrderRow,
  type OrderLookupRequest
} from "@/lib/orders/order-lookup";

export type OrderErrorCode =
  | "INVALID_REQUEST"
  | "OUT_OF_STOCK"
  | "PRODUCT_UNAVAILABLE"
  | "VARIANT_UNAVAILABLE"
  | "ORDER_VERIFICATION_FAILED"
  | "ORDER_NOT_CANCELLABLE"
  | "PAID_ORDER_CONTACT_TINY"
  | "ORDER_CREATION_FAILED"
  | "ORDER_CANCELLATION_FAILED"
  | "ORDER_LOOKUP_FAILED"
  | "ORDER_SERVICE_UNAVAILABLE";

export type OrderIssueItem = {
  productId: string;
  variantId: string;
  availableStock?: number;
};

export class OrderServiceError extends Error {
  constructor(
    public readonly code: OrderErrorCode,
    public readonly status: number,
    message: string,
    public readonly item?: OrderIssueItem
  ) {
    super(message);
    this.name = "OrderServiceError";
  }
}

export function parseDatabaseOrderError(message: string): OrderServiceError {
  const marker = message.match(
    /(OUT_OF_STOCK|PRODUCT_UNAVAILABLE|VARIANT_UNAVAILABLE|INVALID_REQUEST)(?:\|(\d+)\|(\d+)(?:\|(\d+))?)?/
  );

  if (!marker) {
    return new OrderServiceError(
      "ORDER_CREATION_FAILED",
      500,
      "Tiny chưa thể tạo đơn lúc này. Vui lòng thử lại sau."
    );
  }

  const [, code, productId, variantId, availableStock] = marker;
  const item = productId && variantId
    ? {
        productId,
        variantId,
        ...(availableStock === undefined ? {} : { availableStock: Number(availableStock) })
      }
    : undefined;

  if (code === "OUT_OF_STOCK") {
    return new OrderServiceError(
      "OUT_OF_STOCK",
      409,
      "Số lượng bạn chọn hiện không còn đủ. Vui lòng cập nhật lại giỏ hàng.",
      item
    );
  }
  if (code === "PRODUCT_UNAVAILABLE") {
    return new OrderServiceError(
      "PRODUCT_UNAVAILABLE",
      409,
      "Sản phẩm này hiện chưa thể đặt. Vui lòng chọn sản phẩm khác.",
      item
    );
  }
  if (code === "VARIANT_UNAVAILABLE") {
    return new OrderServiceError(
      "VARIANT_UNAVAILABLE",
      409,
      "Lựa chọn này hiện chưa thể đặt. Vui lòng chọn lựa chọn khác.",
      item
    );
  }

  return new OrderServiceError(
    "INVALID_REQUEST",
    400,
    "Thông tin đơn hàng không hợp lệ."
  );
}

export async function createOrder(payload: OrderRequest): Promise<OrderCreationResult> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    throw new OrderServiceError(
      "ORDER_SERVICE_UNAVAILABLE",
      503,
      "Tiny chưa thể tiếp nhận đơn lúc này. Vui lòng liên hệ Tiny để được hỗ trợ."
    );
  }

  const { data, error } = await supabase.rpc("create_guest_order", { p_payload: payload });
  if (error) {
    console.error("create_guest_order RPC failed", {
      code: error.code,
      details: error.details,
      hint: error.hint,
      message: error.message
    });
    throw parseDatabaseOrderError(error.message);
  }

  const parsed = orderCreationResultSchema.safeParse(data);
  if (!parsed.success) {
    console.error("create_guest_order returned an unexpected response", parsed.error.issues);
    throw new OrderServiceError(
      "ORDER_CREATION_FAILED",
      500,
      "Tiny chưa thể tạo đơn lúc này. Vui lòng thử lại sau."
    );
  }

  return parsed.data;
}

function parseDatabaseCancellationError(message: string): OrderServiceError {
  if (message.includes("ORDER_VERIFICATION_FAILED")) {
    return new OrderServiceError(
      "ORDER_VERIFICATION_FAILED",
      404,
      "Không thể xác minh đơn hàng với mã đơn và số điện thoại đã nhập."
    );
  }

  if (message.includes("PAID_ORDER_CONTACT_TINY")) {
    return new OrderServiceError(
      "PAID_ORDER_CONTACT_TINY",
      409,
      "Đơn hàng đã được thanh toán. Vui lòng liên hệ Tiny để được hỗ trợ hủy/hoàn tiền."
    );
  }

  if (message.includes("ORDER_NOT_CANCELLABLE")) {
    return new OrderServiceError(
      "ORDER_NOT_CANCELLABLE",
      409,
      "Đơn hàng không còn ở trạng thái có thể tự hủy. Vui lòng liên hệ Tiny để được hỗ trợ."
    );
  }

  return new OrderServiceError(
    "ORDER_CANCELLATION_FAILED",
    500,
    "Tiny chưa thể hủy đơn lúc này. Vui lòng thử lại sau."
  );
}

export async function cancelGuestOrder(
  orderCode: string,
  payload: CancelOrderRequest
): Promise<CancelOrderResult> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    throw new OrderServiceError(
      "ORDER_SERVICE_UNAVAILABLE",
      503,
      "Tiny chưa thể xử lý yêu cầu lúc này. Vui lòng liên hệ Tiny để được hỗ trợ."
    );
  }

  const { data, error } = await supabase.rpc("cancel_guest_order", {
    p_order_code: orderCode,
    p_phone: payload.phone
  });

  if (error) {
    console.error("cancel_guest_order RPC failed", {
      code: error.code,
      details: error.details,
      hint: error.hint,
      message: error.message
    });
    throw parseDatabaseCancellationError(error.message);
  }

  const parsed = cancelOrderResultSchema.safeParse(data);
  if (!parsed.success) {
    console.error("cancel_guest_order returned an unexpected response", parsed.error.issues);
    throw new OrderServiceError(
      "ORDER_CANCELLATION_FAILED",
      500,
      "Tiny chưa thể hủy đơn lúc này. Vui lòng thử lại sau."
    );
  }

  return parsed.data;
}

export type PublicOrderSummary = {
  orderCode: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: "cod" | "bank_transfer";
  subtotal: number;
  shippingFee: number | null;
  total: number | null;
  stockConfirmationRequired: boolean;
  reservationExpiresAt: string | null;
  createdAt: string;
  canCancel: boolean;
};

type OrderSummaryRow = {
  id: string;
  order_code: string;
  order_status: string;
  payment_status: string;
  payment_method: "cod" | "bank_transfer";
  subtotal: number | string;
  shipping_fee: number | string | null;
  total: number | string | null;
  stock_confirmation_required: boolean;
  created_at: string;
};

function nullableNumber(value: number | string | null): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function getPublicOrderSummary(orderCode: string): Promise<PublicOrderSummary | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("orders")
    .select("id,order_code,order_status,payment_status,payment_method,subtotal,shipping_fee,total,stock_confirmation_required,created_at")
    .eq("order_code", orderCode)
    .maybeSingle<OrderSummaryRow>();

  if (error || !data) {
    if (error) console.error("Unable to load order success summary", { code: error.code, message: error.message });
    return null;
  }

  const { data: reservationData, error: reservationError } = await supabase
    .from("stock_reservations")
    .select("expires_at")
    .eq("order_id", data.id)
    .eq("reservation_status", "active")
    .order("expires_at", { ascending: false })
    .limit(1);

  if (reservationError) {
    console.error("Unable to load order reservation summary", {
      code: reservationError.code,
      message: reservationError.message
    });
  }

  return {
    orderCode: data.order_code,
    orderStatus: data.order_status,
    paymentStatus: data.payment_status,
    paymentMethod: data.payment_method,
    subtotal: Number(data.subtotal),
    shippingFee: nullableNumber(data.shipping_fee),
    total: nullableNumber(data.total),
    stockConfirmationRequired: data.stock_confirmation_required,
    reservationExpiresAt: reservationData?.[0]?.expires_at || null,
    createdAt: data.created_at,
    canCancel: canCustomerCancelOrder(data.order_status, data.payment_status)
  };
}

export async function lookupGuestOrder(
  request: OrderLookupRequest
): Promise<CustomerOrderLookup | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    throw new OrderServiceError(
      "ORDER_SERVICE_UNAVAILABLE",
      503,
      "Tiny chưa thể tra cứu đơn hàng lúc này. Vui lòng thử lại sau."
    );
  }

  return lookupCustomerOrder(request, {
    async findOrderByCode(orderCode) {
      const { data, error } = await supabase
        .from("orders")
        .select("id,order_code,phone,created_at,order_status,payment_status,payment_method,subtotal,shipping_fee,total")
        .eq("order_code", orderCode)
        .maybeSingle<OrderLookupOrderRow>();

      if (error) {
        console.error("Unable to load customer order lookup", { code: error.code });
        throw new OrderServiceError(
          "ORDER_LOOKUP_FAILED",
          500,
          "Tiny chưa thể tra cứu đơn hàng lúc này. Vui lòng thử lại sau."
        );
      }
      return data;
    },

    async findItemsByOrderId(orderId) {
      const { data, error } = await supabase
        .from("order_items")
        .select("product_name_snapshot,variant_name_snapshot,color_code_snapshot,quantity,unit_price,line_total,created_at")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Unable to load customer order item snapshots", { code: error.code });
        throw new OrderServiceError(
          "ORDER_LOOKUP_FAILED",
          500,
          "Tiny chưa thể tra cứu đơn hàng lúc này. Vui lòng thử lại sau."
        );
      }

      return (data || []) as OrderLookupItemRow[];
    }
  });
}

export type NotificationItemSnapshot = {
  productName: string;
  variantName: string;
  colorCode: string | null;
  quantity: number;
};

export type NotificationItemSnapshotRow = {
  product_name_snapshot: string;
  variant_name_snapshot: string;
  color_code_snapshot: string | null;
  quantity: number;
};

export function notificationItemSnapshotsFromRows(
  items: ReadonlyArray<NotificationItemSnapshotRow>
): NotificationItemSnapshot[] {
  return items.map((item) => ({
    productName: item.product_name_snapshot,
    variantName: item.variant_name_snapshot,
    colorCode: item.color_code_snapshot,
    quantity: item.quantity
  }));
}

export async function getOrderItemsSnapshot(orderCode: string): Promise<NotificationItemSnapshot[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("order_items")
    .select("product_name_snapshot, variant_name_snapshot, color_code_snapshot, quantity, orders!inner(order_code)")
    .eq("orders.order_code", orderCode)
    .order("created_at", { ascending: true });

  if (error || !data) {
    if (error) console.error("Unable to load order items snapshot for notification", { code: error.code });
    return [];
  }

  return notificationItemSnapshotsFromRows(data as NotificationItemSnapshotRow[]);
}
