-- Guest orders and temporary stock reservations for yarn ecommerce.
-- Physical stock is never decremented by this migration's order-creation flow.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  customer_name text not null,
  phone text not null,
  email text,
  province text not null,
  district text not null,
  ward text not null,
  address_line text not null,
  shipping_note text,
  subtotal numeric(14, 2) not null check (subtotal >= 0),
  shipping_fee numeric(14, 2),
  total numeric(14, 2),
  order_status text not null,
  payment_status text not null default 'unpaid',
  payment_method text not null,
  stock_confirmation_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_shipping_fee_nonnegative check (shipping_fee is null or shipping_fee >= 0),
  constraint orders_total_nonnegative check (total is null or total >= 0),
  constraint orders_order_status_valid check (
    order_status in ('pending_confirmation', 'pending_payment', 'confirmed', 'cancelled', 'completed')
  ),
  constraint orders_payment_status_valid check (
    payment_status in ('unpaid', 'paid', 'failed', 'refunded')
  ),
  constraint orders_payment_method_valid check (payment_method in ('cod', 'bank_transfer'))
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id bigint not null references public.products(id),
  variant_id bigint not null references public.product_variants(id),
  product_name_snapshot text not null,
  variant_name_snapshot text not null,
  color_code_snapshot text,
  unit_price numeric(14, 2) not null,
  quantity integer not null,
  line_total numeric(14, 2) not null,
  created_at timestamptz not null default now(),
  constraint order_items_unit_price_positive check (unit_price > 0),
  constraint order_items_quantity_positive check (quantity > 0),
  constraint order_items_line_total_nonnegative check (line_total >= 0)
);

create table if not exists public.stock_reservations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  order_item_id uuid not null unique references public.order_items(id) on delete cascade,
  product_id bigint not null references public.products(id),
  variant_id bigint not null references public.product_variants(id),
  quantity integer not null,
  reservation_status text not null default 'active',
  expires_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stock_reservations_quantity_positive check (quantity > 0),
  constraint stock_reservations_status_valid check (
    reservation_status in ('active', 'completed', 'cancelled')
  )
);

create index if not exists orders_created_at_idx
  on public.orders (created_at desc);

create index if not exists order_items_order_id_idx
  on public.order_items (order_id);

create index if not exists stock_reservations_order_id_idx
  on public.stock_reservations (order_id);

create index if not exists stock_reservations_active_variant_expiry_idx
  on public.stock_reservations (variant_id, expires_at)
  where reservation_status = 'active';

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.stock_reservations enable row level security;

-- Customer PII and order history are server-only in this guest checkout MVP.
revoke all on table public.orders from anon, authenticated;
revoke all on table public.order_items from anon, authenticated;
revoke all on table public.stock_reservations from anon, authenticated;

grant all on table public.orders to service_role;
grant all on table public.order_items to service_role;
grant all on table public.stock_reservations to service_role;

create or replace function public.set_order_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row
execute function public.set_order_updated_at();

drop trigger if exists set_stock_reservations_updated_at on public.stock_reservations;
create trigger set_stock_reservations_updated_at
before update on public.stock_reservations
for each row
execute function public.set_order_updated_at();

-- Creates the order, snapshots trusted catalog data, and creates eligible
-- bank-transfer reservations in one transaction. Expired active rows are
-- intentionally ignored; physical stock was never reduced, so no stock is
-- added back when the 30-minute TTL passes.
create or replace function public.create_guest_order(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_order_item_id uuid;
  v_order_code text;
  v_order_status text;
  v_payment_method text;
  v_subtotal numeric(14, 2) := 0;
  v_line_total numeric(14, 2);
  v_unit_price numeric(14, 2);
  v_reserved integer;
  v_available integer;
  v_stock_confirmation_required boolean := false;
  v_reservation_created boolean := false;
  v_reservation_expires_at timestamptz;
  v_created_at timestamptz := pg_catalog.clock_timestamp();
  v_inserted boolean := false;
  v_attempt integer;
  v_product_id bigint;
  v_variant_id bigint;
  v_item record;
  v_product record;
  v_variant record;
begin
  if p_payload is null
    or pg_catalog.jsonb_typeof(p_payload) <> 'object'
    or pg_catalog.jsonb_typeof(p_payload -> 'items') <> 'array'
    or pg_catalog.jsonb_array_length(p_payload -> 'items') = 0 then
    raise exception using message = 'INVALID_REQUEST', errcode = 'P0001';
  end if;

  v_payment_method := p_payload ->> 'paymentMethod';
  if v_payment_method not in ('cod', 'bank_transfer') then
    raise exception using message = 'INVALID_REQUEST', errcode = 'P0001';
  end if;

  v_order_status := case
    when v_payment_method = 'bank_transfer' then 'pending_payment'
    else 'pending_confirmation'
  end;

  -- The unique constraint is authoritative; retry only the random public code.
  for v_attempt in 1..5 loop
    v_order_code := 'TINY-' || pg_catalog.upper(
      pg_catalog.substring(pg_catalog.replace(pg_catalog.gen_random_uuid()::text, '-', '') from 1 for 12)
    );

    begin
      insert into public.orders (
        order_code,
        customer_name,
        phone,
        email,
        province,
        district,
        ward,
        address_line,
        shipping_note,
        subtotal,
        shipping_fee,
        total,
        order_status,
        payment_status,
        payment_method,
        created_at,
        updated_at
      ) values (
        v_order_code,
        pg_catalog.btrim(p_payload #>> '{customer,name}'),
        pg_catalog.btrim(p_payload #>> '{customer,phone}'),
        nullif(pg_catalog.btrim(p_payload #>> '{customer,email}'), ''),
        pg_catalog.btrim(p_payload #>> '{shipping,province}'),
        pg_catalog.btrim(p_payload #>> '{shipping,district}'),
        pg_catalog.btrim(p_payload #>> '{shipping,ward}'),
        pg_catalog.btrim(p_payload #>> '{shipping,addressLine}'),
        nullif(pg_catalog.btrim(p_payload #>> '{shipping,note}'), ''),
        0,
        null,
        null,
        v_order_status,
        'unpaid',
        v_payment_method,
        v_created_at,
        v_created_at
      ) returning id into v_order_id;

      v_inserted := true;
      exit;
    exception when unique_violation then
      if v_attempt = 5 then
        raise exception using message = 'ORDER_CODE_GENERATION_FAILED', errcode = 'P0001';
      end if;
    end;
  end loop;

  if not v_inserted then
    raise exception using message = 'ORDER_CODE_GENERATION_FAILED', errcode = 'P0001';
  end if;

  for v_item in
    select
      item."productId" as product_id_text,
      item."variantId" as variant_id_text,
      item.quantity
    from pg_catalog.jsonb_to_recordset(p_payload -> 'items')
      as item("productId" text, "variantId" text, quantity integer)
  loop
    v_product_id := v_item.product_id_text::bigint;
    v_variant_id := v_item.variant_id_text::bigint;

    select p.id, p.name, p.base_price, p.price, p.status
    into v_product
    from public.products p
    where p.id = v_product_id;

    if not found or coalesce(v_product.status, 'available') = 'hidden' then
      raise exception using
        message = pg_catalog.format('PRODUCT_UNAVAILABLE|%s|%s', v_product_id, v_variant_id),
        errcode = 'P0001';
    end if;

    -- Serializes order creation per variant so concurrent reservations cannot
    -- both observe the same available stock.
    select
      pv.id,
      pv.product_id,
      pv.name,
      pv.color_name,
      pv.color_code,
      pv.price,
      pv.stock,
      pv.status
    into v_variant
    from public.product_variants pv
    where pv.id = v_variant_id
      and pv.product_id = v_product_id
    for update;

    if not found or coalesce(v_variant.status, 'available') = 'hidden' then
      raise exception using
        message = pg_catalog.format('VARIANT_UNAVAILABLE|%s|%s', v_product_id, v_variant_id),
        errcode = 'P0001';
    end if;

    -- Existing checkout behavior does not automatically apply wholesale rows;
    -- they are informational on the product page. Only the variant override,
    -- then the product price fields, are authoritative here.
    v_unit_price := coalesce(
      nullif(v_variant.price, 0),
      nullif(v_product.base_price, 0),
      nullif(v_product.price, 0)
    );

    if v_unit_price is null or v_unit_price <= 0 then
      raise exception using
        message = pg_catalog.format('PRODUCT_UNAVAILABLE|%s|%s', v_product_id, v_variant_id),
        errcode = 'P0001';
    end if;

    if v_variant.stock is null then
      v_stock_confirmation_required := true;
    else
      select coalesce(pg_catalog.sum(sr.quantity), 0)::integer
      into v_reserved
      from public.stock_reservations sr
      where sr.variant_id = v_variant_id
        and sr.reservation_status = 'active'
        and sr.expires_at > v_created_at;

      v_available := v_variant.stock - v_reserved;
      if v_item.quantity > v_available then
        raise exception using
          message = pg_catalog.format(
            'OUT_OF_STOCK|%s|%s|%s',
            v_product_id,
            v_variant_id,
            greatest(v_available, 0)
          ),
          errcode = 'P0001';
      end if;
    end if;

    v_line_total := v_unit_price * v_item.quantity;
    v_subtotal := v_subtotal + v_line_total;

    insert into public.order_items (
      order_id,
      product_id,
      variant_id,
      product_name_snapshot,
      variant_name_snapshot,
      color_code_snapshot,
      unit_price,
      quantity,
      line_total,
      created_at
    ) values (
      v_order_id,
      v_product_id,
      v_variant_id,
      v_product.name,
      coalesce(
        nullif(pg_catalog.btrim(v_variant.color_name), ''),
        nullif(pg_catalog.btrim(v_variant.name), ''),
        v_variant_id::text
      ),
      nullif(pg_catalog.btrim(v_variant.color_code), ''),
      v_unit_price,
      v_item.quantity,
      v_line_total,
      v_created_at
    ) returning id into v_order_item_id;

    if v_payment_method = 'bank_transfer' and v_variant.stock is not null then
      v_reservation_expires_at := v_created_at + interval '30 minutes';
      insert into public.stock_reservations (
        order_id,
        order_item_id,
        product_id,
        variant_id,
        quantity,
        reservation_status,
        expires_at,
        created_at,
        updated_at
      ) values (
        v_order_id,
        v_order_item_id,
        v_product_id,
        v_variant_id,
        v_item.quantity,
        'active',
        v_reservation_expires_at,
        v_created_at,
        v_created_at
      );
      v_reservation_created := true;
    end if;
  end loop;

  update public.orders
  set
    subtotal = v_subtotal,
    stock_confirmation_required = v_stock_confirmation_required,
    updated_at = v_created_at
  where id = v_order_id;

  return pg_catalog.jsonb_build_object(
    'orderCode', v_order_code,
    'status', v_order_status,
    'paymentStatus', 'unpaid',
    'stockConfirmationRequired', v_stock_confirmation_required,
    'reservationExpiresAt', case
      when v_reservation_created then pg_catalog.to_jsonb(v_reservation_expires_at)
      else null
    end
  );
exception
  when invalid_text_representation or numeric_value_out_of_range or not_null_violation or check_violation then
    raise exception using message = 'INVALID_REQUEST', errcode = 'P0001';
end;
$$;

revoke all on function public.create_guest_order(jsonb) from public, anon, authenticated;
grant execute on function public.create_guest_order(jsonb) to service_role;
