-- Guest order cancellation for unpaid, unprocessed orders.
-- This flow never deletes order data and never changes physical stock.

create or replace function public.cancel_guest_order(
  p_order_code text,
  p_phone text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order record;
  v_order_code text;
  v_input_phone text;
  v_stored_phone text;
  v_cancelled_reservations integer := 0;
begin
  v_order_code := pg_catalog.upper(pg_catalog.btrim(p_order_code));

  -- Canonicalize both values using the same conservative convention.
  -- Do not translate +84 to 0 (or the reverse).
  v_input_phone := pg_catalog.regexp_replace(
    pg_catalog.btrim(p_phone),
    '[[:space:].()-]+',
    '',
    'g'
  );

  if v_order_code = '' or v_input_phone = '' then
    raise exception using message = 'ORDER_VERIFICATION_FAILED', errcode = 'P0001';
  end if;

  -- Lock first so verification, state transition, and reservation cancellation
  -- happen atomically and concurrent requests are idempotent.
  select
    o.id,
    o.phone,
    o.order_status,
    o.payment_status
  into v_order
  from public.orders o
  where o.order_code = v_order_code
  for update;

  if not found then
    raise exception using message = 'ORDER_VERIFICATION_FAILED', errcode = 'P0001';
  end if;

  v_stored_phone := pg_catalog.regexp_replace(
    pg_catalog.btrim(v_order.phone),
    '[[:space:].()-]+',
    '',
    'g'
  );

  if v_stored_phone = '' or v_input_phone <> v_stored_phone then
    raise exception using message = 'ORDER_VERIFICATION_FAILED', errcode = 'P0001';
  end if;

  -- Idempotency still requires a successful phone verification above. Repair
  -- any inconsistent active reservation without touching physical stock.
  if v_order.order_status = 'cancelled' then
    update public.stock_reservations
    set reservation_status = 'cancelled'
    where order_id = v_order.id
      and reservation_status = 'active';

    get diagnostics v_cancelled_reservations = row_count;

    return pg_catalog.jsonb_build_object(
      'status', 'cancelled',
      'alreadyCancelled', true,
      'cancelledReservations', v_cancelled_reservations
    );
  end if;

  if v_order.payment_status = 'paid' then
    raise exception using message = 'PAID_ORDER_CONTACT_TINY', errcode = 'P0001';
  end if;

  if v_order.payment_status <> 'unpaid'
    or v_order.order_status not in ('pending_confirmation', 'pending_payment') then
    raise exception using message = 'ORDER_NOT_CANCELLABLE', errcode = 'P0001';
  end if;

  update public.orders
  set order_status = 'cancelled'
  where id = v_order.id;

  update public.stock_reservations
  set reservation_status = 'cancelled'
  where order_id = v_order.id
    and reservation_status = 'active';

  get diagnostics v_cancelled_reservations = row_count;

  return pg_catalog.jsonb_build_object(
    'status', 'cancelled',
    'alreadyCancelled', false,
    'cancelledReservations', v_cancelled_reservations
  );
end;
$$;

revoke all on function public.cancel_guest_order(text, text)
  from public, anon, authenticated;

grant execute on function public.cancel_guest_order(text, text)
  to service_role;
