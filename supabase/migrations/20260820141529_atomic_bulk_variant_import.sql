-- Atomic product/variant imports for the admin UI and trusted scrape CLI.
-- Public entrypoints share one private variant implementation while keeping
-- their caller-specific authorization and business semantics separate.

create schema if not exists private;
revoke all on schema private from public;

create or replace function private.import_product_variant_batch(
  p_product_id bigint,
  p_variants jsonb,
  p_mode text,
  p_apply boolean
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_variant jsonb;
  v_variant_index integer;
  v_name text;
  v_color_code text;
  v_existing_ids bigint[];
  v_inserted_count integer := 0;
  v_updated_count integer := 0;
  v_batch_size integer;
begin
  if p_mode is null or p_mode not in ('admin', 'scrape', 'scrape_gallery') then
    raise exception using message = 'VARIANT_IMPORT_MODE_INVALID', errcode = 'P0001';
  end if;
  if p_apply is null then
    raise exception using message = 'VARIANT_IMPORT_MODE_INVALID', errcode = 'P0001';
  end if;

  if pg_catalog.jsonb_typeof(p_variants) is distinct from 'array' then
    raise exception using message = 'VARIANT_IMPORT_INVALID',
      detail = 'Variants must be a JSON array.',
      errcode = 'P0001';
  end if;

  v_batch_size := pg_catalog.jsonb_array_length(p_variants);
  if p_mode = 'admin' and (v_batch_size < 1 or v_batch_size > 200) then
    raise exception using message = 'VARIANT_IMPORT_INVALID',
      detail = 'Admin batch size must be between 1 and 200.',
      errcode = 'P0001';
  end if;
  if p_mode = 'scrape' and v_batch_size < 1 then
    raise exception using message = 'VARIANT_IMPORT_INVALID',
      detail = 'Scrape variant batch cannot be empty.',
      errcode = 'P0001';
  end if;
  if p_mode = 'scrape_gallery' and v_batch_size <> 0 then
    raise exception using message = 'VARIANT_IMPORT_INVALID',
      detail = 'Gallery-only import cannot include variant mutations.',
      errcode = 'P0001';
  end if;

  -- Validate the complete payload before any insert or update.
  for v_variant, v_variant_index in
    select batch.item, batch.ordinality::integer
    from pg_catalog.jsonb_array_elements(p_variants) with ordinality as batch(item, ordinality)
    order by batch.ordinality
  loop
    if pg_catalog.jsonb_typeof(v_variant) is distinct from 'object' then
      raise exception using message = 'VARIANT_IMPORT_INVALID',
        detail = pg_catalog.format('Variant %s must be an object.', v_variant_index),
        errcode = 'P0001';
    end if;

    if pg_catalog.jsonb_typeof(v_variant -> 'name') is distinct from 'string'
      or pg_catalog.btrim(v_variant ->> 'name') = ''
      or (
        p_mode = 'admin'
        and pg_catalog.char_length(pg_catalog.btrim(v_variant ->> 'name')) > 120
      ) then
      raise exception using message = 'VARIANT_IMPORT_INVALID',
        detail = pg_catalog.format('Variant %s has an invalid name.', v_variant_index),
        errcode = 'P0001';
    end if;

    if pg_catalog.jsonb_typeof(v_variant -> 'image_url') is distinct from 'string'
      or pg_catalog.btrim(v_variant ->> 'image_url') = ''
      or (
        p_mode = 'admin'
        and (
          pg_catalog.char_length(v_variant ->> 'image_url') > 2000
          or (v_variant ->> 'image_url') !~* '^[a-z][a-z0-9+.-]*:'
        )
      )
      or (
        p_mode = 'scrape'
        and (v_variant ->> 'image_url') !~ '^https://res[.]cloudinary[.]com/'
      ) then
      raise exception using message = 'VARIANT_IMPORT_INVALID',
        detail = pg_catalog.format('Variant %s has an invalid image_url.', v_variant_index),
        errcode = 'P0001';
    end if;

    if v_variant ? 'full_image_url'
      and pg_catalog.jsonb_typeof(v_variant -> 'full_image_url') not in ('string', 'null') then
      raise exception using message = 'VARIANT_IMPORT_INVALID',
        detail = pg_catalog.format('Variant %s has an invalid full_image_url type.', v_variant_index),
        errcode = 'P0001';
    end if;

    if pg_catalog.jsonb_typeof(v_variant -> 'full_image_url') = 'string'
      and (
        (p_mode = 'admin' and (
          pg_catalog.char_length(v_variant ->> 'full_image_url') > 2000
          or (v_variant ->> 'full_image_url') !~* '^[a-z][a-z0-9+.-]*:'
        ))
        or (p_mode = 'scrape' and (v_variant ->> 'full_image_url') !~ '^https://res[.]cloudinary[.]com/')
      ) then
      raise exception using message = 'VARIANT_IMPORT_INVALID',
        detail = pg_catalog.format('Variant %s has an invalid full_image_url.', v_variant_index),
        errcode = 'P0001';
    end if;

    if v_variant ? 'color_code'
      and pg_catalog.jsonb_typeof(v_variant -> 'color_code') not in ('string', 'null') then
      raise exception using message = 'VARIANT_IMPORT_INVALID',
        detail = pg_catalog.format('Variant %s has an invalid color_code type.', v_variant_index),
        errcode = 'P0001';
    end if;

    if pg_catalog.jsonb_typeof(v_variant -> 'color_code') = 'string'
      and p_mode = 'admin'
      and pg_catalog.char_length(v_variant ->> 'color_code') > 80 then
      raise exception using message = 'VARIANT_IMPORT_INVALID',
        detail = pg_catalog.format('Variant %s has a color_code that is too long.', v_variant_index),
        errcode = 'P0001';
    end if;

    if v_variant ? 'color_name'
      and pg_catalog.jsonb_typeof(v_variant -> 'color_name') not in ('string', 'null') then
      raise exception using message = 'VARIANT_IMPORT_INVALID',
        detail = pg_catalog.format('Variant %s has an invalid color_name type.', v_variant_index),
        errcode = 'P0001';
    end if;

    if pg_catalog.jsonb_typeof(v_variant -> 'color_name') = 'string'
      and p_mode = 'admin'
      and pg_catalog.char_length(v_variant ->> 'color_name') > 120 then
      raise exception using message = 'VARIANT_IMPORT_INVALID',
        detail = pg_catalog.format('Variant %s has a color_name that is too long.', v_variant_index),
        errcode = 'P0001';
    end if;

    if v_variant ? 'sku'
      and pg_catalog.jsonb_typeof(v_variant -> 'sku') not in ('string', 'null') then
      raise exception using message = 'VARIANT_IMPORT_INVALID',
        detail = pg_catalog.format('Variant %s has an invalid sku type.', v_variant_index),
        errcode = 'P0001';
    end if;

    if pg_catalog.jsonb_typeof(v_variant -> 'sku') = 'string'
      and p_mode = 'admin'
      and pg_catalog.char_length(v_variant ->> 'sku') > 120 then
      raise exception using message = 'VARIANT_IMPORT_INVALID',
        detail = pg_catalog.format('Variant %s has a sku that is too long.', v_variant_index),
        errcode = 'P0001';
    end if;

    if v_variant ? 'status'
      and (
        pg_catalog.jsonb_typeof(v_variant -> 'status') is distinct from 'string'
        or (v_variant ->> 'status') not in ('available', 'out', 'preorder', 'hidden')
      ) then
      raise exception using message = 'VARIANT_IMPORT_INVALID',
        detail = pg_catalog.format('Variant %s has an invalid status.', v_variant_index),
        errcode = 'P0001';
    end if;

    if pg_catalog.jsonb_typeof(v_variant -> 'sort_order') is distinct from 'number'
      or (v_variant ->> 'sort_order') !~ '^[0-9]+$'
      or (p_mode = 'admin' and (v_variant ->> 'sort_order')::numeric > 100000)
      or (v_variant ->> 'sort_order')::numeric > 2147483647 then
      raise exception using message = 'VARIANT_IMPORT_INVALID',
        detail = pg_catalog.format('Variant %s has an invalid sort_order.', v_variant_index),
        errcode = 'P0001';
    end if;

    if p_mode = 'scrape' then
      v_name := pg_catalog.btrim(v_variant ->> 'name');
      v_color_code := pg_catalog.btrim(v_variant ->> 'color_code');
      if pg_catalog.jsonb_typeof(v_variant -> 'color_code') is distinct from 'string'
        or v_color_code = ''
        or v_color_code is distinct from v_name then
        raise exception using message = 'VARIANT_IMPORT_INVALID',
          detail = pg_catalog.format('Variant %s must use the scraped code for name and color_code.', v_variant_index),
          errcode = 'P0001';
      end if;
    end if;
  end loop;

  if p_mode = 'scrape' and exists (
    select 1
    from pg_catalog.jsonb_array_elements(p_variants) as batch(item)
    group by pg_catalog.btrim(batch.item ->> 'color_code')
    having pg_catalog.count(*) > 1
  ) then
    raise exception using message = 'VARIANT_IMPORT_DUPLICATE_CODE', errcode = 'P0001';
  end if;

  if p_product_id is not null and p_mode = 'admin' and exists (
    select 1
    from (
      select distinct pg_catalog.lower(pg_catalog.btrim(batch.item ->> 'name')) as normalized_name
      from pg_catalog.jsonb_array_elements(p_variants) as batch(item)
    ) requested
    join public.product_variants pv
      on pv.product_id = p_product_id
     and pg_catalog.lower(pv.name) = requested.normalized_name
    group by requested.normalized_name
    having pg_catalog.count(pv.id) > 1
  ) then
    raise exception using message = 'VARIANT_NAME_CONFLICT', errcode = 'P0001';
  end if;

  if p_product_id is not null and p_mode in ('scrape', 'scrape_gallery') and exists (
    select 1
    from public.product_variants pv
    where pv.product_id = p_product_id
      and (pv.color_code is null or pg_catalog.btrim(pv.color_code) = '')
  ) then
    raise exception using message = 'SCRAPE_VARIANT_CODE_MISSING', errcode = 'P0001';
  end if;

  if p_product_id is not null and p_mode in ('scrape', 'scrape_gallery') and exists (
    select 1
    from public.product_variants pv
    where pv.product_id = p_product_id
      and pv.color_code is not null
      and pg_catalog.btrim(pv.color_code) <> ''
    group by pg_catalog.btrim(pv.color_code)
    having pg_catalog.count(*) > 1
  ) then
    raise exception using message = 'SCRAPE_VARIANT_CODE_CONFLICT', errcode = 'P0001';
  end if;

  if not p_apply then
    return pg_catalog.jsonb_build_object(
      'importedCount', v_batch_size,
      'insertedCount', 0,
      'updatedCount', 0
    );
  end if;

  if p_product_id is null or not exists (
    select 1
    from public.products p
    where p.id = p_product_id
      and p.category = 'yarn'
  ) then
    raise exception using message = 'PRODUCT_NOT_YARN', errcode = 'P0001';
  end if;

  for v_variant in
    select batch.item
    from pg_catalog.jsonb_array_elements(p_variants) with ordinality as batch(item, ordinality)
    order by batch.ordinality
  loop
    -- Preserve deterministic payload order. For duplicate admin names, the
    -- legacy last-write-wins behavior is intentional and remains atomic.
    v_name := pg_catalog.btrim(v_variant ->> 'name');
    v_color_code := pg_catalog.btrim(v_variant ->> 'color_code');

    if p_mode = 'admin' then
      select pg_catalog.array_agg(pv.id order by pv.id)
      into v_existing_ids
      from public.product_variants pv
      where pv.product_id = p_product_id
        and pg_catalog.lower(pv.name) = pg_catalog.lower(v_name);
    else
      select pg_catalog.array_agg(pv.id order by pv.id)
      into v_existing_ids
      from public.product_variants pv
      where pv.product_id = p_product_id
        and pg_catalog.btrim(pv.color_code) = v_color_code;
    end if;

    if coalesce(pg_catalog.cardinality(v_existing_ids), 0) > 1 then
      raise exception using message = case
        when p_mode = 'admin' then 'VARIANT_NAME_CONFLICT'
        else 'SCRAPE_VARIANT_CODE_CONFLICT'
      end, errcode = 'P0001';
    elsif coalesce(pg_catalog.cardinality(v_existing_ids), 0) = 1 then
      if p_mode = 'admin' then
        update public.product_variants pv
        set
          name = v_name,
          color_code = case when v_variant ? 'color_code' then v_variant ->> 'color_code' else pv.color_code end,
          color_name = case when v_variant ? 'color_name' then v_variant ->> 'color_name' else pv.color_name end,
          sku = case when v_variant ? 'sku' then v_variant ->> 'sku' else pv.sku end,
          image_url = v_variant ->> 'image_url',
          full_image_url = case when v_variant ? 'full_image_url' then v_variant ->> 'full_image_url' else pv.full_image_url end,
          status = coalesce(v_variant ->> 'status', 'available'),
          sort_order = (v_variant ->> 'sort_order')::integer
        where pv.id = v_existing_ids[1];
      else
        update public.product_variants pv
        set
          product_id = p_product_id,
          name = v_name,
          color_code = v_color_code,
          image_url = v_variant ->> 'image_url',
          full_image_url = v_variant ->> 'full_image_url',
          sort_order = (v_variant ->> 'sort_order')::integer
        where pv.id = v_existing_ids[1];
      end if;
      v_updated_count := v_updated_count + 1;
    else
      insert into public.product_variants (
        product_id,
        name,
        color_code,
        color_name,
        sku,
        image_url,
        full_image_url,
        status,
        sort_order
      ) values (
        p_product_id,
        v_name,
        v_variant ->> 'color_code',
        v_variant ->> 'color_name',
        v_variant ->> 'sku',
        v_variant ->> 'image_url',
        v_variant ->> 'full_image_url',
        case when p_mode = 'admin' then coalesce(v_variant ->> 'status', 'available') else 'available' end,
        (v_variant ->> 'sort_order')::integer
      );
      v_inserted_count := v_inserted_count + 1;
    end if;
  end loop;

  return pg_catalog.jsonb_build_object(
    'importedCount', v_batch_size,
    'insertedCount', v_inserted_count,
    'updatedCount', v_updated_count
  );
end;
$$;

revoke all on function private.import_product_variant_batch(bigint, jsonb, text, boolean)
  from public, anon, authenticated, service_role;

create or replace function public.admin_import_product_variants(
  p_product_id bigint,
  p_variants jsonb,
  p_admin_user uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product_category text;
  v_product_slug text;
  v_result jsonb;
begin
  if not exists (
    select 1
    from public.admin_users au
    where au.user_id = p_admin_user
      and au.active = true
  ) then
    raise exception using message = 'ADMIN_FORBIDDEN', errcode = 'P0001';
  end if;

  if p_product_id is null or p_product_id <= 0 then
    raise exception using message = 'PRODUCT_NOT_FOUND', errcode = 'P0001';
  end if;

  select p.category, p.slug
  into v_product_category, v_product_slug
  from public.products p
  where p.id = p_product_id
  for update;

  if not found then
    raise exception using message = 'PRODUCT_NOT_FOUND', errcode = 'P0001';
  end if;
  if v_product_category is distinct from 'yarn' then
    raise exception using message = 'PRODUCT_NOT_YARN', errcode = 'P0001';
  end if;

  v_result := private.import_product_variant_batch(p_product_id, p_variants, 'admin', true);
  return v_result || pg_catalog.jsonb_build_object('productSlug', v_product_slug);
end;
$$;

comment on function public.admin_import_product_variants(bigint, jsonb, uuid)
  is 'Atomically imports at most 200 yarn variants after active-admin verification.';

revoke all on function public.admin_import_product_variants(bigint, jsonb, uuid)
  from public, anon, authenticated;
grant execute on function public.admin_import_product_variants(bigint, jsonb, uuid)
  to service_role;

create or replace function public.service_import_scraped_product(
  p_slug text,
  p_name text,
  p_price numeric,
  p_description text,
  p_main_image_url text,
  p_update_gallery_only boolean,
  p_sync_price boolean,
  p_variants jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product record;
  v_product_id bigint;
  v_existing_price numeric;
  v_existing_price_text text;
  v_variant_result jsonb := pg_catalog.jsonb_build_object(
    'importedCount', 0,
    'insertedCount', 0,
    'updatedCount', 0
  );
  v_variant_count integer;
begin
  if p_update_gallery_only is null or p_sync_price is null
    or (p_update_gallery_only and p_sync_price) then
    raise exception using message = 'SCRAPE_IMPORT_MODE_INVALID', errcode = 'P0001';
  end if;
  if p_slug is null or pg_catalog.btrim(p_slug) = '' then
    raise exception using message = 'SCRAPE_PRODUCT_SLUG_INVALID', errcode = 'P0001';
  end if;
  if p_name is null or pg_catalog.btrim(p_name) = '' then
    raise exception using message = 'SCRAPE_PRODUCT_NAME_INVALID', errcode = 'P0001';
  end if;
  if p_main_image_url is null
    or p_main_image_url !~ '^https://res[.]cloudinary[.]com/' then
    raise exception using message = 'SCRAPE_PRODUCT_IMAGE_INVALID', errcode = 'P0001';
  end if;
  if not p_update_gallery_only and (p_price is null or p_price <= 0) then
    raise exception using message = 'SCRAPE_PRODUCT_PRICE_INVALID', errcode = 'P0001';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(pg_catalog.btrim(p_slug), 0)
  );

  select p.*
  into v_product
  from public.products p
  where p.slug = pg_catalog.btrim(p_slug)
  for update;

  if found then
    v_product_id := v_product.id;
    if v_product.category is distinct from 'yarn' then
      raise exception using message = 'PRODUCT_NOT_YARN', errcode = 'P0001';
    end if;
  elsif p_update_gallery_only then
    raise exception using message = 'SCRAPE_PRODUCT_NOT_FOUND', errcode = 'P0001';
  end if;

  if p_update_gallery_only then
    perform private.import_product_variant_batch(v_product_id, '[]'::jsonb, 'scrape_gallery', false);
  else
    perform private.import_product_variant_batch(v_product_id, p_variants, 'scrape', false);
  end if;

  if v_product_id is not null and not p_update_gallery_only and not p_sync_price then
    v_existing_price_text := pg_catalog.regexp_replace(
      coalesce(v_product.price, ''),
      '[^0-9.-]',
      '',
      'g'
    );
    if v_existing_price_text !~ '^([0-9]+([.][0-9]*)?|[.][0-9]+)$'
      or v_existing_price_text::numeric <= 0 then
      raise exception using message = 'SCRAPE_PRODUCT_PRICE_INVALID', errcode = 'P0001';
    end if;
    v_existing_price := v_existing_price_text::numeric;
  end if;

  if v_product_id is null then
    insert into public.products (
      slug,
      name,
      category,
      price,
      base_price,
      description,
      image_url,
      full_image_url,
      status,
      updated_at
    ) values (
      pg_catalog.btrim(p_slug),
      pg_catalog.btrim(p_name),
      'yarn',
      p_price::text,
      p_price,
      coalesce(p_description, ''),
      p_main_image_url,
      p_main_image_url,
      'available',
      pg_catalog.clock_timestamp()
    ) returning id into v_product_id;
  elsif p_update_gallery_only then
    update public.products p
    set
      image_url = p_main_image_url,
      full_image_url = p_main_image_url,
      updated_at = pg_catalog.clock_timestamp()
    where p.id = v_product_id;
  else
    update public.products p
    set
      image_url = p_main_image_url,
      full_image_url = p_main_image_url,
      base_price = case when p_sync_price then p_price else v_existing_price end,
      price = case when p_sync_price then p_price::text else p.price end,
      name = case
        when pg_catalog.btrim(coalesce(p.name, '')) = '' then pg_catalog.btrim(p_name)
        else p.name
      end,
      description = case
        when pg_catalog.btrim(coalesce(p.description, '')) = '' then coalesce(p_description, '')
        else p.description
      end,
      updated_at = pg_catalog.clock_timestamp()
    where p.id = v_product_id;
  end if;

  if not p_update_gallery_only then
    v_variant_result := private.import_product_variant_batch(v_product_id, p_variants, 'scrape', true);
  end if;

  select pg_catalog.count(*)::integer
  into v_variant_count
  from public.product_variants pv
  where pv.product_id = v_product_id;

  return v_variant_result || pg_catalog.jsonb_build_object(
    'productId', v_product_id,
    'productSlug', pg_catalog.btrim(p_slug),
    'variantCount', v_variant_count
  );
end;
$$;

comment on function public.service_import_scraped_product(text, text, numeric, text, text, boolean, boolean, jsonb)
  is 'Atomically imports one scraped yarn product and its variants; service-role only.';

revoke all on function public.service_import_scraped_product(text, text, numeric, text, text, boolean, boolean, jsonb)
  from public, anon, authenticated;
grant execute on function public.service_import_scraped_product(text, text, numeric, text, text, boolean, boolean, jsonb)
  to service_role;
