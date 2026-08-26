import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

const migrationDirectory = new URL("../../supabase/migrations/", import.meta.url);
const predecessorName = "20260813090000_freeship_same_product_quantity.sql";
const migrationName = "20260826103646_accessory_launch_business_rules.sql";
const predecessor = readFileSync(new URL(predecessorName, migrationDirectory), "utf8");
const migration = readFileSync(new URL(migrationName, migrationDirectory), "utf8");

function functionDefinition(source: string) {
  const start = source.search(/CREATE OR REPLACE FUNCTION public\.create_guest_order/i);
  const endMarker = "$function$;";
  const end = source.indexOf(endMarker, start);
  assert.notEqual(start, -1, "create_guest_order must exist");
  assert.notEqual(end, -1, "create_guest_order must have a complete body");
  return source.slice(start, end + endMarker.length);
}

const predecessorPrice = `    -- Existing checkout behavior does not automatically apply wholesale rows;
    -- they are informational on the product page. Only the variant override,
    -- then the product price fields, are authoritative here.
  v_unit_price := coalesce(
    nullif(v_variant.price, 0),
    nullif(v_product.base_price, 0),
    case
      when pg_catalog.btrim(v_product.price) ~ '^[0-9]+([.][0-9]+)?$'
        then pg_catalog.btrim(v_product.price)::numeric
      else null
    end
);`;

const launchPrice = `    -- Match the storefront: positive variant override, then the legacy product
    -- price, then base_price. Non-positive values always fall through.
    v_unit_price := coalesce(
      case
        when v_variant.price > 0 then v_variant.price
        else null
      end,
      case
        when pg_catalog.btrim(v_product.price::text) ~ '^[0-9]+([.][0-9]+)?$'
          then nullif(pg_catalog.btrim(v_product.price::text)::numeric, 0)
        else null
      end,
      case
        when v_product.base_price > 0 then v_product.base_price
        else null
      end
    );`;

const predecessorFreeship = `    from public.order_items oi
    where oi.order_id = v_order_id
    group by oi.product_id`;

const launchFreeship = `    from public.order_items oi
    join public.products p on p.id = oi.product_id
    where oi.order_id = v_order_id
      and p.category = 'yarn'
    group by oi.product_id`;

test("the launch migration supersedes the authoritative predecessor", () => {
  const definitions = readdirSync(migrationDirectory)
    .filter((name) => name.endsWith(".sql"))
    .sort()
    .filter((name) => /create_guest_order\s*\(/i.test(readFileSync(new URL(name, migrationDirectory), "utf8")));

  assert.deepEqual(definitions.slice(-2), [predecessorName, migrationName]);
});

test("create_guest_order differs from its predecessor only by the four approved business rules", () => {
  const expected = functionDefinition(predecessor)
    .replace(
      "coalesce(v_product.status, 'available') = 'hidden'",
      "coalesce(v_product.status, 'available') in ('hidden', 'out')"
    )
    .replace(
      "coalesce(v_variant.status, 'available') = 'hidden'",
      "coalesce(v_variant.status, 'available') in ('hidden', 'out')"
    )
    .replace(predecessorPrice, () => launchPrice)
    .replace(predecessorFreeship, () => launchFreeship);

  assert.notEqual(expected, functionDefinition(predecessor));
  assert.equal(functionDefinition(migration), expected);
});

test("product status rejects out and hidden while allowing preorder", () => {
  assert.match(migration, /coalesce\(v_product\.status, 'available'\) in \('hidden', 'out'\)/);
  assert.match(migration, /message = pg_catalog\.format\('PRODUCT_UNAVAILABLE\|%s\|%s'/);
  assert.doesNotMatch(migration, /v_product\.status[^\n]*preorder/);
});

test("variant status rejects out and hidden with the established error while allowing preorder", () => {
  assert.match(migration, /coalesce\(v_variant\.status, 'available'\) in \('hidden', 'out'\)/);
  assert.match(migration, /message = pg_catalog\.format\('VARIANT_UNAVAILABLE\|%s\|%s'/);
  assert.doesNotMatch(migration, /v_variant\.status[^\n]*preorder/);
});

test("shipping trusts the product table and aggregates only variants of one yarn product", () => {
  assert.match(migration, /join public\.products p on p\.id = oi\.product_id/);
  assert.match(migration, /p\.category = 'yarn'/);
  assert.match(migration, /group by oi\.product_id[\s\S]*having pg_catalog\.sum\(oi\.quantity\) >= 20/);
  assert.match(migration, /then 0 else 30000 end/);
  assert.doesNotMatch(migration, /item\.(?:category|price)|"category"|"price"/);
});

function qualifiesForDatabaseFreeship(items: Array<{ productId: string; category: string; quantity: number }>) {
  const yarnQuantityByProduct = new Map<string, number>();
  for (const item of items) {
    if (item.category !== "yarn") continue;
    yarnQuantityByProduct.set(
      item.productId,
      (yarnQuantityByProduct.get(item.productId) || 0) + item.quantity
    );
  }
  return [...yarnQuantityByProduct.values()].some((quantity) => quantity >= 20);
}

test("authoritative freeship semantics cover yarn, accessory, variants and mixed carts", () => {
  assert.equal(qualifiesForDatabaseFreeship([{ productId: "milk", category: "yarn", quantity: 20 }]), true);
  assert.equal(qualifiesForDatabaseFreeship([{ productId: "milk", category: "yarn", quantity: 19 }]), false);
  assert.equal(qualifiesForDatabaseFreeship([{ productId: "hook", category: "accessory", quantity: 20 }]), false);
  assert.equal(qualifiesForDatabaseFreeship([
    { productId: "milk", category: "yarn", quantity: 10 },
    { productId: "milk", category: "yarn", quantity: 10 }
  ]), true);
  assert.equal(qualifiesForDatabaseFreeship([
    { productId: "milk", category: "yarn", quantity: 10 },
    { productId: "bear", category: "yarn", quantity: 10 }
  ]), false);
  assert.equal(qualifiesForDatabaseFreeship([
    { productId: "hook", category: "accessory", quantity: 20 },
    { productId: "milk", category: "yarn", quantity: 5 }
  ]), false);
  assert.equal(qualifiesForDatabaseFreeship([
    { productId: "milk", category: "yarn", quantity: 20 },
    { productId: "hook", category: "accessory", quantity: 2 }
  ]), true);
});

function resolvePrice(variantPrice: number | null, productPrice: string | null, basePrice: number | null) {
  if (variantPrice !== null && Number.isFinite(variantPrice) && variantPrice > 0) return variantPrice;
  if (productPrice !== null && /^[0-9]+(?:\.[0-9]+)?$/.test(productPrice.trim())) {
    const parsed = Number(productPrice.trim());
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  if (basePrice !== null && Number.isFinite(basePrice) && basePrice > 0) return basePrice;
  return null;
}

test("RPC price priority covers positive override and every required fallback", () => {
  assert.equal(resolvePrice(25_000, "20000", 20_000), 25_000);
  assert.equal(resolvePrice(15_000, "20000", 20_000), 15_000);
  assert.equal(resolvePrice(null, "20000", 20_000), 20_000);
  assert.equal(resolvePrice(0, "20000", 20_000), 20_000);
  assert.equal(resolvePrice(-5_000, "20000", 20_000), 20_000);
  assert.equal(resolvePrice(null, null, 20_000), 20_000);
  assert.equal(resolvePrice(null, "invalid", 20_000), 20_000);
  assert.equal(resolvePrice(null, "0", 20_000), 20_000);
  assert.equal(resolvePrice(null, "18000", 20_000), 18_000);
  assert.equal(resolvePrice(null, "0", 0), null);

  const variantPriority = migration.indexOf("when v_variant.price > 0");
  const productPriority = migration.indexOf("pg_catalog.btrim(v_product.price::text)", variantPriority);
  const basePriority = migration.indexOf("when v_product.base_price > 0", productPriority);
  assert.ok(variantPriority > 0 && productPriority > variantPriority && basePriority > productPriority);
  assert.match(migration, /if v_unit_price is null or v_unit_price <= 0 then[\s\S]*PRODUCT_UNAVAILABLE/);
});

test("security, reservation, stock and result contracts remain intact", () => {
  assert.match(migration, /LANGUAGE plpgsql[\s\S]*SECURITY DEFINER[\s\S]*SET search_path TO ''/);
  assert.match(migration, /REVOKE ALL[\s\S]*ON FUNCTION public\.create_guest_order\(jsonb\)[\s\S]*FROM public, anon, authenticated/);
  assert.match(migration, /GRANT EXECUTE[\s\S]*ON FUNCTION public\.create_guest_order\(jsonb\)[\s\S]*TO service_role/);
  assert.match(migration, /from public\.product_variants pv[\s\S]*for update;/i);
  assert.match(migration, /reservation_status = 'active'[\s\S]*expires_at > v_created_at/);
  assert.match(migration, /v_available := v_variant\.stock - v_reserved/);
  assert.match(migration, /v_payment_method = 'bank_transfer' and v_variant\.stock is not null/);
  assert.match(migration, /insert into public\.stock_reservations/);
  assert.match(migration, /'orderCode', v_order_code[\s\S]*'reservationExpiresAt'/);
  assert.doesNotMatch(migration, /prepare_guest_payos_payment|attach_guest_payos_payment|complete_guest_payos_payment|admin_confirm_order/);
  assert.doesNotMatch(migration, /alter table|drop (?:table|column|constraint)|delete from|enable row level security/i);
});
