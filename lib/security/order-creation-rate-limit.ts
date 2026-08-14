import "server-only";

import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type RateLimitPolicy = {
  scope:
    | "ip_burst"
    | "ip_sustained"
    | "ip_phone"
    | "lookup_ip_burst"
    | "lookup_ip_sustained"
    | "lookup_ip_order"
    | "cancel_ip_burst"
    | "cancel_ip_sustained"
    | "cancel_ip_order";
  keyHash: string;
  limit: number;
  windowSeconds: number;
};

export type OrderRateLimitDecision = {
  allowed: boolean;
  retryAfterSeconds: number;
};

type RateLimitRpcClient = {
  rpc: (
    name: "check_order_creation_rate_limits",
    args: { p_entries: RateLimitPolicy[] }
  ) => PromiseLike<{
    data: unknown;
    error: unknown;
  }>;
};

type OrderCreationRateLimiterDependencies = {
  getClient: () => RateLimitRpcClient | null;
  getHashSecret: () => string | undefined;
};

function hashIdentity(secret: string, value: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

function requiredHashSecret(getHashSecret: () => string | undefined) {
  const secret = getHashSecret()?.trim();
  if (!secret) throw new OrderRateLimiterUnavailableError();
  return secret;
}

function parseDecision(value: unknown): OrderRateLimitDecision {
  if (!value || typeof value !== "object") throw new OrderRateLimiterUnavailableError();
  const result = value as Record<string, unknown>;
  if (typeof result.allowed !== "boolean" || typeof result.retryAfterSeconds !== "number") {
    throw new OrderRateLimiterUnavailableError();
  }

  return {
    allowed: result.allowed,
    retryAfterSeconds: result.allowed
      ? 0
      : Math.max(1, Math.ceil(result.retryAfterSeconds))
  };
}

export class OrderRateLimiterUnavailableError extends Error {
  constructor() {
    super("Order rate limiter unavailable");
    this.name = "OrderRateLimiterUnavailableError";
  }
}

export function getTrustedOrderClientIp(request: Request) {
  const forwarded = request.headers.get("x-vercel-forwarded-for");
  const candidate = forwarded?.split(",", 1)[0]?.trim();
  return candidate && isIP(candidate) ? candidate.toLowerCase() : null;
}

export function createOrderCreationRateLimiter(dependencies: OrderCreationRateLimiterDependencies) {
  async function consume(entries: RateLimitPolicy[]): Promise<OrderRateLimitDecision> {
    const client = dependencies.getClient();
    if (!client) throw new OrderRateLimiterUnavailableError();

    let response: Awaited<ReturnType<RateLimitRpcClient["rpc"]>>;
    try {
      response = await client.rpc("check_order_creation_rate_limits", { p_entries: entries });
    } catch {
      throw new OrderRateLimiterUnavailableError();
    }
    if (response.error) throw new OrderRateLimiterUnavailableError();
    return parseDecision(response.data);
  }

  return {
    async checkIp(request: Request) {
      const trustedIp = getTrustedOrderClientIp(request);
      if (!trustedIp) return { allowed: true, retryAfterSeconds: 0 };

      const secret = requiredHashSecret(dependencies.getHashSecret);
      const ipKeyHash = hashIdentity(secret, `ip:${trustedIp}`);
      return consume([
        { scope: "ip_burst", keyHash: ipKeyHash, limit: 6, windowSeconds: 60 },
        { scope: "ip_sustained", keyHash: ipKeyHash, limit: 30, windowSeconds: 3600 }
      ]);
    },

    async checkComposite(request: Request, normalizedPhone: string) {
      const trustedIp = getTrustedOrderClientIp(request);
      if (!trustedIp) return { allowed: true, retryAfterSeconds: 0 };

      const secret = requiredHashSecret(dependencies.getHashSecret);
      const keyHash = hashIdentity(secret, `ip:${trustedIp}\nphone:${normalizedPhone}`);
      return consume([
        { scope: "ip_phone", keyHash, limit: 3, windowSeconds: 1800 }
      ]);
    },

    async checkLookupIp(request: Request) {
      const trustedIp = getTrustedOrderClientIp(request);
      if (!trustedIp) return { allowed: true, retryAfterSeconds: 0 };

      const secret = requiredHashSecret(dependencies.getHashSecret);
      const ipKeyHash = hashIdentity(secret, `lookup:ip:${trustedIp}`);
      return consume([
        { scope: "lookup_ip_burst", keyHash: ipKeyHash, limit: 12, windowSeconds: 60 },
        { scope: "lookup_ip_sustained", keyHash: ipKeyHash, limit: 60, windowSeconds: 3600 }
      ]);
    },

    async checkLookupComposite(request: Request, normalizedOrderCode: string) {
      const trustedIp = getTrustedOrderClientIp(request);
      if (!trustedIp) return { allowed: true, retryAfterSeconds: 0 };

      const secret = requiredHashSecret(dependencies.getHashSecret);
      const keyHash = hashIdentity(
        secret,
        `lookup:ip-order:${trustedIp}\norder-code:${normalizedOrderCode}`
      );
      return consume([
        { scope: "lookup_ip_order", keyHash, limit: 6, windowSeconds: 900 }
      ]);
    },

    async checkCancelIp(request: Request) {
      const trustedIp = getTrustedOrderClientIp(request);
      if (!trustedIp) return { allowed: true, retryAfterSeconds: 0 };

      const secret = requiredHashSecret(dependencies.getHashSecret);
      const ipKeyHash = hashIdentity(secret, `cancel:ip:${trustedIp}`);
      return consume([
        { scope: "cancel_ip_burst", keyHash: ipKeyHash, limit: 6, windowSeconds: 60 },
        { scope: "cancel_ip_sustained", keyHash: ipKeyHash, limit: 20, windowSeconds: 3600 }
      ]);
    },

    async checkCancelComposite(request: Request, normalizedOrderCode: string) {
      const trustedIp = getTrustedOrderClientIp(request);
      if (!trustedIp) return { allowed: true, retryAfterSeconds: 0 };

      const secret = requiredHashSecret(dependencies.getHashSecret);
      const keyHash = hashIdentity(
        secret,
        `cancel:ip-order:${trustedIp}\norder-code:${normalizedOrderCode}`
      );
      return consume([
        { scope: "cancel_ip_order", keyHash, limit: 4, windowSeconds: 900 }
      ]);
    }
  };
}

const orderCreationRateLimiter = createOrderCreationRateLimiter({
  getClient: () => getSupabaseAdminClient() as unknown as RateLimitRpcClient | null,
  getHashSecret: () => process.env.ORDER_RATE_LIMIT_HASH_SECRET
});

export const checkOrderCreationIpRateLimit = orderCreationRateLimiter.checkIp;
export const checkOrderCreationCompositeRateLimit = orderCreationRateLimiter.checkComposite;
export const checkOrderLookupIpRateLimit = orderCreationRateLimiter.checkLookupIp;
export const checkOrderLookupCompositeRateLimit = orderCreationRateLimiter.checkLookupComposite;
export const checkOrderCancellationIpRateLimit = orderCreationRateLimiter.checkCancelIp;
export const checkOrderCancellationCompositeRateLimit = orderCreationRateLimiter.checkCancelComposite;
