-- Final launch rules for guest orders: product-level availability, yarn-only
-- same-product freeship, and storefront/RPC price parity.
-- Existing orders and product data are intentionally not changed.

CREATE OR REPLACE FUNCTION public.create_guest_order(p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_order_id uuid;
  v_order_item_id uuid;
  v_order_code text;
  v_order_status text;
  v_payment_method text;
  v_subtotal numeric(14, 2) := 0;
  v_shipping_fee numeric(14, 2);
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
      pg_catalog.substr(
        pg_catalog.replace(pg_catalog.gen_random_uuid()::text, '-', ''),
        1,
        12
      )
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

    if not found or coalesce(v_product.status, 'available') in ('hidden', 'out') then
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

    if not found or coalesce(v_variant.status, 'available') in ('hidden', 'out') then
      raise exception using
        message = pg_catalog.format('VARIANT_UNAVAILABLE|%s|%s', v_product_id, v_variant_id),
        errcode = 'P0001';
    end if;

    -- Match the storefront: positive variant override, then the legacy product
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

  select case when exists (
    select 1
    from public.order_items oi
    join public.products p on p.id = oi.product_id
    where oi.order_id = v_order_id
      and p.category = 'yarn'
    group by oi.product_id
    having pg_catalog.sum(oi.quantity) >= 20
  ) then 0 else 30000 end
  into v_shipping_fee;

  update public.orders
  set
    subtotal = v_subtotal,
    shipping_fee = v_shipping_fee,
    total = v_subtotal + v_shipping_fee,
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
$function$;

REVOKE ALL
ON FUNCTION public.create_guest_order(jsonb)
FROM public, anon, authenticated;

GRANT EXECUTE
ON FUNCTION public.create_guest_order(jsonb)
TO service_role;
