import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  createPaymentReturnUrls,
  createPayOSPayment,
  PaymentFlowError,
  processPayOSWebhook,
  TINY_PROVIDER_ORDER_CODE_MINIMUM,
  type PaymentProvider,
  type PaymentRepository,
  type PreparedPaymentRecord,
  type ProviderPayment,
  type VerifiedWebhookPayment
} from "./payment-core";
import {
  createPayOSPaymentRequestSchema,
  getSafeZodIssueDiagnostics,
  verifiedPayOSWebhookSchema
} from "./payment-schema";

const prepared: PreparedPaymentRecord = {
  paymentId: "5c72b38e-617e-478e-ab3c-d03e1effa181",
  orderCode: "TINY-ABCDEF123456",
  providerOrderCode: 1_000_000_001,
  amount: 58_800,
  paymentLinkId: null,
  checkoutUrl: null,
  qrCode: null,
  description: null
};

const providerPayment: ProviderPayment = {
  orderCode: prepared.providerOrderCode,
  amount: prepared.amount,
  paymentLinkId: "payment-link-id",
  checkoutUrl: "https://pay.payos.vn/web/payment-link-id",
  qrCode: "00020101021238570010A000000727012700069704220113TESTACCOUNT",
  description: "TINY ABCDEF123456"
};

function createDependencies(options?: {
  prepared?: PreparedPaymentRecord;
  prepareError?: PaymentFlowError;
  verifyError?: PaymentFlowError;
  verifiedWebhook?: unknown;
  markPaid?: (payment: VerifiedWebhookPayment) => Promise<{ alreadyPaid: boolean }>;
}) {
  const calls = {
    providerCreate: 0,
    attach: [] as ProviderPayment[],
    verifiedWebhook: [] as unknown[],
    markedPaid: [] as VerifiedWebhookPayment[]
  };
  const repository: PaymentRepository = {
    async prepare() {
      if (options?.prepareError) throw options.prepareError;
      return options?.prepared || prepared;
    },
    async attach(_payment, response) {
      calls.attach.push(response);
    },
    async markPaid(payment) {
      calls.markedPaid.push(payment);
      return options?.markPaid?.(payment) || { alreadyPaid: false };
    }
  };
  const provider: PaymentProvider = {
    async create(input) {
      calls.providerCreate += 1;
      assert.equal(input.amount, prepared.amount);
      return providerPayment;
    },
    async verify(webhook) {
      calls.verifiedWebhook.push(webhook);
      if (options?.verifyError) throw options.verifyError;
      return options?.verifiedWebhook || {
        orderCode: prepared.providerOrderCode,
        amount: prepared.amount,
        paymentLinkId: providerPayment.paymentLinkId,
        reference: "FT240001",
        code: "00"
      };
    }
  };
  return { repository, provider, calls };
}

test("COD order does not create a PayOS payment", async () => {
  const deps = createDependencies({
    prepareError: new PaymentFlowError(
      "PAYMENT_METHOD_NOT_SUPPORTED",
      409,
      "unsupported"
    )
  });
  await assert.rejects(
    createPayOSPayment(
      { orderCode: prepared.orderCode, phone: "0901234567", appUrl: "https://lentiny.xyz" },
      deps
    ),
    (error: unknown) => error instanceof PaymentFlowError
      && error.code === "PAYMENT_METHOD_NOT_SUPPORTED"
  );
  assert.equal(deps.calls.providerCreate, 0);
});

test("bank transfer creates a provider payment with trusted database amount", async () => {
  const deps = createDependencies();
  const result = await createPayOSPayment(
    { orderCode: prepared.orderCode, phone: "0901234567", appUrl: "https://lentiny.xyz" },
    deps
  );
  assert.equal(deps.calls.providerCreate, 1);
  assert.equal(result.amount, 58_800);
  assert.equal(result.qrCode, providerPayment.qrCode);
});

test("client amount is rejected instead of trusted", () => {
  const parsed = createPayOSPaymentRequestSchema.safeParse({
    orderCode: prepared.orderCode,
    phone: "0901234567",
    amount: 1_000
  });
  assert.equal(parsed.success, false);
});

for (const scenario of [
  ["wrong phone", "ORDER_VERIFICATION_FAILED"],
  ["cancelled order", "ORDER_CANCELLED"],
  ["paid order", "ORDER_ALREADY_PAID"]
] as const) {
  test(`${scenario[0]} does not create a provider payment`, async () => {
    const deps = createDependencies({
      prepareError: new PaymentFlowError(scenario[1], 409, scenario[0])
    });
    await assert.rejects(
      createPayOSPayment(
        { orderCode: prepared.orderCode, phone: "0901234567", appUrl: "https://lentiny.xyz" },
        deps
      )
    );
    assert.equal(deps.calls.providerCreate, 0);
  });
}

test("an existing pending payment is reused without another provider request", async () => {
  const reusable = {
    ...prepared,
    paymentLinkId: providerPayment.paymentLinkId,
    checkoutUrl: providerPayment.checkoutUrl,
    qrCode: providerPayment.qrCode,
    description: providerPayment.description
  };
  const deps = createDependencies({ prepared: reusable });
  const result = await createPayOSPayment(
    { orderCode: prepared.orderCode, phone: "0901234567", appUrl: "https://lentiny.xyz" },
    deps
  );
  assert.equal(deps.calls.providerCreate, 0);
  assert.deepEqual(result, reusable);
});

test("provider paymentLinkId and exact QR payload are passed to persistence", async () => {
  const deps = createDependencies();
  const result = await createPayOSPayment(
    { orderCode: prepared.orderCode, phone: "0901234567", appUrl: "https://lentiny.xyz" },
    deps
  );
  assert.equal(deps.calls.attach[0]?.paymentLinkId, providerPayment.paymentLinkId);
  assert.equal(deps.calls.attach[0]?.qrCode, providerPayment.qrCode);
  assert.equal(result.qrCode, providerPayment.qrCode);
});

test("invalid webhook signature never reaches the paid update", async () => {
  const deps = createDependencies({
    verifyError: new PaymentFlowError(
      "PAYMENT_VERIFICATION_FAILED",
      400,
      "invalid"
    )
  });
  await assert.rejects(processPayOSWebhook({}, deps));
  assert.equal(deps.calls.markedPaid.length, 0);
});

test("valid webhook forwards trusted provider identifiers to atomic paid update", async () => {
  const deps = createDependencies();
  const result = await processPayOSWebhook({}, deps);
  assert.deepEqual(result, {
    kind: "payment",
    alreadyPaid: false,
    providerOrderCode: prepared.providerOrderCode
  });
  assert.deepEqual(deps.calls.markedPaid[0], {
    orderCode: prepared.providerOrderCode,
    amount: prepared.amount,
    paymentLinkId: providerPayment.paymentLinkId,
    reference: "FT240001",
    code: "00"
  });
});

test("amount mismatch does not report a paid webhook", async () => {
  const deps = createDependencies({
    markPaid: async () => {
      throw new PaymentFlowError("PAYMENT_AMOUNT_MISMATCH", 409, "mismatch");
    }
  });
  await assert.rejects(
    processPayOSWebhook({}, deps),
    (error: unknown) => error instanceof PaymentFlowError
      && error.code === "PAYMENT_AMOUNT_MISMATCH"
  );
});

test("webhook retry is idempotently acknowledged", async () => {
  const deps = createDependencies({ markPaid: async () => ({ alreadyPaid: true }) });
  const result = await processPayOSWebhook({}, deps);
  assert.deepEqual(result, {
    kind: "payment",
    alreadyPaid: true,
    providerOrderCode: prepared.providerOrderCode
  });
});

test("signed events outside Tiny's provider order namespace are acknowledged without a paid update", async () => {
  const deps = createDependencies({
    verifiedWebhook: {
      orderCode: TINY_PROVIDER_ORDER_CODE_MINIMUM - 1,
      amount: prepared.amount,
      paymentLinkId: providerPayment.paymentLinkId,
      reference: "sample-reference",
      code: "00"
    }
  });
  const result = await processPayOSWebhook({ sample: true }, deps);
  assert.deepEqual(result, { kind: "ignored_signed_non_tiny" });
  assert.equal(deps.calls.markedPaid.length, 0);
});

test("the original webhook object, including extra signed fields, reaches the provider unchanged", async () => {
  const rawWebhook = {
    code: "00",
    data: {
      orderCode: prepared.providerOrderCode,
      extraSignedField: "preserve-me"
    },
    signature: "opaque-signature"
  };
  const deps = createDependencies();
  await processPayOSWebhook(rawWebhook, deps);
  assert.equal(deps.calls.verifiedWebhook[0], rawWebhook);
});

test("malformed verified provider output is rejected before any paid update", async () => {
  const deps = createDependencies({
    verifiedWebhook: {
      orderCode: "not-a-number",
      amount: prepared.amount,
      paymentLinkId: providerPayment.paymentLinkId,
      reference: "reference",
      code: "00"
    }
  });
  await assert.rejects(
    processPayOSWebhook({}, deps),
    (error: unknown) => error instanceof PaymentFlowError
      && error.code === "PAYMENT_VERIFIED_PAYLOAD_INVALID"
      && error.status === 400
  );
  assert.equal(deps.calls.markedPaid.length, 0);
});

test("unknown provider order codes in Tiny's namespace remain retryable", async () => {
  const deps = createDependencies({
    markPaid: async () => {
      throw new PaymentFlowError("PAYMENT_NOT_FOUND", 503, "missing payment");
    }
  });
  await assert.rejects(
    processPayOSWebhook({}, deps),
    (error: unknown) => error instanceof PaymentFlowError
      && error.code === "PAYMENT_NOT_FOUND"
      && error.status === 503
  );
});

test("paymentLinkId mismatch does not report a paid webhook", async () => {
  const deps = createDependencies({
    markPaid: async () => {
      throw new PaymentFlowError("PAYMENT_AMOUNT_MISMATCH", 409, "link mismatch");
    }
  });
  await assert.rejects(
    processPayOSWebhook({}, deps),
    (error: unknown) => error instanceof PaymentFlowError && error.status === 409
  );
});

test("safe Zod diagnostics never include webhook values", () => {
  const parsed = verifiedPayOSWebhookSchema.safeParse({
    orderCode: "secret-order-code",
    amount: prepared.amount,
    paymentLinkId: "sensitive-payment-link",
    reference: "sensitive-reference",
    code: "00"
  });
  assert.equal(parsed.success, false);
  if (!parsed.success) {
    const diagnostics = JSON.stringify(getSafeZodIssueDiagnostics(parsed.error));
    assert.doesNotMatch(diagnostics, /secret-order-code|sensitive-payment-link|sensitive-reference/);
  }
});

test("payment return and cancel URLs only navigate to the Tiny order page", () => {
  const urls = createPaymentReturnUrls("https://lentiny.xyz/", prepared.orderCode);
  assert.equal(
    urls.returnUrl,
    "https://lentiny.xyz/dat-hang-thanh-cong/TINY-ABCDEF123456?payment=returned"
  );
  assert.equal(
    urls.cancelUrl,
    "https://lentiny.xyz/dat-hang-thanh-cong/TINY-ABCDEF123456?payment=cancelled"
  );
  assert.doesNotMatch(urls.cancelUrl, /\/cancel(?:\/|$)/);
});

test("payment migration updates payment state only and keeps inventory untouched", async () => {
  const migration = await readFile(
    path.join(process.cwd(), "supabase/migrations/20260810052222_payos_payments.sql"),
    "utf8"
  );
  const completion = migration.slice(migration.indexOf("create or replace function public.complete_guest_payos_payment"));
  assert.match(completion, /update public\.payments[\s\S]*status = 'paid'/);
  assert.match(completion, /update public\.orders[\s\S]*payment_status = 'paid'/);
  assert.doesNotMatch(completion, /set\s+order_status\s*=/i);
  assert.doesNotMatch(completion, /update\s+public\.product_variants/i);
  assert.doesNotMatch(completion, /update\s+public\.stock_reservations/i);
  assert.doesNotMatch(completion, /delete\s+from/i);
});

test("payment table is private and provider order codes come from a sequence", async () => {
  const migration = await readFile(
    path.join(process.cwd(), "supabase/migrations/20260810052222_payos_payments.sql"),
    "utf8"
  );
  assert.match(migration, /create sequence public\.payos_provider_order_code_seq/);
  assert.match(migration, /alter table public\.payments enable row level security/);
  assert.match(migration, /revoke all on table public\.payments from public, anon, authenticated/);
  assert.match(migration, /constraint payments_order_provider_unique unique \(order_id, provider\)/);
});

test("payment ownership canonicalizes both submitted and stored phones", async () => {
  const migration = await readFile(
    path.join(process.cwd(), "supabase/migrations/20260810052222_payos_payments.sql"),
    "utf8"
  );
  assert.match(migration, /v_input_phone := pg_catalog\.regexp_replace/);
  assert.match(migration, /v_stored_phone := pg_catalog\.regexp_replace/);
  assert.match(migration, /v_input_phone <> v_stored_phone/);
});

test("client payment component contains no server payment secrets", async () => {
  const component = await readFile(
    path.join(process.cwd(), "components/payments/PayOSPayment.tsx"),
    "utf8"
  );
  assert.doesNotMatch(component, /PAYOS_CLIENT_ID|PAYOS_API_KEY|PAYOS_CHECKSUM_KEY/);
  assert.doesNotMatch(component, /providerOrderCode|paymentLinkId|signature|webhook/i);
});
