import assert from "node:assert/strict";
import test from "node:test";
import type { OrderReceivedEmailSnapshot } from "@/lib/email/order-email-service";
import { createOrderCreationRateLimiter } from "@/lib/security/order-creation-rate-limit";
import { createOrderPostHandler } from "./route";

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
  return {
    advance(seconds: number) {
      nowSeconds += seconds;
    },
    client: {
      async rpc(_name: string, args: { p_entries: PolicyEntry[] }) {
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

function validPayload(phone = "090 123 4567") {
  return {
    customer: { name: "Nguyễn Văn An", phone, email: "" },
    shipping: {
      province: "TP. Hồ Chí Minh",
      district: "Quận 1",
      ward: "Phường Bến Nghé",
      addressLine: "12 Nguyễn Huệ",
      note: ""
    },
    items: [{ productId: "40", variantId: "101", quantity: 1 }],
    paymentMethod: "cod"
  };
}

function orderRequest(options?: {
  ip?: string;
  includeTrustedIp?: boolean;
  phone?: string;
  rawBody?: string;
  payload?: unknown;
}) {
  const body = options?.rawBody ?? JSON.stringify(options?.payload ?? validPayload(options?.phone));
  const headers = new Headers({ "Content-Type": "application/json" });
  if (options?.includeTrustedIp !== false) {
    headers.set("x-vercel-forwarded-for", options?.ip || "203.0.113.10");
  }
  return new Request("https://lentiny.xyz/api/orders", {
    method: "POST",
    headers,
    body
  });
}

function phoneFor(index: number) {
  return `090${String(index).padStart(7, "0")}`;
}

function persistedEmailSnapshot(overrides: Partial<OrderReceivedEmailSnapshot> = {}): OrderReceivedEmailSnapshot {
  return {
    customerName: "Nguyễn Văn An",
    customerEmail: "customer@example.test",
    orderCode: "TINY-ABCDEF123456",
    items: [{ productName: "Len Milk Bò", variantName: "Mã 12", colorCode: "12", quantity: 1, lineTotal: 25_000 }],
    subtotal: 25_000,
    shippingFee: null,
    total: null,
    paymentMethod: "cod",
    shippingAddress: {
      customerName: "Nguyễn Văn An",
      addressLine: "12 Nguyễn Huệ",
      ward: "Phường Bến Nghé",
      district: "Quận 1",
      province: "TP. Hồ Chí Minh"
    },
    ...overrides
  };
}

function createHarness(options?: {
  createOrderFails?: boolean;
  emailSnapshot?: OrderReceivedEmailSnapshot | null;
  telegramFails?: boolean;
  emailFails?: boolean;
}) {
  const store = createAtomicRateLimitStore();
  const limiter = createOrderCreationRateLimiter({
    getHashSecret: () => "unit-test-rate-limit-secret",
    getClient: () => store.client
  });
  const calls = {
    createOrder: 0,
    scheduled: [] as Array<() => Promise<void>>,
    snapshots: 0,
    emailSnapshots: 0,
    notifications: 0,
    emails: [] as OrderReceivedEmailSnapshot[]
  };
  const handler = createOrderPostHandler({
    checkIpRateLimit: limiter.checkIp,
    checkCompositeRateLimit: limiter.checkComposite,
    async createOrder() {
      calls.createOrder += 1;
      if (options?.createOrderFails) throw new Error("database unavailable");
      return {
        orderCode: "TINY-ABCDEF123456",
        status: "pending_confirmation" as const,
        paymentStatus: "unpaid" as const,
        stockConfirmationRequired: false,
        reservationExpiresAt: null
      };
    },
    async getOrderItemsSnapshot() {
      calls.snapshots += 1;
      return [];
    },
    async sendNewOrderNotification() {
      calls.notifications += 1;
      if (options?.telegramFails) throw new Error("Telegram unavailable");
    },
    async getOrderReceivedEmailSnapshot() {
      calls.emailSnapshots += 1;
      return options?.emailSnapshot ?? persistedEmailSnapshot();
    },
    async sendOrderReceivedEmail(snapshot) {
      calls.emails.push(snapshot);
      if (options?.emailFails) throw new Error("Resend unavailable");
      return { delivered: true, reason: null };
    },
    scheduleAfter(callback) {
      calls.scheduled.push(callback);
    }
  });
  return { handler, calls, store };
}

async function runScheduled(calls: { scheduled: Array<() => Promise<void>> }) {
  await Promise.all(calls.scheduled.map((callback) => callback()));
}

test("six burst attempts pass and the seventh returns 429 before order and Telegram effects", async () => {
  const { handler, calls } = createHarness();
  for (let index = 1; index <= 6; index += 1) {
    const response = await handler(orderRequest({ phone: phoneFor(index) }));
    assert.equal(response.status, 201);
  }

  const blocked = await handler(orderRequest({ phone: phoneFor(7) }));
  assert.equal(blocked.status, 429);
  assert.deepEqual(await blocked.json(), {
    code: "RATE_LIMITED",
    message: "Bạn thao tác quá nhanh. Vui lòng thử lại sau."
  });
  assert.equal(blocked.headers.get("Retry-After"), "60");
  assert.equal(blocked.headers.get("Cache-Control"), "no-store");
  assert.equal(calls.createOrder, 6);
  assert.equal(calls.scheduled.length, 6);
});

test("thirty sustained attempts pass and the next attempt is blocked inside the hour", async () => {
  const { handler, calls, store } = createHarness();
  for (let index = 1; index <= 30; index += 1) {
    const response = await handler(orderRequest({ phone: phoneFor(index) }));
    assert.equal(response.status, 201);
    store.advance(61);
  }

  const blocked = await handler(orderRequest({ phone: phoneFor(31) }));
  assert.equal(blocked.status, 429);
  assert.equal(blocked.headers.get("Retry-After"), "1770");
  assert.equal(calls.createOrder, 30);
  assert.equal(calls.scheduled.length, 30);
});

test("same IP and normalized phone allows three attempts then blocks the fourth", async () => {
  const { handler, calls } = createHarness();
  for (const phone of ["090 123 4567", "090.123.4567", "090-123-4567"]) {
    assert.equal((await handler(orderRequest({ phone }))).status, 201);
  }

  const blocked = await handler(orderRequest({ phone: "0901234567" }));
  assert.equal(blocked.status, 429);
  assert.equal(blocked.headers.get("Retry-After"), "1800");
  assert.equal(calls.createOrder, 3);
  assert.equal(calls.scheduled.length, 3);
});

test("different IP and phone composite identities remain independent", async () => {
  const { handler } = createHarness();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    assert.equal((await handler(orderRequest({ phone: "0901234567" }))).status, 201);
  }
  assert.equal((await handler(orderRequest({ phone: "0911234567" }))).status, 201);
  assert.equal((await handler(orderRequest({ ip: "203.0.113.11", phone: "0901234567" }))).status, 201);
});

test("missing Vercel IP metadata never creates a global bucket that blocks checkout", async () => {
  const { handler, calls } = createHarness();
  for (let attempt = 0; attempt < 7; attempt += 1) {
    assert.equal(
      (await handler(orderRequest({ includeTrustedIp: false, phone: "0901234567" }))).status,
      201
    );
  }
  assert.equal(calls.createOrder, 7);
  assert.equal(calls.scheduled.length, 7);
});

test("malformed JSON and invalid schemas keep their existing 400 behavior below the IP limit", async () => {
  const malformed = createHarness();
  assert.equal((await malformed.handler(orderRequest({ rawBody: "{" }))).status, 400);
  assert.equal(malformed.calls.createOrder, 0);
  assert.equal(malformed.calls.scheduled.length, 0);

  const invalid = createHarness();
  assert.equal((await invalid.handler(orderRequest({ payload: { invalid: true } }))).status, 400);
  assert.equal(invalid.calls.createOrder, 0);
  assert.equal(invalid.calls.scheduled.length, 0);
});

test("limiter failures fail open and log no customer identity", async () => {
  const calls = { createOrder: 0, scheduled: 0 };
  const logs: unknown[][] = [];
  const originalConsoleError = console.error;
  console.error = (...args) => logs.push(args);
  try {
    const handler = createOrderPostHandler({
      async checkIpRateLimit() {
        throw new Error("203.0.113.10 must stay private");
      },
      async checkCompositeRateLimit() {
        throw new Error("0901234567 must stay private");
      },
      async createOrder() {
        calls.createOrder += 1;
        return {
          orderCode: "TINY-ABCDEF123456",
          status: "pending_confirmation" as const,
          paymentStatus: "unpaid" as const,
          stockConfirmationRequired: false,
          reservationExpiresAt: null
        };
      },
      async getOrderItemsSnapshot() {
        return [];
      },
      async sendNewOrderNotification() {},
      async getOrderReceivedEmailSnapshot() {
        return null;
      },
      async sendOrderReceivedEmail() {
        return { delivered: false, reason: "missing_recipient" as const };
      },
      scheduleAfter() {
        calls.scheduled += 1;
      }
    });

    const response = await handler(orderRequest());
    assert.equal(response.status, 201);
    assert.equal(calls.createOrder, 1);
    assert.equal(calls.scheduled, 1);
    assert.deepEqual(logs, [
      ["Order rate limiter unavailable", { name: "Error" }],
      ["Order rate limiter unavailable", { name: "Error" }]
    ]);
    assert.doesNotMatch(JSON.stringify(logs), /203\.0\.113\.10|0901234567/);
  } finally {
    console.error = originalConsoleError;
  }
});

test("concurrent burst attempts do not obviously overrun the approved limit", async () => {
  const { handler, calls } = createHarness();
  const responses = await Promise.all(
    Array.from({ length: 7 }, (_, index) => handler(orderRequest({ phone: phoneFor(index + 1) })))
  );
  assert.equal(responses.filter((response) => response.status === 201).length, 6);
  assert.equal(responses.filter((response) => response.status === 429).length, 1);
  assert.equal(calls.createOrder, 6);
  assert.equal(calls.scheduled.length, 6);
});

test("a persisted recipient schedules one order-received email after the successful 201", async () => {
  const { handler, calls } = createHarness();

  const response = await handler(orderRequest());
  assert.equal(response.status, 201);
  await runScheduled(calls);

  assert.equal(calls.emailSnapshots, 1);
  assert.equal(calls.emails.length, 1);
  assert.equal(calls.emails[0].customerEmail, "customer@example.test");
  assert.equal(calls.emails[0].orderCode, "TINY-ABCDEF123456");
});

test("order creation failure never schedules a persisted email lookup or send", async () => {
  const { handler, calls } = createHarness({ createOrderFails: true });

  const response = await handler(orderRequest());
  assert.equal(response.status, 500);
  assert.equal(calls.scheduled.length, 0);
  assert.equal(calls.emailSnapshots, 0);
  assert.equal(calls.emails.length, 0);
});

test("a Resend failure does not change the successful order response or block Telegram", async () => {
  const { handler, calls } = createHarness({ emailFails: true });

  const response = await handler(orderRequest());
  assert.equal(response.status, 201);
  await runScheduled(calls);

  assert.equal(calls.notifications, 1);
  assert.equal(calls.emails.length, 1);
});

test("a Telegram failure does not block the order-received email", async () => {
  const { handler, calls } = createHarness({ telegramFails: true });

  const response = await handler(orderRequest());
  assert.equal(response.status, 201);
  await runScheduled(calls);

  assert.equal(calls.notifications, 1);
  assert.equal(calls.emails.length, 1);
});
