import {
  getSafeZodIssueDiagnostics,
  verifiedPayOSWebhookSchema
} from "@/lib/payments/payment-schema";

export const TINY_PROVIDER_ORDER_CODE_MINIMUM = 1_000_000_000;

export type PaymentErrorCode =
  | "INVALID_REQUEST"
  | "ORDER_VERIFICATION_FAILED"
  | "PAYMENT_METHOD_NOT_SUPPORTED"
  | "ORDER_CANCELLED"
  | "ORDER_ALREADY_PAID"
  | "PAYMENT_NOT_AVAILABLE"
  | "PAYMENT_SERVICE_UNAVAILABLE"
  | "PAYMENT_CREATION_FAILED"
  | "PAYMENT_VERIFICATION_FAILED"
  | "PAYMENT_VERIFIED_PAYLOAD_INVALID"
  | "PAYMENT_NOT_FOUND"
  | "PAYMENT_AMOUNT_MISMATCH";

export class PaymentFlowError extends Error {
  constructor(
    public readonly code: PaymentErrorCode,
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "PaymentFlowError";
  }
}

export type PreparedPaymentRecord = {
  paymentId: string;
  orderCode: string;
  providerOrderCode: number;
  amount: number;
  paymentLinkId: string | null;
  checkoutUrl: string | null;
  qrCode: string | null;
  description: string | null;
};

export type ProviderPayment = {
  orderCode: number;
  amount: number;
  paymentLinkId: string;
  checkoutUrl: string;
  qrCode: string;
  description: string;
};

export type VerifiedWebhookPayment = {
  orderCode: number;
  amount: number;
  paymentLinkId: string;
  reference: string;
  code: string;
};

export type PayOSWebhookResult =
  | { kind: "payment"; alreadyPaid: boolean; providerOrderCode: number }
  | { kind: "ignored_signed_non_tiny" };

export interface PaymentRepository {
  prepare(orderCode: string, phone: string): Promise<PreparedPaymentRecord>;
  attach(
    prepared: PreparedPaymentRecord,
    providerPayment: ProviderPayment
  ): Promise<void>;
  markPaid(payment: VerifiedWebhookPayment): Promise<{ alreadyPaid: boolean }>;
}

export interface PaymentProvider {
  create(input: {
    orderCode: number;
    amount: number;
    description: string;
    returnUrl: string;
    cancelUrl: string;
  }): Promise<ProviderPayment>;
  verify(webhook: unknown): Promise<unknown>;
}

export function createPayOSDescription(orderCode: string) {
  return `TINY ${orderCode.replace(/^TINY-/, "")}`;
}

export function createPaymentReturnUrls(appUrl: string, orderCode: string) {
  const base = appUrl.replace(/\/$/, "");
  const path = `/dat-hang-thanh-cong/${encodeURIComponent(orderCode)}`;
  return {
    returnUrl: `${base}${path}?payment=returned`,
    cancelUrl: `${base}${path}?payment=cancelled`
  };
}

function hasReusableProviderData(payment: PreparedPaymentRecord) {
  return Boolean(
    payment.paymentLinkId
    && payment.checkoutUrl
    && payment.qrCode
    && payment.description
  );
}

export async function createPayOSPayment(
  input: { orderCode: string; phone: string; appUrl: string },
  dependencies: { repository: PaymentRepository; provider: PaymentProvider }
): Promise<PreparedPaymentRecord> {
  const prepared = await dependencies.repository.prepare(input.orderCode, input.phone);
  if (hasReusableProviderData(prepared)) return prepared;

  const urls = createPaymentReturnUrls(input.appUrl, prepared.orderCode);
  const providerPayment = await dependencies.provider.create({
    orderCode: prepared.providerOrderCode,
    amount: prepared.amount,
    description: createPayOSDescription(prepared.orderCode),
    ...urls
  });

  if (
    providerPayment.orderCode !== prepared.providerOrderCode
    || providerPayment.amount !== prepared.amount
    || !providerPayment.paymentLinkId
    || !providerPayment.checkoutUrl
    || !providerPayment.qrCode
  ) {
    throw new PaymentFlowError(
      "PAYMENT_CREATION_FAILED",
      502,
      "Chưa thể tạo mã thanh toán. Vui lòng thử lại."
    );
  }

  await dependencies.repository.attach(prepared, providerPayment);
  return {
    ...prepared,
    paymentLinkId: providerPayment.paymentLinkId,
    checkoutUrl: providerPayment.checkoutUrl,
    qrCode: providerPayment.qrCode,
    description: providerPayment.description
  };
}

export async function processPayOSWebhook(
  webhook: unknown,
  dependencies: { repository: PaymentRepository; provider: PaymentProvider }
): Promise<PayOSWebhookResult> {
  const verifiedResult = await dependencies.provider.verify(webhook);
  const parsed = verifiedPayOSWebhookSchema.safeParse(verifiedResult);
  if (!parsed.success) {
    console.warn("Rejected verified PayOS webhook payload", {
      issues: getSafeZodIssueDiagnostics(parsed.error)
    });
    throw new PaymentFlowError(
      "PAYMENT_VERIFIED_PAYLOAD_INVALID",
      400,
      "Thông báo thanh toán không hợp lệ."
    );
  }

  const verified = parsed.data;
  if (verified.code !== "00") {
    throw new PaymentFlowError(
      "PAYMENT_VERIFICATION_FAILED",
      400,
      "Thông báo thanh toán không hợp lệ."
    );
  }

  if (verified.orderCode < TINY_PROVIDER_ORDER_CODE_MINIMUM) {
    return { kind: "ignored_signed_non_tiny" };
  }

  const result = await dependencies.repository.markPaid(verified);
  return {
    kind: "payment",
    alreadyPaid: result.alreadyPaid,
    providerOrderCode: verified.orderCode
  };
}
