-- payOS payment records for guest bank-transfer orders.
-- Payment confirmation is intentionally isolated from inventory processing.

create sequence public.payos_provider_order_code_seq
  as bigint
  start with 1000000000
  increment by 1
  no cycle;

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  provider text not null,
  provider_order_code bigint not null unique,
  payment_link_id text unique,
  amount numeric(14, 2) not null,
  status text not null default 'pending',
  checkout_url text,
  qr_code text,
  description text,
  reference text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_provider_valid check (provider = 'payos'),
  constraint payments_amount_positive check (amount > 0 and amount = trunc(amount)),
  constraint payments_status_valid check (status in ('pending', 'paid', 'cancelled', 'failed')),
  constraint payments_order_provider_unique unique (order_id, provider)
);

create index payments_order_id_idx on public.payments (order_id);
create index payments_status_idx on public.payments (status);

alter table public.payments enable row level security;

revoke all on table public.payments from public, anon, authenticated;
revoke all on sequence public.payos_provider_order_code_seq from public, anon, authenticated;

grant all on table public.payments to service_role;
grant usage, select on sequence public.payos_provider_order_code_seq to service_role;

drop trigger if exists set_payments_updated_at on public.payments;
create trigger set_payments_updated_at
before update on public.payments
for each row
execute function public.set_order_updated_at();

-- Verifies guest ownership and returns or allocates the single payOS payment
-- record for an order. The trusted amount is always read from orders.total.
create or replace function public.prepare_guest_payos_payment(
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
  v_payment record;
  v_order_code text;
  v_input_phone text;
  v_stored_phone text;
begin
  v_order_code := pg_catalog.upper(pg_catalog.btrim(p_order_code));
  v_input_phone := pg_catalog.regexp_replace(
    pg_catalog.btrim(p_phone),
    '[[:space:].()-]+',
    '',
    'g'
  );

  if v_order_code = '' or v_input_phone = '' then
    raise exception using message = 'ORDER_VERIFICATION_FAILED', errcode = 'P0001';
  end if;

  select
    o.id,
    o.order_code,
    o.phone,
    o.order_status,
    o.payment_status,
    o.payment_method,
    o.total
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

  if v_order.payment_method <> 'bank_transfer' then
    raise exception using message = 'PAYMENT_METHOD_NOT_SUPPORTED', errcode = 'P0001';
  end if;

  if v_order.order_status = 'cancelled' then
    raise exception using message = 'ORDER_CANCELLED', errcode = 'P0001';
  end if;

  if v_order.payment_status = 'paid' then
    raise exception using message = 'ORDER_ALREADY_PAID', errcode = 'P0001';
  end if;

  if v_order.payment_status <> 'unpaid'
    or v_order.total is null
    or v_order.total <= 0
    or v_order.total <> pg_catalog.trunc(v_order.total) then
    raise exception using message = 'PAYMENT_NOT_AVAILABLE', errcode = 'P0001';
  end if;

  select p.*
  into v_payment
  from public.payments p
  where p.order_id = v_order.id
    and p.provider = 'payos'
  for update;

  if found then
    if v_payment.status = 'paid' then
      raise exception using message = 'ORDER_ALREADY_PAID', errcode = 'P0001';
    end if;

    -- A trusted order total change invalidates any previous provider link.
    if v_payment.amount <> v_order.total or v_payment.status <> 'pending' then
      update public.payments
      set
        provider_order_code = pg_catalog.nextval('public.payos_provider_order_code_seq'::regclass),
        payment_link_id = null,
        amount = v_order.total,
        status = 'pending',
        checkout_url = null,
        qr_code = null,
        description = null,
        reference = null,
        paid_at = null
      where id = v_payment.id
      returning * into v_payment;
    end if;
  else
    insert into public.payments (
      order_id,
      provider,
      provider_order_code,
      amount,
      status
    ) values (
      v_order.id,
      'payos',
      pg_catalog.nextval('public.payos_provider_order_code_seq'::regclass),
      v_order.total,
      'pending'
    )
    returning * into v_payment;
  end if;

  return pg_catalog.jsonb_build_object(
    'paymentId', v_payment.id,
    'orderCode', v_order.order_code,
    'providerOrderCode', v_payment.provider_order_code,
    'amount', v_payment.amount,
    'paymentLinkId', v_payment.payment_link_id,
    'checkoutUrl', v_payment.checkout_url,
    'qrCode', v_payment.qr_code,
    'description', v_payment.description
  );
end;
$$;

-- Persists only the verified fields needed from the official payOS response.
create or replace function public.attach_guest_payos_payment(
  p_payment_id uuid,
  p_provider_order_code bigint,
  p_amount numeric,
  p_payment_link_id text,
  p_checkout_url text,
  p_qr_code text,
  p_description text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment record;
begin
  select p.*
  into v_payment
  from public.payments p
  where p.id = p_payment_id
  for update;

  if not found or v_payment.status <> 'pending' then
    raise exception using message = 'PAYMENT_NOT_AVAILABLE', errcode = 'P0001';
  end if;

  if v_payment.provider_order_code <> p_provider_order_code
    or v_payment.amount <> p_amount then
    raise exception using message = 'PAYMENT_RESPONSE_MISMATCH', errcode = 'P0001';
  end if;

  update public.payments
  set
    payment_link_id = p_payment_link_id,
    checkout_url = p_checkout_url,
    qr_code = p_qr_code,
    description = p_description
  where id = v_payment.id
  returning * into v_payment;

  return pg_catalog.jsonb_build_object(
    'paymentId', v_payment.id,
    'orderCode', p_provider_order_code,
    'amount', v_payment.amount,
    'paymentLinkId', v_payment.payment_link_id,
    'checkoutUrl', v_payment.checkout_url,
    'qrCode', v_payment.qr_code,
    'description', v_payment.description
  );
end;
$$;

-- Marks a signature-verified payment and its order paid atomically. This RPC
-- deliberately does not read or write product stock or stock reservations.
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
  v_already_paid boolean;
begin
  select p.order_id
  into v_order_id
  from public.payments p
  where p.provider = 'payos'
    and p.provider_order_code = p_provider_order_code;

  if not found then
    raise exception using message = 'PAYMENT_NOT_FOUND', errcode = 'P0001';
  end if;

  -- Keep lock ordering consistent with payment creation and cancellation.
  select o.id, o.total, o.payment_status
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

  v_already_paid := v_payment.status = 'paid';

  if not v_already_paid then
    update public.payments
    set
      status = 'paid',
      reference = nullif(pg_catalog.btrim(p_reference), ''),
      paid_at = pg_catalog.clock_timestamp()
    where id = v_payment.id;
  end if;

  -- Also repairs an impossible partial state on a safe webhook retry.
  if v_order.payment_status <> 'paid' then
    update public.orders
    set payment_status = 'paid'
    where id = v_order.id;
  end if;

  return pg_catalog.jsonb_build_object(
    'status', 'paid',
    'alreadyPaid', v_already_paid
  );
end;
$$;

revoke all on function public.prepare_guest_payos_payment(text, text)
  from public, anon, authenticated;
revoke all on function public.attach_guest_payos_payment(uuid, bigint, numeric, text, text, text, text)
  from public, anon, authenticated;
revoke all on function public.complete_guest_payos_payment(bigint, numeric, text, text)
  from public, anon, authenticated;

grant execute on function public.prepare_guest_payos_payment(text, text)
  to service_role;
grant execute on function public.attach_guest_payos_payment(uuid, bigint, numeric, text, text, text, text)
  to service_role;
grant execute on function public.complete_guest_payos_payment(bigint, numeric, text, text)
  to service_role;
