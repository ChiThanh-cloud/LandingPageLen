import assert from "node:assert/strict";
import test from "node:test";
import { getVerifiedAdminFromClients } from "./auth";
import { type createSupabaseServerClient } from "@/lib/supabase/server";
import { type getSupabaseAdminClient } from "@/lib/supabase/admin";

type SessionClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;
type AdminClient = NonNullable<ReturnType<typeof getSupabaseAdminClient>>;

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
