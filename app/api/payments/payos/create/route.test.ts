import assert from "node:assert/strict";
import test from "node:test";
import { PaymentFlowError } from "@/lib/payments/payment-core";
import { createOrderCreationRateLimiter } from "@/lib/security/order-creation-rate-limit";
import { createPayOSPaymentPostHandler } from "./route";

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

const paymentResult = {
  orderCode: "TINY-ABCDEF123456",
  amount: 58_800,
  status: "pending" as const,
  checkoutUrl: "https://pay.payos.vn/web/payment-link-id",
  qrDataUrl: "data:image/png;base64,cXItY29kZQ==",
  statusToken: "opaque-status-token"
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

function orderCodeFor(index: number) {
  return `TINY-${index.toString(16).padStart(12, "0").toUpperCase()}`;
}

function paymentRequest(options?: {
  ip?: string;
  includeTrustedIp?: boolean;
  orderCode?: string;
  phone?: string;
  rawBody?: string;
  payload?: unknown;
  spoofedIp?: string;
}) {
  const body = options?.rawBody ?? JSON.stringify(options?.payload ?? {
    orderCode: options?.orderCode ?? "TINY-ABCDEF123456",
    phone: options?.phone ?? "0901234567"
  });
  const headers = new Headers({ "Content-Type": "application/json" });
  if (options?.includeTrustedIp !== false) {
    headers.set("x-vercel-forwarded-for", options?.ip ?? "203.0.113.10");
  }
  if (options?.spoofedIp) headers.set("x-forwarded-for", options.spoofedIp);

  return new Request("https://lentiny.xyz/api/payments/payos/create", {
    method: "POST",
    headers,
    body
  });
}

function createHarness() {
  const store = createAtomicRateLimitStore();
  const limiter = createOrderCreationRateLimiter({
    getHashSecret: () => "unit-test-rate-limit-secret",
    getClient: () => store.client
  });
  const calls = {
    payments: [] as Array<{ orderCode: string; phone: string }>
  };
  const handler = createPayOSPaymentPostHandler({
    checkIpRateLimit: limiter.checkPaymentIp,
    checkCompositeRateLimit: limiter.checkPaymentComposite,
    async createCustomerPayOSPayment(orderCode, phone) {
      calls.payments.push({ orderCode, phone });
      return { ...paymentResult, orderCode };
    }
  });

  return { handler, calls, store };
}

test("payment handler normalizes the request and checks both limits before payment creation", async () => {
  const sequence: string[] = [];
  const handler = createPayOSPaymentPostHandler({
    async checkIpRateLimit() {
      sequence.push("ip");
      return { allowed: true, retryAfterSeconds: 0 };
    },
    async checkCompositeRateLimit(_request, orderCode, phone) {
      sequence.push(`composite:${orderCode}:${phone}`);
      return { allowed: true, retryAfterSeconds: 0 };
    },
    async createCustomerPayOSPayment(orderCode, phone) {
      sequence.push(`payment:${orderCode}:${phone}`);
      return paymentResult;
    }
  });

  const response = await handler(paymentRequest({
    orderCode: " tiny-abcdef123456 ",
    phone: "(090) 123-4567"
  }));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await response.json(), paymentResult);
  assert.deepEqual(sequence, [
    "ip",
    "composite:TINY-ABCDEF123456:0901234567",
    "payment:TINY-ABCDEF123456:0901234567"
  ]);
});

test("first six payment requests pass and the seventh is rejected before payment creation", async () => {
  const { handler, calls } = createHarness();
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    assert.equal((await handler(paymentRequest({ orderCode: orderCodeFor(attempt) }))).status, 200);
  }

  const blocked = await handler(paymentRequest({ orderCode: orderCodeFor(7) }));
  assert.equal(blocked.status, 429);
  assert.deepEqual(await blocked.json(), {
    code: "RATE_LIMITED",
    message: "Bạn thao tác quá nhanh. Vui lòng thử lại sau."
  });
  assert.equal(blocked.headers.get("Retry-After"), "60");
  assert.equal(blocked.headers.get("Cache-Control"), "no-store");
  assert.equal(calls.payments.length, 6);
});

test("twenty payment requests pass across burst windows and the twenty-first hits the sustained limit", async () => {
  const { handler, calls, store } = createHarness();
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    assert.equal((await handler(paymentRequest({ orderCode: orderCodeFor(attempt) }))).status, 200);
    if (attempt % 6 === 0) store.advance(60);
  }

  const blocked = await handler(paymentRequest({ orderCode: orderCodeFor(21) }));
  assert.equal(blocked.status, 429);
  assert.equal(blocked.headers.get("Retry-After"), "3420");
  assert.equal(blocked.headers.get("Cache-Control"), "no-store");
  assert.equal(calls.payments.length, 20);
});

test("same normalized payment identity allows four requests then blocks the fifth", async () => {
  const { handler, calls } = createHarness();
  const variants = [
    { orderCode: "tiny-abcdef123456", phone: "090 123 4567" },
    { orderCode: "TINY-ABCDEF123456", phone: "090.123.4567" },
    { orderCode: " tiny-abcdef123456 ", phone: "(090)123-4567" },
    { orderCode: "TINY-ABCDEF123456", phone: "0901234567" }
  ];

  for (const variant of variants) {
    assert.equal((await handler(paymentRequest(variant))).status, 200);
  }

  const blocked = await handler(paymentRequest());
  assert.equal(blocked.status, 429);
  assert.equal(blocked.headers.get("Retry-After"), "900");
  assert.equal(blocked.headers.get("Cache-Control"), "no-store");
  assert.equal(calls.payments.length, 4);
});

test("payment composite counters are independent for IP, order code, and phone", async () => {
  const { handler } = createHarness();
  for (let attempt = 0; attempt < 4; attempt += 1) {
    assert.equal((await handler(paymentRequest())).status, 200);
  }

  assert.equal((await handler(paymentRequest({ orderCode: "TINY-ABCDEF123457" }))).status, 200);
  assert.equal((await handler(paymentRequest({ phone: "0911234567" }))).status, 200);
  assert.equal((await handler(paymentRequest({ ip: "203.0.113.11" }))).status, 200);
});

test("malformed JSON and invalid payment data retain 400 no-store responses", async () => {
  const malformed = createHarness();
  const malformedResponse = await malformed.handler(paymentRequest({ rawBody: "{" }));
  assert.equal(malformedResponse.status, 400);
  assert.equal(malformedResponse.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await malformedResponse.json(), {
    code: "INVALID_REQUEST",
    message: "Dữ liệu gửi lên không hợp lệ."
  });
  assert.equal(malformed.calls.payments.length, 0);
  assert.equal(malformed.store.getCalls(), 1);

  const invalid = createHarness();
  const invalidResponse = await invalid.handler(paymentRequest({
    payload: { orderCode: "invalid", phone: "123" }
  }));
  assert.equal(invalidResponse.status, 400);
  assert.equal(invalidResponse.headers.get("Cache-Control"), "no-store");
  assert.equal(invalid.calls.payments.length, 0);
  assert.equal(invalid.store.getCalls(), 1);
});

test("limiter failures fail open and keep raw payment identities out of logs", async () => {
  const logs: unknown[][] = [];
  const originalConsoleError = console.error;
  console.error = (...args) => logs.push(args);
  try {
    let paymentCalls = 0;
    const handler = createPayOSPaymentPostHandler({
      async checkIpRateLimit() {
        throw new Error("203.0.113.10 TINY-ABCDEF123456 0901234567");
      },
      async checkCompositeRateLimit() {
        throw new Error("203.0.113.10 TINY-ABCDEF123456 0901234567");
      },
      async createCustomerPayOSPayment() {
        paymentCalls += 1;
        return paymentResult;
      }
    });

    assert.equal((await handler(paymentRequest())).status, 200);
    assert.equal(paymentCalls, 1);
    assert.deepEqual(logs, [
      ["Payment creation rate limiter unavailable", { name: "Error" }],
      ["Payment creation rate limiter unavailable", { name: "Error" }]
    ]);
    assert.doesNotMatch(
      JSON.stringify(logs),
      /203\.0\.113\.10|TINY-ABCDEF123456|0901234567/
    );
  } finally {
    console.error = originalConsoleError;
  }
});

test("missing or spoofed IP headers skip payment limits without a shared bucket", async () => {
  const missing = createHarness();
  for (let attempt = 0; attempt < 7; attempt += 1) {
    assert.equal((await missing.handler(paymentRequest({ includeTrustedIp: false }))).status, 200);
  }
  assert.equal(missing.calls.payments.length, 7);
  assert.equal(missing.store.getCalls(), 0);

  const spoofed = createHarness();
  for (let attempt = 0; attempt < 7; attempt += 1) {
    assert.equal((await spoofed.handler(paymentRequest({
      includeTrustedIp: false,
      spoofedIp: "203.0.113.99"
    }))).status, 200);
  }
  assert.equal(spoofed.calls.payments.length, 7);
  assert.equal(spoofed.store.getCalls(), 0);
});

test("PaymentFlowError and unexpected failures preserve existing response semantics", async () => {
  const paymentError = createPayOSPaymentPostHandler({
    async checkIpRateLimit() {
      return { allowed: true, retryAfterSeconds: 0 };
    },
    async checkCompositeRateLimit() {
      return { allowed: true, retryAfterSeconds: 0 };
    },
    async createCustomerPayOSPayment() {
      throw new PaymentFlowError("ORDER_VERIFICATION_FAILED", 404, "Không thể xác minh đơn hàng.");
    }
  });
  const paymentErrorResponse = await paymentError(paymentRequest());
  assert.equal(paymentErrorResponse.status, 404);
  assert.equal(paymentErrorResponse.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await paymentErrorResponse.json(), {
    code: "ORDER_VERIFICATION_FAILED",
    message: "Không thể xác minh đơn hàng."
  });

  const logs: unknown[][] = [];
  const originalConsoleError = console.error;
  console.error = (...args) => logs.push(args);
  try {
    const unexpected = createPayOSPaymentPostHandler({
      async checkIpRateLimit() {
        return { allowed: true, retryAfterSeconds: 0 };
      },
      async checkCompositeRateLimit() {
        return { allowed: true, retryAfterSeconds: 0 };
      },
      async createCustomerPayOSPayment() {
        throw new Error("provider failed");
      }
    });
    const response = await unexpected(paymentRequest());
    assert.equal(response.status, 500);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.deepEqual(await response.json(), {
      code: "PAYMENT_CREATION_FAILED",
      message: "Chưa thể tạo mã thanh toán. Vui lòng thử lại."
    });
    assert.deepEqual(logs, [["Unexpected payment creation failure", { name: "Error" }]]);
  } finally {
    console.error = originalConsoleError;
  }
});

test("concurrent payment bursts allow exactly six payment-service calls", async () => {
  const { handler, calls } = createHarness();
  const responses = await Promise.all(
    Array.from({ length: 7 }, (_, index) => handler(paymentRequest({
      orderCode: orderCodeFor(index + 1)
    })))
  );

  assert.equal(responses.filter((response) => response.status === 200).length, 6);
  assert.equal(responses.filter((response) => response.status === 429).length, 1);
  assert.equal(calls.payments.length, 6);
});
