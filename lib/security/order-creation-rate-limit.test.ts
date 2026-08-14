import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  createOrderCreationRateLimiter,
  getTrustedOrderClientIp,
  OrderRateLimiterUnavailableError
} from "./order-creation-rate-limit";

const migration = readFileSync(
  new URL("../../supabase/migrations/20260813110000_order_creation_rate_limit.sql", import.meta.url),
  "utf8"
);
const lookupMigration = readFileSync(
  new URL("../../supabase/migrations/20260813120000_order_lookup_rate_limit_scopes.sql", import.meta.url),
  "utf8"
);
const cancelMigration = readFileSync(
  new URL("../../supabase/migrations/20260813130000_order_cancel_rate_limit_scopes.sql", import.meta.url),
  "utf8"
);

test("trusted order IP extraction uses only Vercel metadata and skips limiting when it is unavailable", () => {
  assert.equal(getTrustedOrderClientIp(new Request("https://lentiny.xyz/api/orders", {
    headers: { "x-vercel-forwarded-for": "2001:db8::1" }
  })), "2001:db8::1");
  assert.equal(getTrustedOrderClientIp(new Request("https://lentiny.xyz/api/orders", {
    headers: { "x-forwarded-for": "203.0.113.99" }
  })), null);
  assert.equal(getTrustedOrderClientIp(new Request("https://lentiny.xyz/api/orders", {
    headers: { "x-vercel-forwarded-for": "not-an-ip" }
  })), null);
});

test("production limiter sends exact approved policies with opaque HMAC keys", async () => {
  const calls: Array<{ name: string; entries: Array<Record<string, unknown>> }> = [];
  const limiter = createOrderCreationRateLimiter({
    getHashSecret: () => "unit-test-secret",
    getClient: () => ({
      async rpc(name, args) {
        calls.push({ name, entries: args.p_entries });
        return { data: { allowed: true, retryAfterSeconds: 0 }, error: null };
      }
    })
  });
  const request = new Request("https://lentiny.xyz/api/orders", {
    headers: { "x-vercel-forwarded-for": "203.0.113.10" }
  });

  await limiter.checkIp(request);
  await limiter.checkComposite(request, "0901234567");
  await limiter.checkLookupIp(request);
  await limiter.checkLookupComposite(request, "TINY-ABCDEF123456");
  await limiter.checkCancelIp(request);
  await limiter.checkCancelComposite(request, "TINY-ABCDEF123456");

  assert.deepEqual(calls.map((call) => call.name), [
    "check_order_creation_rate_limits",
    "check_order_creation_rate_limits",
    "check_order_creation_rate_limits",
    "check_order_creation_rate_limits",
    "check_order_creation_rate_limits",
    "check_order_creation_rate_limits"
  ]);
  assert.deepEqual(calls[0].entries.map((entry) => ({
    scope: entry.scope,
    limit: entry.limit,
    windowSeconds: entry.windowSeconds
  })), [
    { scope: "ip_burst", limit: 6, windowSeconds: 60 },
    { scope: "ip_sustained", limit: 30, windowSeconds: 3600 }
  ]);
  assert.deepEqual(calls[1].entries.map((entry) => ({
    scope: entry.scope,
    limit: entry.limit,
    windowSeconds: entry.windowSeconds
  })), [
    { scope: "ip_phone", limit: 3, windowSeconds: 1800 }
  ]);
  assert.deepEqual(calls[2].entries.map((entry) => ({
    scope: entry.scope,
    limit: entry.limit,
    windowSeconds: entry.windowSeconds
  })), [
    { scope: "lookup_ip_burst", limit: 12, windowSeconds: 60 },
    { scope: "lookup_ip_sustained", limit: 60, windowSeconds: 3600 }
  ]);
  assert.deepEqual(calls[3].entries.map((entry) => ({
    scope: entry.scope,
    limit: entry.limit,
    windowSeconds: entry.windowSeconds
  })), [
    { scope: "lookup_ip_order", limit: 6, windowSeconds: 900 }
  ]);
  assert.deepEqual(calls[4].entries.map((entry) => ({
    scope: entry.scope,
    limit: entry.limit,
    windowSeconds: entry.windowSeconds
  })), [
    { scope: "cancel_ip_burst", limit: 6, windowSeconds: 60 },
    { scope: "cancel_ip_sustained", limit: 20, windowSeconds: 3600 }
  ]);
  assert.deepEqual(calls[5].entries.map((entry) => ({
    scope: entry.scope,
    limit: entry.limit,
    windowSeconds: entry.windowSeconds
  })), [
    { scope: "cancel_ip_order", limit: 4, windowSeconds: 900 }
  ]);

  const serialized = JSON.stringify(calls);
  assert.doesNotMatch(serialized, /203\.0\.113\.10|0901234567|TINY-ABCDEF123456|unit-test-secret/);
  for (const call of calls) {
    for (const entry of call.entries) assert.match(String(entry.keyHash), /^[0-9a-f]{64}$/);
  }
});

test("production limiter normalizes decisions and reports storage unavailability to the fail-open handler", async () => {
  const blockedLimiter = createOrderCreationRateLimiter({
    getHashSecret: () => "unit-test-secret",
    getClient: () => ({
      async rpc() {
        return { data: { allowed: false, retryAfterSeconds: 12.2 }, error: null };
      }
    })
  });
  assert.deepEqual(
    await blockedLimiter.checkIp(new Request("https://lentiny.xyz/api/orders", {
      headers: { "x-vercel-forwarded-for": "203.0.113.10" }
    })),
    { allowed: false, retryAfterSeconds: 13 }
  );

  const unavailableLimiter = createOrderCreationRateLimiter({
    getHashSecret: () => "",
    getClient: () => null
  });
  await assert.rejects(
    unavailableLimiter.checkIp(new Request("https://lentiny.xyz/api/orders", {
      headers: { "x-vercel-forwarded-for": "203.0.113.10" }
    })),
    OrderRateLimiterUnavailableError
  );
});

test("missing trusted IP does not invoke a shared limiter bucket", async () => {
  let calls = 0;
  const limiter = createOrderCreationRateLimiter({
    getHashSecret: () => "unit-test-secret",
    getClient: () => ({
      async rpc() {
        calls += 1;
        return { data: { allowed: false, retryAfterSeconds: 60 }, error: null };
      }
    })
  });
  const request = new Request("https://lentiny.xyz/api/orders");

  assert.deepEqual(await limiter.checkIp(request), { allowed: true, retryAfterSeconds: 0 });
  assert.deepEqual(
    await limiter.checkComposite(request, "0901234567"),
    { allowed: true, retryAfterSeconds: 0 }
  );
  assert.deepEqual(await limiter.checkLookupIp(request), { allowed: true, retryAfterSeconds: 0 });
  assert.deepEqual(
    await limiter.checkLookupComposite(request, "TINY-ABCDEF123456"),
    { allowed: true, retryAfterSeconds: 0 }
  );
  assert.deepEqual(await limiter.checkCancelIp(request), { allowed: true, retryAfterSeconds: 0 });
  assert.deepEqual(
    await limiter.checkCancelComposite(request, "TINY-ABCDEF123456"),
    { allowed: true, retryAfterSeconds: 0 }
  );
  assert.equal(calls, 0);
});

test("Postgres limiter is atomic, private, bounded, and derives retry timing from its fixed window", () => {
  assert.match(migration, /primary key \(scope, key_hash\)/i);
  assert.match(migration, /on conflict \(scope, key_hash\) do update/i);
  assert.match(migration, /current_limit\.attempt_count \+ 1/i);
  assert.match(migration, /if v_attempt_count > v_limit then/i);
  assert.match(migration, /v_window_started_at[\s\S]*make_interval\(secs => v_window_seconds\)[\s\S]*- v_now/i);
  assert.match(migration, /limit 100/i);
  assert.match(migration, /revoke all on table private\.order_creation_rate_limits from public, anon, authenticated/i);
  assert.match(migration, /revoke all on function public\.check_order_creation_rate_limits\(jsonb\)[\s\S]*from public, anon, authenticated/i);
  assert.match(migration, /grant execute on function public\.check_order_creation_rate_limits\(jsonb\)[\s\S]*to service_role/i);

  const tableDefinition = migration.match(/create table[\s\S]*?\n\);/)?.[0] || "";
  assert.doesNotMatch(tableDefinition, /customer|address|request_body|phone\s+text|ip\s+inet/i);
});

test("lookup migration extends only allowed scopes and preserves the private atomic limiter contract", () => {
  assert.match(lookupMigration, /drop constraint if exists order_creation_rate_limits_scope_valid/i);
  assert.match(lookupMigration, /lookup_ip_burst[\s\S]*lookup_ip_sustained[\s\S]*lookup_ip_order/i);
  assert.match(lookupMigration, /on conflict \(scope, key_hash\) do update/i);
  assert.match(lookupMigration, /security definer/i);
  assert.match(lookupMigration, /set search_path = ''/i);
  assert.match(lookupMigration, /revoke all on table private\.order_creation_rate_limits from public, anon, authenticated/i);
  assert.match(lookupMigration, /revoke all on function public\.check_order_creation_rate_limits\(jsonb\)[\s\S]*from public, anon, authenticated/i);
  assert.match(lookupMigration, /grant execute on function public\.check_order_creation_rate_limits\(jsonb\)[\s\S]*to service_role/i);
  assert.match(lookupMigration, /extract\(epoch from/i);
  assert.doesNotMatch(lookupMigration, /pg_catalog\.extract/i);
  assert.doesNotMatch(lookupMigration, /phone\s+(?:text|varchar)|ip\s+(?:inet|text)|order_code\s+text/i);
});

test("cancel migration extends only allowed scopes and preserves the private atomic limiter contract", () => {
  assert.match(cancelMigration, /drop constraint if exists order_creation_rate_limits_scope_valid/i);
  assert.match(cancelMigration, /lookup_ip_burst[\s\S]*lookup_ip_sustained[\s\S]*lookup_ip_order/i);
  assert.match(cancelMigration, /cancel_ip_burst[\s\S]*cancel_ip_sustained[\s\S]*cancel_ip_order/i);
  assert.match(cancelMigration, /on conflict \(scope, key_hash\) do update/i);
  assert.match(cancelMigration, /security definer/i);
  assert.match(cancelMigration, /set search_path = ''/i);
  assert.match(cancelMigration, /revoke all on table private\.order_creation_rate_limits from public, anon, authenticated/i);
  assert.match(cancelMigration, /revoke all on function public\.check_order_creation_rate_limits\(jsonb\)[\s\S]*from public, anon, authenticated/i);
  assert.match(cancelMigration, /grant execute on function public\.check_order_creation_rate_limits\(jsonb\)[\s\S]*to service_role/i);
  assert.match(cancelMigration, /extract\(epoch from/i);
  assert.doesNotMatch(cancelMigration, /pg_catalog\.extract/i);
  assert.doesNotMatch(cancelMigration, /phone\s+(?:text|varchar)|ip\s+(?:inet|text)|order_code\s+text/i);
});
