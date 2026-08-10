import { z } from "zod";
import { canonicalizeOrderPhone } from "@/lib/orders/order-cancellation";
import { orderCodeSchema } from "@/lib/orders/order-schema";

export const createPayOSPaymentRequestSchema = z.object({
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

export type CreatePayOSPaymentRequest = z.infer<typeof createPayOSPaymentRequestSchema>;

export const payOSWebhookSchema = z.object({
  code: z.string(),
  desc: z.string(),
  success: z.boolean(),
  signature: z.string().min(1),
  data: z.object({
    orderCode: z.number().int().positive(),
    amount: z.number().int().positive(),
    description: z.string(),
    accountNumber: z.string(),
    reference: z.string(),
    transactionDateTime: z.string(),
    currency: z.string(),
    paymentLinkId: z.string(),
    code: z.string(),
    desc: z.string()
  }).passthrough()
}).passthrough();

export const preparedPaymentSchema = z.object({
  paymentId: z.string().uuid(),
  orderCode: orderCodeSchema,
  providerOrderCode: z.coerce.number().int().positive().safe(),
  amount: z.coerce.number().int().positive(),
  paymentLinkId: z.string().nullable(),
  checkoutUrl: z.url().nullable(),
  qrCode: z.string().nullable(),
  description: z.string().nullable()
});

export type PreparedPayment = z.infer<typeof preparedPaymentSchema>;

