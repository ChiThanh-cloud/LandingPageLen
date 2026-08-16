import assert from "node:assert/strict";
import test from "node:test";
import type { CustomerOrderLookup } from "@/lib/orders/order-lookup";
import { createOrderCreationRateLimiter } from "@/lib/security/order-creation-rate-limit";
import { createOrderLookupPostHandler } from "./route";

type StoredWindow = { startedAt: number; count: number };
type PolicyEntry = {
  scope:
    | "ip_burst"
    | "ip_sustained"
    | "ip_phone"
    | "lookup_ip_burst"
    | "lookup_ip_sustained"
    | "lookup_ip_order"
    | "cancel_ip_burst"
    | "cancel_ip_sustained"
    | "cancel_ip_order"
    | "payment_ip_burst"
    | "payment_ip_sustained"
    | "payment_ip_order_phone";
  keyHash: string;
  limit: number;
  windowSeconds: number;
};

function createAtomicRateLimitStore() {
  const windows = new Map<string, StoredWindow>();
  let nowSeconds = 1_000_000;
  let calls = 0;

  return {
    advance(seconds: number) {
      nowSeconds += seconds;
    },
    getCalls() {
      return calls;
    },
    client: {
      async rpc(_name: string, args: { p_entries: PolicyEntry[] }) {
        calls += 1;
        let allowed = true;
        let retryAfterSeconds = 0;

        for (const entry of args.p_entries) {
          const identity = `${entry.scope}:${entry.keyHash}`;
          const current = windows.get(identity);
          const next = !current || current.startedAt + entry.windowSeconds <= nowSeconds
            ? { startedAt: nowSeconds, count: 1 }
            : { ...current, count: current.count + 1 };
          windows.set(identity, next);

          if (next.count > entry.limit) {
            allowed = false;
            retryAfterSeconds = Math.max(
              retryAfterSeconds,
              next.startedAt + entry.windowSeconds - nowSeconds
            );
          }
        }

        return { data: { allowed, retryAfterSeconds }, error: null };
      }
    }
  };
}

const lookupResult: CustomerOrderLookup = {
  orderCode: "TINY-ABCDEF123456",
  createdAt: "2026-08-13T00:00:00.000Z",
  orderStatus: "pending_confirmation",
  paymentStatus: "unpaid",
  paymentMethod: "cod",
  items: [],
  subtotal: 0,
  shippingFee: null,
  total: null
};

function orderCodeFor(index: number) {
  return `TINY-${index.toString(16).padStart(12, "0").toUpperCase()}`;
}

function lookupRequest(options?: {
  ip?: string;
  includeTrustedIp?: boolean;
  orderCode?: string;
  phone?: string;
  rawBody?: string;
  payload?: unknown;
  spoofedIp?: string;
}) {
  const body = options?.rawBody ?? JSON.stringify(options?.payload ?? {
    orderCode: options?.orderCode || "TINY-ABCDEF123456",
    phone: options?.phone || "0901234567"
  });
  const headers = new Headers({ "Content-Type": "application/json" });
  if (options?.includeTrustedIp !== false) {
    headers.set("x-vercel-forwarded-for", options?.ip || "203.0.113.10");
  }
  if (options?.spoofedIp) headers.set("x-forwarded-for", options.spoofedIp);

  return new Request("https://lentiny.xyz/api/orders/lookup", {
    method: "POST",
    headers,
    body
  });
}

function createHarness(result: CustomerOrderLookup | null = lookupResult) {
  const store = createAtomicRateLimitStore();
  const limiter = createOrderCreationRateLimiter({
    getHashSecret: () => "unit-test-rate-limit-secret",
    getClient: () => store.client
  });
  const calls = { lookupGuestOrder: 0 };
  const handler = createOrderLookupPostHandler({
    checkIpRateLimit: limiter.checkLookupIp,
    checkCompositeRateLimit: limiter.checkLookupComposite,
    async lookupGuestOrder() {
      calls.lookupGuestOrder += 1;
      return result;
    }
  });

  return { handler, calls, store };
}

test("first twelve lookup requests pass and the thirteenth is rejected before lookup", async () => {
  const { handler, calls } = createHarness();
  for (let attempt = 1; attempt <= 12; attempt += 1) {
    const response = await handler(lookupRequest({ orderCode: orderCodeFor(attempt) }));
    assert.equal(response.status, 200);
  }

  const blocked = await handler(lookupRequest({ orderCode: orderCodeFor(13) }));
  assert.equal(blocked.status, 429);
  assert.deepEqual(await blocked.json(), {
    code: "RATE_LIMITED",
    message: "Bạn thao tác quá nhanh. Vui lòng thử lại sau."
  });
  assert.equal(blocked.headers.get("Retry-After"), "60");
  assert.equal(blocked.headers.get("Cache-Control"), "no-store");
  assert.equal(calls.lookupGuestOrder, 12);
});

test("sixty lookup requests pass across burst windows and the sixty-first is sustained-rate-limited", async () => {
  const { handler, calls, store } = createHarness();
  for (let attempt = 1; attempt <= 60; attempt += 1) {
    const response = await handler(lookupRequest({ orderCode: orderCodeFor(attempt) }));
    assert.equal(response.status, 200);
    if (attempt % 12 === 0) store.advance(60);
  }

  const blocked = await handler(lookupRequest({ orderCode: orderCodeFor(61) }));
  assert.equal(blocked.status, 429);
  assert.equal(blocked.headers.get("Retry-After"), "3300");
  assert.equal(calls.lookupGuestOrder, 60);
});

test("same trusted IP and normalized order code allows six valid payloads then blocks the seventh", async () => {
  const { handler, calls } = createHarness();
  for (const orderCode of [
    "tiny-abcdef123456",
    "TINY-ABCDEF123456",
    "tiny-abcdef123456",
    "TINY-ABCDEF123456",
    "tiny-abcdef123456",
    "TINY-ABCDEF123456"
  ]) {
    assert.equal((await handler(lookupRequest({ orderCode }))).status, 200);
  }

  const blocked = await handler(lookupRequest({ orderCode: "tiny-abcdef123456" }));
  assert.equal(blocked.status, 429);
  assert.equal(blocked.headers.get("Retry-After"), "900");
  assert.equal(calls.lookupGuestOrder, 6);
});

test("lookup counters are independent for different trusted IPs and order codes", async () => {
  const { handler } = createHarness();
  for (let attempt = 0; attempt < 6; attempt += 1) {
    assert.equal((await handler(lookupRequest())).status, 200);
  }

  assert.equal((await handler(lookupRequest({ orderCode: "TINY-ABCDEF123457" }))).status, 200);
  assert.equal((await handler(lookupRequest({ ip: "203.0.113.11" }))).status, 200);
});

test("invalid payloads preserve 400 responses after the IP check and do not invoke lookup", async () => {
  const malformed = createHarness();
  const malformedResponse = await malformed.handler(lookupRequest({ rawBody: "{" }));
  assert.equal(malformedResponse.status, 400);
  assert.deepEqual(await malformedResponse.json(), {
    code: "INVALID_REQUEST",
    message: "Không tìm thấy đơn hàng. Vui lòng kiểm tra lại mã đơn và số điện thoại."
  });
  assert.equal(malformed.calls.lookupGuestOrder, 0);

  const invalid = createHarness();
  const invalidResponse = await invalid.handler(lookupRequest({ payload: { orderCode: "invalid" } }));
  assert.equal(invalidResponse.status, 400);
  assert.equal(invalid.calls.lookupGuestOrder, 0);
});

test("unknown orders and wrong phones retain the same private not-found response", async () => {
  const unknown = createHarness(null);
  const wrongPhone = createHarness(null);
  const unknownResponse = await unknown.handler(lookupRequest());
  const wrongPhoneResponse = await wrongPhone.handler(lookupRequest({ phone: "0911234567" }));

  assert.equal(unknownResponse.status, 404);
  assert.equal(wrongPhoneResponse.status, 404);
  assert.deepEqual(await unknownResponse.json(), await wrongPhoneResponse.json());
});

test("limiter failures fail open and keep raw customer inputs out of logs", async () => {
  const logs: unknown[][] = [];
  const originalConsoleError = console.error;
  console.error = (...args) => logs.push(args);
  try {
    const handler = createOrderLookupPostHandler({
      async checkIpRateLimit() {
        throw new Error("203.0.113.10 TINY-ABCDEF123456 0901234567");
      },
      async checkCompositeRateLimit() {
        throw new Error("203.0.113.10 TINY-ABCDEF123456 0901234567");
      },
      async lookupGuestOrder() {
        return lookupResult;
      }
    });

    assert.equal((await handler(lookupRequest())).status, 200);
    assert.deepEqual(logs, [
      ["Order lookup rate limiter unavailable", { name: "Error" }],
      ["Order lookup rate limiter unavailable", { name: "Error" }]
    ]);
    assert.doesNotMatch(JSON.stringify(logs), /203\.0\.113\.10|TINY-ABCDEF123456|0901234567/);
  } finally {
    console.error = originalConsoleError;
  }
});

test("missing or spoofed IP headers skip lookup limits without a shared bucket", async () => {
  const missing = createHarness();
  for (let attempt = 0; attempt < 13; attempt += 1) {
    assert.equal(
      (await missing.handler(lookupRequest({ includeTrustedIp: false }))).status,
      200
    );
  }
  assert.equal(missing.calls.lookupGuestOrder, 13);
  assert.equal(missing.store.getCalls(), 0);

  const spoofed = createHarness();
  for (let attempt = 0; attempt < 13; attempt += 1) {
    assert.equal(
      (await spoofed.handler(lookupRequest({ includeTrustedIp: false, spoofedIp: "203.0.113.99" }))).status,
      200
    );
  }
  assert.equal(spoofed.calls.lookupGuestOrder, 13);
  assert.equal(spoofed.store.getCalls(), 0);
});

test("concurrent lookup burst requests allow exactly twelve database lookups", async () => {
  const { handler, calls } = createHarness();
  const responses = await Promise.all(
    Array.from({ length: 13 }, (_, index) => handler(lookupRequest({ orderCode: orderCodeFor(index + 1) })))
  );

  assert.equal(responses.filter((response) => response.status === 200).length, 12);
  assert.equal(responses.filter((response) => response.status === 429).length, 1);
  assert.equal(calls.lookupGuestOrder, 12);
});
