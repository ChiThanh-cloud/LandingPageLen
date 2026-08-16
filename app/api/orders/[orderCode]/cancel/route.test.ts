import assert from "node:assert/strict";
import test from "node:test";
import { OrderServiceError } from "@/lib/orders/order-service";
import { createOrderCreationRateLimiter } from "@/lib/security/order-creation-rate-limit";
import { createOrderCancellationPostHandler } from "./route";

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

type CancelResult = {
  status: "cancelled";
  alreadyCancelled: boolean;
  cancelledReservations: number;
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

function cancelRequest(options?: {
  ip?: string;
  includeTrustedIp?: boolean;
  spoofedIp?: string;
  orderCode?: string;
  phone?: string;
  rawBody?: string;
  payload?: unknown;
}) {
  const body = options?.rawBody ?? JSON.stringify(options?.payload ?? {
    phone: options?.phone || "0901234567"
  });
  const headers = new Headers({ "Content-Type": "application/json" });
  if (options?.includeTrustedIp !== false) {
    headers.set("x-vercel-forwarded-for", options?.ip || "203.0.113.10");
  }
  if (options?.spoofedIp) headers.set("x-forwarded-for", options.spoofedIp);

  return {
    request: new Request("https://lentiny.xyz/api/orders/cancel", {
      method: "POST",
      headers,
      body
    }),
    context: { params: Promise.resolve({ orderCode: options?.orderCode || "TINY-ABCDEF123456" }) }
  };
}

function createHarness(options?: {
  result?: CancelResult;
  error?: Error;
}) {
  const store = createAtomicRateLimitStore();
  const limiter = createOrderCreationRateLimiter({
    getHashSecret: () => "unit-test-rate-limit-secret",
    getClient: () => store.client
  });
  const calls = { cancelGuestOrder: 0, scheduled: 0, telegram: 0 };
  const handler = createOrderCancellationPostHandler({
    checkIpRateLimit: limiter.checkCancelIp,
    checkCompositeRateLimit: limiter.checkCancelComposite,
    async cancelGuestOrder() {
      calls.cancelGuestOrder += 1;
      if (options?.error) throw options.error;
      return options?.result || {
        status: "cancelled" as const,
        alreadyCancelled: false,
        cancelledReservations: 1
      };
    },
    async sendTelegramOrderCancelledNotification() {
      calls.telegram += 1;
    },
    scheduleAfter() {
      calls.scheduled += 1;
    }
  });

  return { handler, calls, store };
}

async function post(
  handler: ReturnType<typeof createOrderCancellationPostHandler>,
  options?: Parameters<typeof cancelRequest>[0]
) {
  const { request, context } = cancelRequest(options);
  return handler(request, context);
}

test("first six cancellation requests pass and the seventh is rejected before cancellation or Telegram", async () => {
  const { handler, calls } = createHarness();
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    assert.equal((await post(handler, { orderCode: orderCodeFor(attempt) })).status, 200);
  }

  const blocked = await post(handler, { orderCode: orderCodeFor(7) });
  assert.equal(blocked.status, 429);
  assert.deepEqual(await blocked.json(), {
    code: "RATE_LIMITED",
    message: "Bạn thao tác quá nhanh. Vui lòng thử lại sau."
  });
  assert.equal(blocked.headers.get("Retry-After"), "60");
  assert.equal(blocked.headers.get("Cache-Control"), "no-store");
  assert.equal(calls.cancelGuestOrder, 6);
  assert.equal(calls.scheduled, 6);
});

test("twenty cancellation requests pass across burst windows and the twenty-first is sustained-rate-limited", async () => {
  const { handler, calls, store } = createHarness();
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    assert.equal((await post(handler, { orderCode: orderCodeFor(attempt) })).status, 200);
    if (attempt % 6 === 0) store.advance(60);
  }

  const blocked = await post(handler, { orderCode: orderCodeFor(21) });
  assert.equal(blocked.status, 429);
  assert.equal(blocked.headers.get("Retry-After"), "3420");
  assert.equal(calls.cancelGuestOrder, 20);
  assert.equal(calls.scheduled, 20);
});

test("same trusted IP and normalized order code allows four valid payloads then blocks the fifth", async () => {
  const { handler, calls } = createHarness();
  for (const orderCode of [
    "tiny-abcdef123456",
    "TINY-ABCDEF123456",
    "tiny-abcdef123456",
    "TINY-ABCDEF123456"
  ]) {
    assert.equal((await post(handler, { orderCode })).status, 200);
  }

  const blocked = await post(handler, { orderCode: "tiny-abcdef123456" });
  assert.equal(blocked.status, 429);
  assert.equal(blocked.headers.get("Retry-After"), "900");
  assert.equal(calls.cancelGuestOrder, 4);
  assert.equal(calls.scheduled, 4);
});

test("cancel counters are independent for different trusted IPs and order codes", async () => {
  const { handler } = createHarness();
  for (let attempt = 0; attempt < 4; attempt += 1) {
    assert.equal((await post(handler)).status, 200);
  }

  assert.equal((await post(handler, { orderCode: "TINY-ABCDEF123457" })).status, 200);
  assert.equal((await post(handler, { ip: "203.0.113.11" })).status, 200);
});

test("malformed JSON and invalid schema retain their 400 responses and never cancel", async () => {
  const malformed = createHarness();
  const malformedResponse = await post(malformed.handler, { rawBody: "{" });
  assert.equal(malformedResponse.status, 400);
  assert.deepEqual(await malformedResponse.json(), {
    code: "INVALID_REQUEST",
    message: "Dữ liệu gửi lên không hợp lệ."
  });
  assert.equal(malformed.calls.cancelGuestOrder, 0);

  const invalid = createHarness();
  const invalidResponse = await post(invalid.handler, { payload: { phone: "123" } });
  assert.equal(invalidResponse.status, 400);
  assert.equal(invalid.calls.cancelGuestOrder, 0);
});

test("unknown and wrong-phone responses preserve the same 404 privacy boundary", async () => {
  const error = new OrderServiceError(
    "ORDER_VERIFICATION_FAILED",
    404,
    "Không thể xác minh đơn hàng với mã đơn và số điện thoại đã nhập."
  );
  const unknown = createHarness({ error });
  const wrongPhone = createHarness({ error });

  const unknownResponse = await post(unknown.handler);
  const wrongPhoneResponse = await post(wrongPhone.handler, { phone: "0911234567" });
  assert.equal(unknownResponse.status, 404);
  assert.equal(wrongPhoneResponse.status, 404);
  assert.deepEqual(await unknownResponse.json(), await wrongPhoneResponse.json());
});

test("already-cancelled, paid, and non-cancellable responses preserve their existing semantics", async () => {
  const alreadyCancelled = createHarness({
    result: { status: "cancelled", alreadyCancelled: true, cancelledReservations: 0 }
  });
  const alreadyCancelledResponse = await post(alreadyCancelled.handler);
  assert.equal(alreadyCancelledResponse.status, 200);
  assert.equal(alreadyCancelled.calls.scheduled, 0);

  const paid = createHarness({
    error: new OrderServiceError("PAID_ORDER_CONTACT_TINY", 409, "Liên hệ Tiny.")
  });
  assert.equal((await post(paid.handler)).status, 409);

  const nonCancellable = createHarness({
    error: new OrderServiceError("ORDER_NOT_CANCELLABLE", 409, "Liên hệ Tiny.")
  });
  assert.equal((await post(nonCancellable.handler)).status, 409);
});

test("limiter failures fail open and keep raw customer inputs out of logs", async () => {
  const logs: unknown[][] = [];
  const originalConsoleError = console.error;
  console.error = (...args) => logs.push(args);
  try {
    const calls = { cancelled: 0 };
    const handler = createOrderCancellationPostHandler({
      async checkIpRateLimit() {
        throw new Error("203.0.113.10 TINY-ABCDEF123456 0901234567");
      },
      async checkCompositeRateLimit() {
        throw new Error("203.0.113.10 TINY-ABCDEF123456 0901234567");
      },
      async cancelGuestOrder() {
        calls.cancelled += 1;
        return { status: "cancelled" as const, alreadyCancelled: false, cancelledReservations: 0 };
      },
      async sendTelegramOrderCancelledNotification() {},
      scheduleAfter() {}
    });

    assert.equal((await post(handler)).status, 200);
    assert.equal(calls.cancelled, 1);
    assert.deepEqual(logs, [
      ["Order cancellation rate limiter unavailable", { name: "Error" }],
      ["Order cancellation rate limiter unavailable", { name: "Error" }]
    ]);
    assert.doesNotMatch(JSON.stringify(logs), /203\.0\.113\.10|TINY-ABCDEF123456|0901234567/);
  } finally {
    console.error = originalConsoleError;
  }
});

test("missing or spoofed IP headers skip cancellation limits without a shared bucket", async () => {
  const missing = createHarness();
  for (let attempt = 0; attempt < 7; attempt += 1) {
    assert.equal((await post(missing.handler, { includeTrustedIp: false })).status, 200);
  }
  assert.equal(missing.calls.cancelGuestOrder, 7);
  assert.equal(missing.store.getCalls(), 0);

  const spoofed = createHarness();
  for (let attempt = 0; attempt < 7; attempt += 1) {
    assert.equal(
      (await post(spoofed.handler, { includeTrustedIp: false, spoofedIp: "203.0.113.99" })).status,
      200
    );
  }
  assert.equal(spoofed.calls.cancelGuestOrder, 7);
  assert.equal(spoofed.store.getCalls(), 0);
});

test("concurrent cancellation burst requests allow exactly six cancellation calls", async () => {
  const { handler, calls } = createHarness();
  const responses = await Promise.all(
    Array.from({ length: 7 }, (_, index) => post(handler, { orderCode: orderCodeFor(index + 1) }))
  );

  assert.equal(responses.filter((response) => response.status === 200).length, 6);
  assert.equal(responses.filter((response) => response.status === 429).length, 1);
  assert.equal(calls.cancelGuestOrder, 6);
  assert.equal(calls.scheduled, 6);
});
