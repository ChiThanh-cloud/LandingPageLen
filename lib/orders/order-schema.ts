import { z } from "zod";
import { paymentMethodSchema } from "@/lib/checkout/checkout-schema";
import { canonicalizeOrderPhone } from "@/lib/orders/order-cancellation";

const requiredText = (label: string, max: number) => z.string()
  .trim()
  .min(1, `${label} là bắt buộc.`)
  .max(max, `${label} quá dài.`);

const numericId = z.string().trim().regex(/^\d+$/, "Mã sản phẩm không hợp lệ.");

export const orderCodeSchema = z.string()
  .trim()
  .transform((value) => value.toUpperCase())
  .pipe(z.string().regex(/^TINY-[A-F0-9]{12}$/, "Mã đơn hàng không hợp lệ."));

export const orderRequestSchema = z.object({
  customer: z.object({
    name: requiredText("Họ và tên", 120),
    phone: requiredText("Số điện thoại", 24).refine(
      (value) => /^(?:\+84|84|0)\d{8,10}$/.test(value.replace(/[\s().-]/g, "")),
      "Số điện thoại chưa đúng định dạng Việt Nam."
    ),
    email: z.string().trim().max(254, "Email quá dài.").refine(
      (value) => value === "" || z.email().safeParse(value).success,
      "Email chưa đúng định dạng."
    )
  }).strict(),
  shipping: z.object({
    province: requiredText("Tỉnh / Thành phố", 120),
    district: requiredText("Quận / Huyện", 120),
    ward: requiredText("Phường / Xã", 120),
    addressLine: requiredText("Địa chỉ", 240),
    note: z.string().trim().max(500, "Ghi chú quá dài.")
  }).strict(),
  items: z.array(z.object({
    productId: numericId,
    variantId: numericId,
    quantity: z.number().int().positive().max(10_000)
  }).strict()).min(1).max(50),
  paymentMethod: paymentMethodSchema
}).strict().superRefine((payload, context) => {
  const identities = new Set<string>();
  payload.items.forEach((item, index) => {
    const identity = `${item.productId}:${item.variantId}`;
    if (identities.has(identity)) {
      context.addIssue({
        code: "custom",
        path: ["items", index],
        message: "Sản phẩm bị trùng trong đơn hàng."
      });
    }
    identities.add(identity);
  });
});

export type OrderRequest = z.infer<typeof orderRequestSchema>;

export type OrderCreationResult = {
  orderCode: string;
  status: "pending_confirmation" | "pending_payment";
  paymentStatus: "unpaid";
  stockConfirmationRequired: boolean;
  reservationExpiresAt: string | null;
};

export const orderCreationResultSchema = z.object({
  orderCode: z.string().regex(/^TINY-[A-F0-9]{12}$/),
  status: z.enum(["pending_confirmation", "pending_payment"]),
  paymentStatus: z.literal("unpaid"),
  stockConfirmationRequired: z.boolean(),
  reservationExpiresAt: z.string().nullable()
});

export const cancelOrderRequestSchema = z.object({
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

export type CancelOrderRequest = z.infer<typeof cancelOrderRequestSchema>;

export const cancelOrderResultSchema = z.object({
  status: z.literal("cancelled"),
  alreadyCancelled: z.boolean(),
  cancelledReservations: z.number().int().nonnegative()
});

export type CancelOrderResult = z.infer<typeof cancelOrderResultSchema>;
