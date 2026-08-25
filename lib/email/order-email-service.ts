import "server-only";

import { createElement, type ReactElement } from "react";
import { OrderReceivedEmail, type OrderReceivedEmailProps } from "@/emails/OrderReceivedEmail";
import { getResendEmailConfig, type ResendEmailConfig } from "@/lib/email/email-config";
import { createResendClient } from "@/lib/email/resend-client";

export type OrderReceivedEmailSnapshot = OrderReceivedEmailProps;

type ResendEmailClient = {
  emails: {
    send: (
      message: {
        from: string;
        to: string;
        subject: string;
        replyTo?: string;
        react: ReactElement;
      },
      options: { idempotencyKey: string }
    ) => Promise<{ data: unknown; error: unknown }>;
  };
};

type OrderEmailServiceDependencies = {
  getConfig: () => ResendEmailConfig | null;
  createClient: (apiKey: string) => ResendEmailClient;
};

export function createOrderEmailService({ getConfig, createClient }: OrderEmailServiceDependencies) {
  return {
    async sendOrderReceivedEmail(snapshot: OrderReceivedEmailSnapshot) {
      const recipient = snapshot.customerEmail.trim();
      if (!recipient) return { delivered: false, reason: "missing_recipient" as const };

      const config = getConfig();
      if (!config) {
        console.warn("Order-received email skipped because Resend is not configured");
        return { delivered: false, reason: "not_configured" as const };
      }

      const response = await createClient(config.apiKey).emails.send(
        {
          from: config.from,
          to: recipient,
          subject: `Tiny đã nhận đơn ${snapshot.orderCode} 🧶`,
          ...(config.replyTo ? { replyTo: config.replyTo } : {}),
          react: createElement(OrderReceivedEmail, snapshot)
        },
        { idempotencyKey: `order-received/${snapshot.orderCode}` }
      );

      if (response.error) {
        throw new Error("Resend order-received email failed");
      }

      return { delivered: true, reason: null };
    }
  };
}

const orderEmailService = createOrderEmailService({
  getConfig: getResendEmailConfig,
  createClient: createResendClient
});

export const sendOrderReceivedEmail = orderEmailService.sendOrderReceivedEmail;
