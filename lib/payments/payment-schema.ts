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

// This schema is intentionally applied only after payOS verifies the original
// webhook body. Reconstructing or validating the provider envelope first could
// reject a valid signed payload or omit fields that participate in its signature.
export const verifiedPayOSWebhookSchema = z.object({
  orderCode: z.number().int().positive().safe(),
  amount: z.number().int().positive(),
  paymentLinkId: z.string().min(1),
  reference: z.string(),
  code: z.string()
});

export function getSafeZodIssueDiagnostics(error: z.ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    code: issue.code,
    expected: "expected" in issue ? issue.expected : undefined
  }));
}

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
