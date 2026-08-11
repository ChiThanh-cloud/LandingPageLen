-- Move a verified bank-transfer order into Tiny's confirmation queue without
-- changing the existing payment, inventory, or cancellation semantics.
create or replace function public.complete_guest_payos_payment(
  p_provider_order_code bigint,
  p_amount numeric,
  p_payment_link_id text,
  p_reference text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order record;
  v_payment record;
  v_order_id uuid;
  v_item record;
  v_stock integer;
  v_stock_after integer;
  v_attention boolean := false;
  v_movement_id uuid;
  v_now timestamptz := pg_catalog.clock_timestamp();
begin
  select p.order_id
  into v_order_id
  from public.payments p
  where p.provider = 'payos'
    and p.provider_order_code = p_provider_order_code;

  if not found then
    raise exception using message = 'PAYMENT_NOT_FOUND', errcode = 'P0001';
  end if;

  -- Order -> payment -> variants -> reservations is the global lock order used
  -- by payment and admin inventory mutations.
  select
    o.id,
    o.total,
    o.order_status,
    o.payment_method,
    o.payment_status,
    o.stock_confirmation_required,
    o.inventory_attention_required
  into v_order
  from public.orders o
  where o.id = v_order_id
  for update;

  select p.*
  into v_payment
  from public.payments p
  where p.provider = 'payos'
    and p.provider_order_code = p_provider_order_code
  for update;

  if not found or v_order.id is null then
    raise exception using message = 'PAYMENT_NOT_FOUND', errcode = 'P0001';
  end if;

  if v_payment.amount <> p_amount
    or v_order.total is null
    or v_order.total <> p_amount
    or (v_payment.payment_link_id is not null and v_payment.payment_link_id <> p_payment_link_id) then
    raise exception using message = 'PAYMENT_AMOUNT_MISMATCH', errcode = 'P0001';
  end if;

  -- A verified retry acknowledges the existing payment but never consumes
  -- inventory again, including payments completed before this migration.
  if v_payment.status = 'paid' then
    if v_order.payment_status <> 'paid'
      or (
        v_order.payment_method = 'bank_transfer'
        and v_order.order_status = 'pending_payment'
      ) then
      update public.orders
      set
        payment_status = 'paid',
        order_status = case
          when payment_method = 'bank_transfer'
            and order_status = 'pending_payment'
            then 'pending_confirmation'
          else order_status
        end
      where id = v_order.id;
    end if;

    return pg_catalog.jsonb_build_object(
      'status', 'paid',
      'alreadyPaid', true,
      'inventoryAttentionRequired', v_order.inventory_attention_required
    );
  end if;

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
  where sr.order_id = v_order.id
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

    if v_stock is null then
      v_attention := true;

      update public.stock_reservations
      set reservation_status = 'cancelled'
      where order_id = v_order.id
        and variant_id = v_item.variant_id
        and reservation_status = 'active';
    elsif v_stock >= v_item.quantity then
      v_stock_after := v_stock - v_item.quantity;
      v_movement_id := null;

      insert into public.inventory_movements (
        variant_id,
        order_id,
        payment_id,
        movement_type,
        quantity_delta,
        stock_before,
        stock_after,
        reference_key,
        note
      ) values (
        v_item.variant_id,
        v_order.id,
        v_payment.id,
        'payment_sale',
        -v_item.quantity,
        v_stock,
        v_stock_after,
        pg_catalog.format(
          'payment:%s:variant:%s',
          v_payment.id,
          v_item.variant_id
        ),
        'Thanh toán chuyển khoản đã được xác nhận.'
      )
      on conflict (reference_key) do nothing
      returning id into v_movement_id;

      if v_movement_id is not null then
        update public.product_variants
        set stock = v_stock_after
        where id = v_item.variant_id;
      end if;

      update public.stock_reservations
      set
        reservation_status = 'completed',
        completed_at = coalesce(completed_at, v_now)
      where order_id = v_order.id
        and variant_id = v_item.variant_id
        and reservation_status = 'active';
    else
      -- Payment remains successful, but insufficient stock requires a manual
      -- admin decision and physical stock is never allowed to become negative.
      v_attention := true;

      update public.stock_reservations
      set reservation_status = 'cancelled'
      where order_id = v_order.id
        and variant_id = v_item.variant_id
        and reservation_status = 'active';
    end if;
  end loop;

  update public.payments
  set
    status = 'paid',
    reference = nullif(pg_catalog.btrim(p_reference), ''),
    paid_at = v_now
  where id = v_payment.id;

  update public.orders
  set
    payment_status = 'paid',
    order_status = case
      when payment_method = 'bank_transfer'
        and order_status = 'pending_payment'
        then 'pending_confirmation'
      else order_status
    end,
    inventory_attention_required = (
      inventory_attention_required
      or stock_confirmation_required
      or v_attention
    ),
    inventory_reconciled_at = v_now
  where id = v_order.id;

  return pg_catalog.jsonb_build_object(
    'status', 'paid',
    'alreadyPaid', false,
    'inventoryAttentionRequired', (
      v_order.inventory_attention_required
      or v_order.stock_confirmation_required
      or v_attention
    )
  );
end;
$$;

revoke all on function public.complete_guest_payos_payment(bigint, numeric, text, text)
  from public, anon, authenticated;

grant execute on function public.complete_guest_payos_payment(bigint, numeric, text, text)
  to service_role;
