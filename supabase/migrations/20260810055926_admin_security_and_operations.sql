-- Admin allowlist hardening and atomic order/inventory operations.

alter table public.admin_users
  add column if not exists active boolean not null default true;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.active = true
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

-- Add the approved storefront-independent delivery state without rewriting
-- any existing order row.
alter table public.orders
  drop constraint if exists orders_order_status_valid;

alter table public.orders
  add constraint orders_order_status_valid check (
    order_status in (
      'pending_confirmation',
      'pending_payment',
      'confirmed',
      'shipping',
      'cancelled',
      'completed'
    )
  );

-- The unified Next admin performs every catalog mutation after a server-side
-- allowlist check. Browser sessions keep read access through RLS, but cannot
-- mutate catalog, content, or inventory tables directly.
revoke insert, update, delete on table public.products from authenticated;
revoke insert, update, delete on table public.product_variants from authenticated;
revoke insert, update, delete on table public.content_posts from authenticated;

create or replace function public.admin_confirm_order(
  p_order_code text,
  p_admin_user uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order record;
  v_item record;
  v_stock integer;
  v_reserved integer;
  v_stock_after integer;
  v_attention boolean := false;
  v_movement_id uuid;
begin
  if not exists (
    select 1
    from public.admin_users au
    where au.user_id = p_admin_user
      and au.active = true
  ) then
    raise exception using message = 'ADMIN_FORBIDDEN', errcode = 'P0001';
  end if;

  select o.*
  into v_order
  from public.orders o
  where o.order_code = pg_catalog.upper(pg_catalog.btrim(p_order_code))
  for update;

  if not found then
    raise exception using message = 'ORDER_NOT_FOUND', errcode = 'P0001';
  end if;

  if v_order.order_status = 'confirmed' then
    return pg_catalog.jsonb_build_object(
      'status', 'confirmed',
      'alreadyConfirmed', true,
      'inventoryAttentionRequired', v_order.inventory_attention_required
    );
  end if;

  if v_order.order_status not in ('pending_confirmation', 'pending_payment') then
    raise exception using message = 'ORDER_STATUS_INVALID', errcode = 'P0001';
  end if;

  if v_order.payment_method = 'cod' then
    perform pv.id
    from public.product_variants pv
    where pv.id in (
      select oi.variant_id
      from public.order_items oi
      join public.products p on p.id = oi.product_id
      where oi.order_id = v_order.id
        and p.category = 'yarn'
    )
    order by pv.id
    for update;

    perform sr.id
    from public.stock_reservations sr
    where sr.variant_id in (
      select oi.variant_id
      from public.order_items oi
      join public.products p on p.id = oi.product_id
      where oi.order_id = v_order.id
        and p.category = 'yarn'
    )
      and sr.reservation_status = 'active'
      and sr.expires_at > pg_catalog.clock_timestamp()
    order by sr.id
    for update;

    for v_item in
      select oi.variant_id, pg_catalog.sum(oi.quantity)::integer as quantity
      from public.order_items oi
      join public.products p on p.id = oi.product_id
      where oi.order_id = v_order.id
        and p.category = 'yarn'
      group by oi.variant_id
      order by oi.variant_id
    loop
      select pv.stock
      into v_stock
      from public.product_variants pv
      where pv.id = v_item.variant_id;

      select coalesce(pg_catalog.sum(sr.quantity), 0)::integer
      into v_reserved
      from public.stock_reservations sr
      where sr.variant_id = v_item.variant_id
        and sr.order_id <> v_order.id
        and sr.reservation_status = 'active'
        and sr.expires_at > pg_catalog.clock_timestamp();

      if v_stock is null then
        v_attention := true;
      elsif v_stock - v_reserved < v_item.quantity then
        raise exception using
          message = pg_catalog.format(
            'OUT_OF_STOCK|%s|%s',
            v_item.variant_id,
            pg_catalog.greatest(v_stock - v_reserved, 0)
          ),
          errcode = 'P0001';
      else
        v_stock_after := v_stock - v_item.quantity;
        v_movement_id := null;

        insert into public.inventory_movements (
          variant_id,
          order_id,
          movement_type,
          quantity_delta,
          stock_before,
          stock_after,
          reference_key,
          note,
          created_by
        ) values (
          v_item.variant_id,
          v_order.id,
          'cod_confirm',
          -v_item.quantity,
          v_stock,
          v_stock_after,
          pg_catalog.format(
            'cod_confirm:%s:variant:%s',
            v_order.id,
            v_item.variant_id
          ),
          'Admin xác nhận đơn COD.',
          p_admin_user
        )
        on conflict (reference_key) do nothing
        returning id into v_movement_id;

        if v_movement_id is not null then
          update public.product_variants
          set stock = v_stock_after
          where id = v_item.variant_id;
        end if;
      end if;
    end loop;
  end if;

  update public.orders
  set
    order_status = 'confirmed',
    inventory_attention_required = (
      inventory_attention_required
      or stock_confirmation_required
      or v_attention
    ),
    inventory_reconciled_at = case
      when payment_method = 'cod' then pg_catalog.clock_timestamp()
      else inventory_reconciled_at
    end
  where id = v_order.id;

  return pg_catalog.jsonb_build_object(
    'status', 'confirmed',
    'alreadyConfirmed', false,
    'inventoryAttentionRequired', (
      v_order.inventory_attention_required
      or v_order.stock_confirmation_required
      or v_attention
    )
  );
end;
$$;

create or replace function public.admin_transition_order(
  p_order_code text,
  p_next_status text,
  p_admin_user uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order record;
begin
  if not exists (
    select 1 from public.admin_users au
    where au.user_id = p_admin_user and au.active = true
  ) then
    raise exception using message = 'ADMIN_FORBIDDEN', errcode = 'P0001';
  end if;

  select o.id, o.order_status
  into v_order
  from public.orders o
  where o.order_code = pg_catalog.upper(pg_catalog.btrim(p_order_code))
  for update;

  if not found then
    raise exception using message = 'ORDER_NOT_FOUND', errcode = 'P0001';
  end if;

  if v_order.order_status = p_next_status then
    return pg_catalog.jsonb_build_object(
      'status', p_next_status,
      'alreadyUpdated', true
    );
  end if;

  if not (
    (v_order.order_status = 'confirmed' and p_next_status = 'shipping')
    or (v_order.order_status = 'shipping' and p_next_status = 'completed')
  ) then
    raise exception using message = 'ORDER_STATUS_INVALID', errcode = 'P0001';
  end if;

  update public.orders
  set order_status = p_next_status
  where id = v_order.id;

  return pg_catalog.jsonb_build_object(
    'status', p_next_status,
    'alreadyUpdated', false
  );
end;
$$;

create or replace function public.admin_cancel_order(
  p_order_code text,
  p_admin_user uuid,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order record;
  v_item record;
  v_stock integer;
  v_stock_after integer;
  v_attention boolean := false;
  v_movement_id uuid;
begin
  if not exists (
    select 1 from public.admin_users au
    where au.user_id = p_admin_user and au.active = true
  ) then
    raise exception using message = 'ADMIN_FORBIDDEN', errcode = 'P0001';
  end if;

  select o.*
  into v_order
  from public.orders o
  where o.order_code = pg_catalog.upper(pg_catalog.btrim(p_order_code))
  for update;

  if not found then
    raise exception using message = 'ORDER_NOT_FOUND', errcode = 'P0001';
  end if;

  if v_order.order_status = 'cancelled' then
    return pg_catalog.jsonb_build_object(
      'status', 'cancelled',
      'alreadyCancelled', true,
      'paymentStatus', v_order.payment_status
    );
  end if;

  if v_order.order_status not in (
    'pending_confirmation',
    'pending_payment',
    'confirmed'
  ) then
    raise exception using message = 'ORDER_STATUS_INVALID', errcode = 'P0001';
  end if;

  perform pv.id
  from public.product_variants pv
  where pv.id in (
    select distinct im.variant_id
    from public.inventory_movements im
    where im.order_id = v_order.id
      and im.movement_type in ('payment_sale', 'cod_confirm')
  )
  order by pv.id
  for update;

  for v_item in
    select
      im.variant_id,
      (-pg_catalog.sum(im.quantity_delta))::integer as quantity
    from public.inventory_movements im
    where im.order_id = v_order.id
      and im.movement_type in ('payment_sale', 'cod_confirm')
      and im.quantity_delta < 0
    group by im.variant_id
    order by im.variant_id
  loop
    select pv.stock
    into v_stock
    from public.product_variants pv
    where pv.id = v_item.variant_id;

    if v_stock is null then
      -- Tracking was intentionally disabled after the original consumption;
      -- do not invent a new baseline. Flag the order for manual attention.
      v_attention := true;
    else
      v_stock_after := v_stock + v_item.quantity;
      v_movement_id := null;

      insert into public.inventory_movements (
        variant_id,
        order_id,
        movement_type,
        quantity_delta,
        stock_before,
        stock_after,
        reference_key,
        note,
        created_by
      ) values (
        v_item.variant_id,
        v_order.id,
        'order_cancel_restore',
        v_item.quantity,
        v_stock,
        v_stock_after,
        pg_catalog.format(
          'admin_cancel_restore:%s:variant:%s',
          v_order.id,
          v_item.variant_id
        ),
        nullif(pg_catalog.btrim(p_note), ''),
        p_admin_user
      )
      on conflict (reference_key) do nothing
      returning id into v_movement_id;

      if v_movement_id is not null then
        update public.product_variants
        set stock = v_stock_after
        where id = v_item.variant_id;
      end if;
    end if;
  end loop;

  update public.stock_reservations
  set reservation_status = 'cancelled'
  where order_id = v_order.id
    and reservation_status = 'active';

  update public.orders
  set
    order_status = 'cancelled',
    inventory_attention_required = inventory_attention_required or v_attention
  where id = v_order.id;

  return pg_catalog.jsonb_build_object(
    'status', 'cancelled',
    'alreadyCancelled', false,
    'paymentStatus', v_order.payment_status,
    'inventoryAttentionRequired', v_order.inventory_attention_required or v_attention
  );
end;
$$;

create or replace function public.admin_adjust_variant_stock(
  p_variant_id bigint,
  p_new_stock integer,
  p_reason text,
  p_request_id uuid,
  p_admin_user uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_variant record;
  v_delta integer;
  v_movement_type text;
begin
  if not exists (
    select 1 from public.admin_users au
    where au.user_id = p_admin_user and au.active = true
  ) then
    raise exception using message = 'ADMIN_FORBIDDEN', errcode = 'P0001';
  end if;

  if p_new_stock is not null and p_new_stock < 0 then
    raise exception using message = 'STOCK_NEGATIVE', errcode = 'P0001';
  end if;

  select pv.id, pv.stock, p.category
  into v_variant
  from public.product_variants pv
  join public.products p on p.id = pv.product_id
  where pv.id = p_variant_id
  for update of pv;

  if not found or v_variant.category <> 'yarn' then
    raise exception using message = 'VARIANT_NOT_FOUND', errcode = 'P0001';
  end if;

  if v_variant.stock is not distinct from p_new_stock then
    return pg_catalog.jsonb_build_object(
      'variantId', p_variant_id,
      'stock', p_new_stock,
      'unchanged', true
    );
  end if;

  v_delta := case
    when v_variant.stock is null or p_new_stock is null then null
    else p_new_stock - v_variant.stock
  end;

  v_movement_type := case
    when v_variant.stock is null and p_new_stock is not null then 'admin_restock'
    when v_delta is not null and v_delta > 0 then 'admin_restock'
    else 'admin_adjustment'
  end;

  update public.product_variants
  set stock = p_new_stock
  where id = p_variant_id;

  insert into public.inventory_movements (
    variant_id,
    movement_type,
    quantity_delta,
    stock_before,
    stock_after,
    reference_key,
    note,
    created_by
  ) values (
    p_variant_id,
    v_movement_type,
    v_delta,
    v_variant.stock,
    p_new_stock,
    'admin_adjustment:' || p_request_id::text,
    nullif(pg_catalog.btrim(p_reason), ''),
    p_admin_user
  )
  on conflict (reference_key) do nothing;

  return pg_catalog.jsonb_build_object(
    'variantId', p_variant_id,
    'stock', p_new_stock,
    'unchanged', false
  );
end;
$$;

revoke all on function public.admin_confirm_order(text, uuid)
  from public, anon, authenticated;
revoke all on function public.admin_transition_order(text, text, uuid)
  from public, anon, authenticated;
revoke all on function public.admin_cancel_order(text, uuid, text)
  from public, anon, authenticated;
revoke all on function public.admin_adjust_variant_stock(bigint, integer, text, uuid, uuid)
  from public, anon, authenticated;

grant execute on function public.admin_confirm_order(text, uuid) to service_role;
grant execute on function public.admin_transition_order(text, text, uuid) to service_role;
grant execute on function public.admin_cancel_order(text, uuid, text) to service_role;
grant execute on function public.admin_adjust_variant_stock(bigint, integer, text, uuid, uuid) to service_role;
