import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_LIFETIME_SECONDS = 60 * 60;

type PaymentAccessClaims = {
  orderCode: string;
  purpose: "payment-status";
  expiresAt: number;
};

function encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret)
    .update(`tiny-payment-status:${payload}`)
    .digest("base64url");
}

export function createPaymentAccessToken(
  orderCode: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000)
) {
  const claims: PaymentAccessClaims = {
    orderCode,
    purpose: "payment-status",
    expiresAt: nowSeconds + TOKEN_LIFETIME_SECONDS
  };
  const payload = encode(JSON.stringify(claims));
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyPaymentAccessToken(
  token: string,
  orderCode: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000)
) {
  const [payload, providedSignature, extra] = token.split(".");
  if (!payload || !providedSignature || extra) return false;

  const expectedSignature = sign(payload, secret);
  const expected = Buffer.from(expectedSignature);
  const provided = Buffer.from(providedSignature);
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) return false;

  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<PaymentAccessClaims>;
    return claims.orderCode === orderCode
      && claims.purpose === "payment-status"
      && typeof claims.expiresAt === "number"
      && claims.expiresAt >= nowSeconds;
  } catch {
    return false;
  }
}

