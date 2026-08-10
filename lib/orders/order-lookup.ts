import { z } from "zod";
import { canonicalizeOrderPhone } from "@/lib/orders/order-cancellation";
import { orderCodeSchema } from "@/lib/orders/order-schema";

export const orderLookupRequestSchema = z.object({
  orderCode: orderCodeSchema,
  phone: z.string()
    .trim()
    .min(1, "Vui lòng nhập số điện thoại đã dùng khi đặt hàng.")
    .max(24, "Số điện thoại quá dài.")
    .refine(
      (value) => /^(?:\+84|84|0)\d{8,10}$/.test(canonicalizeOrderPhone(value)),
      "Số điện thoại chưa đúng định dạng Việt Nam."
    )
    .transform(canonicalizeOrderPhone)
}).strict();

const orderStatusSchema = z.enum([
  "pending_confirmation",
  "pending_payment",
  "confirmed",
  "shipping",
  "cancelled",
  "completed"
]);

const paymentStatusSchema = z.enum(["unpaid", "paid", "failed", "refunded"]);
const paymentMethodSchema = z.enum(["cod", "bank_transfer"]);

export const customerOrderLookupSchema = z.object({
  orderCode: orderCodeSchema,
  createdAt: z.string(),
  orderStatus: orderStatusSchema,
  paymentStatus: paymentStatusSchema,
  paymentMethod: paymentMethodSchema,
  items: z.array(z.object({
    productName: z.string(),
    variantName: z.string(),
    colorCode: z.string().nullable(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().nonnegative(),
    lineTotal: z.number().nonnegative()
  }).strict()),
  subtotal: z.number().nonnegative(),
  shippingFee: z.number().nonnegative().nullable(),
  total: z.number().nonnegative().nullable()
}).strict();

export type OrderLookupRequest = z.infer<typeof orderLookupRequestSchema>;
export type CustomerOrderLookup = z.infer<typeof customerOrderLookupSchema>;

export type OrderLookupOrderRow = {
  id: string;
  order_code: string;
  phone: string;
  created_at: string;
  order_status: string;
  payment_status: string;
  payment_method: string;
  subtotal: number | string;
  shipping_fee: number | string | null;
  total: number | string | null;
};

export type OrderLookupItemRow = {
  product_name_snapshot: string;
  variant_name_snapshot: string;
  color_code_snapshot: string | null;
  quantity: number;
  unit_price: number | string;
  line_total: number | string;
};

export type OrderLookupRepository = {
  findOrderByCode(orderCode: string): Promise<OrderLookupOrderRow | null>;
  findItemsByOrderId(orderId: string): Promise<OrderLookupItemRow[]>;
};

function nullableNumber(value: number | string | null): number | null {
  if (value === null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export async function lookupCustomerOrder(
  request: OrderLookupRequest,
  repository: OrderLookupRepository
): Promise<CustomerOrderLookup | null> {
  const order = await repository.findOrderByCode(request.orderCode);
  if (!order) return null;

  const submittedPhone = canonicalizeOrderPhone(request.phone);
  const storedPhone = canonicalizeOrderPhone(order.phone);
  if (!storedPhone || submittedPhone !== storedPhone) return null;

  const itemRows = await repository.findItemsByOrderId(order.id);
  return customerOrderLookupSchema.parse({
    orderCode: order.order_code,
    createdAt: order.created_at,
    orderStatus: order.order_status,
    paymentStatus: order.payment_status,
    paymentMethod: order.payment_method,
    items: itemRows.map((item) => ({
      productName: item.product_name_snapshot,
      variantName: item.variant_name_snapshot,
      colorCode: item.color_code_snapshot,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      lineTotal: Number(item.line_total)
    })),
    subtotal: Number(order.subtotal),
    shippingFee: nullableNumber(order.shipping_fee),
    total: nullableNumber(order.total)
  });
}
