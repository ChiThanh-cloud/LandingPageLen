import assert from "node:assert/strict";
import test from "node:test";
import { getVerifiedAdminFromClients } from "./auth";
import { type createSupabaseServerClient } from "@/lib/supabase/server";
import { type getSupabaseAdminClient } from "@/lib/supabase/admin";

type SessionClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;
type AdminClient = NonNullable<ReturnType<typeof getSupabaseAdminClient>>;

function clientsFor({
  claims = { sub: "admin-id", email: "admin@tiny.test" } as { sub?: string; email?: string } | null,
  allowlist = null as { user_id: string; active: boolean } | null,
  claimsError = null as Error | null
} = {}) {
  const calls = { table: "", selected: "", filters: [] as Array<[string, unknown]> };
  const allowlistQuery = {
    select(columns: string) { calls.selected = columns; return this; },
    eq(column: string, value: unknown) { calls.filters.push([column, value]); return this; },
    async maybeSingle() {
      const requiresActive = calls.filters.some(([column, value]) => column === "active" && value === true);
      return { data: requiresActive && allowlist?.active !== true ? null : allowlist, error: null };
    }
  };
  const sessionClient = {
    auth: { async getClaims() { return { data: claims ? { claims } : null, error: claimsError }; } }
  } as unknown as SessionClient;
  const adminClient = {
    from(table: string) { calls.table = table; return allowlistQuery; }
  } as unknown as AdminClient;
  return { calls, sessionClient, adminClient };
}

test("an unauthenticated caller is rejected before the admin allowlist query", async () => {
  const { calls, sessionClient, adminClient } = clientsFor({ claims: null });
  assert.equal(await getVerifiedAdminFromClients(sessionClient, adminClient), null);
  assert.equal(calls.table, "");
});

test("an authenticated user without an active admin allowlist record is rejected", async () => {
  const calls = {
    table: "",
    selected: "",
    filters: [] as Array<[string, unknown]>
  };
  const allowlistQuery = {
    select(columns: string) {
      calls.selected = columns;
      return this;
    },
    eq(column: string, value: unknown) {
      calls.filters.push([column, value]);
      return this;
    },
    async maybeSingle() {
      return { data: null, error: null };
    }
  };
  const sessionClient = {
    auth: {
      async getClaims() {
        return {
          data: { claims: { sub: "authenticated-customer-id", email: "customer@tiny.test" } },
          error: null
        };
      }
    }
  } as unknown as SessionClient;
  const adminClient = {
    from(table: string) {
      calls.table = table;
      return allowlistQuery;
    }
  } as unknown as AdminClient;

  const verifiedAdmin = await getVerifiedAdminFromClients(sessionClient, adminClient);

  assert.equal(verifiedAdmin, null);
  assert.equal(calls.table, "admin_users");
  assert.equal(calls.selected, "user_id,active");
  assert.deepEqual(calls.filters, [
    ["user_id", "authenticated-customer-id"],
    ["active", true]
  ]);
});

test("an inactive admin is rejected by the active allowlist filter", async () => {
  const { calls, sessionClient, adminClient } = clientsFor({ allowlist: { user_id: "admin-id", active: false } });
  assert.equal(await getVerifiedAdminFromClients(sessionClient, adminClient), null);
  assert.deepEqual(calls.filters, [["user_id", "admin-id"], ["active", true]]);
});

test("an active allowlisted admin receives the verified server identity", async () => {
  const { sessionClient, adminClient } = clientsFor({ allowlist: { user_id: "admin-id", active: true } });
  assert.deepEqual(await getVerifiedAdminFromClients(sessionClient, adminClient), {
    id: "admin-id",
    email: "admin@tiny.test"
  });
});
