import "server-only";

import type { Webhook } from "@payos/node";
import QRCode from "qrcode";
import { z } from "zod";
import { siteConfig } from "@/data/site";
import {
  createPayOSPayment,
  PaymentFlowError,
  processPayOSWebhook,
  type PaymentProvider,
  type PaymentRepository,
  type PreparedPaymentRecord,
  type ProviderPayment,
  type VerifiedWebhookPayment
} from "@/lib/payments/payment-core";
import { createPaymentAccessToken } from "@/lib/payments/payment-access-token";
import { preparedPaymentSchema } from "@/lib/payments/payment-schema";
import { getPayOSClient } from "@/lib/payments/payos-client";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const completionResultSchema = z.object({
  status: z.literal("paid"),
  alreadyPaid: z.boolean()
});

function getApplicationUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim() || siteConfig.url;
  try {
    return new URL(configured).origin;
  } catch {
    throw new PaymentFlowError(
      "PAYMENT_SERVICE_UNAVAILABLE",
      503,
      "Thanh toán trực tuyến chưa sẵn sàng. Vui lòng thử lại sau."
    );
  }
}

function getPaymentTokenSecret() {
  const secret = process.env.PAYOS_CHECKSUM_KEY;
  if (!secret) {
    throw new PaymentFlowError(
      "PAYMENT_SERVICE_UNAVAILABLE",
      503,
      "Thanh toán trực tuyến chưa sẵn sàng. Vui lòng thử lại sau."
    );
  }
  return secret;
}

function mapDatabasePaymentError(message: string) {
  if (message.includes("ORDER_VERIFICATION_FAILED")) {
    return new PaymentFlowError(
      "ORDER_VERIFICATION_FAILED",
      404,
      "Không thể xác minh đơn hàng với mã đơn và số điện thoại đã nhập."
    );
  }
  if (message.includes("PAYMENT_METHOD_NOT_SUPPORTED")) {
    return new PaymentFlowError(
      "PAYMENT_METHOD_NOT_SUPPORTED",
      409,
      "Đơn hàng này không sử dụng phương thức chuyển khoản ngân hàng."
    );
  }
  if (message.includes("ORDER_CANCELLED")) {
    return new PaymentFlowError(
      "ORDER_CANCELLED",
      409,
      "Đơn hàng đã được hủy nên không thể thanh toán."
    );
  }
  if (message.includes("ORDER_ALREADY_PAID")) {
    return new PaymentFlowError(
      "ORDER_ALREADY_PAID",
      409,
      "Đơn hàng đã được thanh toán."
    );
  }
  if (message.includes("PAYMENT_NOT_FOUND")) {
    return new PaymentFlowError(
      "PAYMENT_NOT_FOUND",
      503,
      "Chưa thể xác nhận thanh toán. Vui lòng thử lại sau."
    );
  }
  if (message.includes("PAYMENT_AMOUNT_MISMATCH") || message.includes("PAYMENT_RESPONSE_MISMATCH")) {
    return new PaymentFlowError(
      "PAYMENT_AMOUNT_MISMATCH",
      409,
      "Thông tin thanh toán không khớp với đơn hàng."
    );
  }
  return new PaymentFlowError(
    "PAYMENT_SERVICE_UNAVAILABLE",
    503,
    "Thanh toán trực tuyến chưa sẵn sàng. Vui lòng thử lại sau."
  );
}

function createRepository(): PaymentRepository {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    throw new PaymentFlowError(
      "PAYMENT_SERVICE_UNAVAILABLE",
      503,
      "Thanh toán trực tuyến chưa sẵn sàng. Vui lòng thử lại sau."
    );
  }

  return {
    async prepare(orderCode, phone) {
      const { data, error } = await supabase.rpc("prepare_guest_payos_payment", {
        p_order_code: orderCode,
        p_phone: phone
      });
      if (error) {
        console.error("Unable to prepare guest payment", { code: error.code, message: error.message });
        throw mapDatabasePaymentError(error.message);
      }

      const parsed = preparedPaymentSchema.safeParse(data);
      if (!parsed.success) {
        console.error("Unexpected payment preparation response", parsed.error.issues);
        throw new PaymentFlowError(
          "PAYMENT_CREATION_FAILED",
          500,
          "Chưa thể tạo mã thanh toán. Vui lòng thử lại."
        );
      }
      return parsed.data;
    },

    async attach(prepared: PreparedPaymentRecord, providerPayment: ProviderPayment) {
      const { error } = await supabase.rpc("attach_guest_payos_payment", {
        p_payment_id: prepared.paymentId,
        p_provider_order_code: prepared.providerOrderCode,
        p_amount: prepared.amount,
        p_payment_link_id: providerPayment.paymentLinkId,
        p_checkout_url: providerPayment.checkoutUrl,
        p_qr_code: providerPayment.qrCode,
        p_description: providerPayment.description
      });
      if (error) {
        console.error("Unable to save guest payment link", { code: error.code, message: error.message });
        throw mapDatabasePaymentError(error.message);
      }
    },

    async markPaid(payment: VerifiedWebhookPayment) {
      const { data, error } = await supabase.rpc("complete_guest_payos_payment", {
        p_provider_order_code: payment.orderCode,
        p_amount: payment.amount,
        p_payment_link_id: payment.paymentLinkId,
        p_reference: payment.reference
      });
      if (error) {
        console.error("Unable to complete guest payment", { code: error.code, message: error.message });
        throw mapDatabasePaymentError(error.message);
      }

      const parsed = completionResultSchema.safeParse(data);
      if (!parsed.success) {
        throw new PaymentFlowError(
          "PAYMENT_VERIFICATION_FAILED",
          500,
          "Chưa thể xác nhận thanh toán."
        );
      }
      return { alreadyPaid: parsed.data.alreadyPaid };
    }
  };
}

function createProvider(): PaymentProvider {
  const payOS = getPayOSClient();
  if (!payOS) {
    throw new PaymentFlowError(
      "PAYMENT_SERVICE_UNAVAILABLE",
      503,
      "Thanh toán trực tuyến chưa sẵn sàng. Vui lòng thử lại sau."
    );
  }

  return {
    async create(input) {
      try {
        const result = await payOS.paymentRequests.create(input);
        return {
          orderCode: result.orderCode,
          amount: result.amount,
          paymentLinkId: result.paymentLinkId,
          checkoutUrl: result.checkoutUrl,
          qrCode: result.qrCode,
          description: result.description
        };
      } catch (error) {
        console.error("Unable to create payment link", {
          name: error instanceof Error ? error.name : "UnknownError"
        });
        throw new PaymentFlowError(
          "PAYMENT_CREATION_FAILED",
          502,
          "Chưa thể tạo mã thanh toán. Vui lòng thử lại."
        );
      }
    },

    async verify(webhook) {
      try {
        const result = await payOS.webhooks.verify(webhook as Webhook);
        return {
          orderCode: result.orderCode,
          amount: result.amount,
          paymentLinkId: result.paymentLinkId,
          reference: result.reference,
          code: result.code
        };
      } catch (error) {
        console.error("Payment webhook signature verification failed", {
          name: error instanceof Error ? error.name : "UnknownError"
        });
        throw new PaymentFlowError(
          "PAYMENT_VERIFICATION_FAILED",
          400,
          "Thông báo thanh toán không hợp lệ."
        );
      }
    }
  };
}

export async function createCustomerPayOSPayment(orderCode: string, phone: string) {
  const payment = await createPayOSPayment(
    { orderCode, phone, appUrl: getApplicationUrl() },
    { repository: createRepository(), provider: createProvider() }
  );

  if (!payment.qrCode || !payment.checkoutUrl) {
    throw new PaymentFlowError(
      "PAYMENT_CREATION_FAILED",
      500,
      "Chưa thể tạo mã thanh toán. Vui lòng thử lại."
    );
  }

  const qrDataUrl = await QRCode.toDataURL(payment.qrCode, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 360,
    color: { dark: "#17324D", light: "#FFFFFF" }
  });

  return {
    orderCode: payment.orderCode,
    amount: payment.amount,
    status: "pending" as const,
    checkoutUrl: payment.checkoutUrl,
    qrDataUrl,
    statusToken: createPaymentAccessToken(
      payment.orderCode,
      getPaymentTokenSecret()
    )
  };
}

export async function handlePayOSWebhook(webhook: unknown) {
  return processPayOSWebhook(webhook, {
    repository: createRepository(),
    provider: createProvider()
  });
}

type PaymentStatusRow = {
  order_status: string;
  payment_status: string;
  payment_method: string;
};

export async function getCustomerPaymentStatus(orderCode: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("orders")
    .select("order_status,payment_status,payment_method")
    .eq("order_code", orderCode)
    .maybeSingle<PaymentStatusRow>();

  if (error || !data || data.payment_method !== "bank_transfer") {
    if (error) console.error("Unable to read customer payment status", { code: error.code });
    return null;
  }

  if (data.payment_status === "paid") return "paid" as const;
  if (data.order_status === "cancelled") return "cancelled" as const;
  return "pending" as const;
}

export async function getPayOSNotificationContext(providerOrderCode: number) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("payments")
    .select("amount, orders!inner(order_code)")
    .eq("provider_order_code", providerOrderCode)
    .maybeSingle();

  if (error || !data || !data.orders) {
    if (error) console.error("Unable to resolve PayOS notification context", { code: error.code });
    return null;
  }

  const order = Array.isArray(data.orders) ? data.orders[0] : data.orders;
  if (!order || !order.order_code) return null;

  return {
    orderCode: order.order_code,
    amount: data.amount
  };
}
