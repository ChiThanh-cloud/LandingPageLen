-- Service-role-only import path for color codes and their directly mapped images.
-- Existing variants keep all commerce/inventory fields; new variants are hidden
-- until an admin explicitly reviews their status and stock.

create or replace function public.service_import_scraped_variant_images(
  p_target_slug text,
  p_variants jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product_id bigint;
  v_product_category text;
  v_variant jsonb;
  v_variant_index integer;
  v_code text;
  v_existing_ids bigint[];
  v_batch_size integer;
  v_variant_count integer;
  v_inserted_count integer := 0;
  v_updated_count integer := 0;
begin
  if p_target_slug is null
    or pg_catalog.btrim(p_target_slug) = ''
    or pg_catalog.btrim(p_target_slug) !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception using message = 'TARGET_PRODUCT_SLUG_INVALID', errcode = 'P0001';
  end if;
  if pg_catalog.jsonb_typeof(p_variants) is distinct from 'array' then
    raise exception using message = 'VARIANTS_ONLY_PAYLOAD_INVALID',
      detail = 'Variants must be a JSON array.',
      errcode = 'P0001';
  end if;

  v_batch_size := pg_catalog.jsonb_array_length(p_variants);
  if v_batch_size < 1 or v_batch_size > 500 then
    raise exception using message = 'VARIANTS_ONLY_PAYLOAD_INVALID',
      detail = 'Variant-image batch size must be between 1 and 500.',
      errcode = 'P0001';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('variants-only:' || pg_catalog.btrim(p_target_slug), 0)
  );

  select p.id, p.category
  into v_product_id, v_product_category
  from public.products p
  where p.slug = pg_catalog.btrim(p_target_slug)
  for update;

  if not found then
    raise exception using message = 'TARGET_PRODUCT_NOT_FOUND', errcode = 'P0001';
  end if;
  if v_product_category is distinct from 'yarn' then
    raise exception using message = 'TARGET_PRODUCT_NOT_YARN', errcode = 'P0001';
  end if;

  -- Validate the full batch and reject extra keys before any variant mutation.
  for v_variant, v_variant_index in
    select batch.item, batch.ordinality::integer
    from pg_catalog.jsonb_array_elements(p_variants) with ordinality as batch(item, ordinality)
    order by batch.ordinality
  loop
    if pg_catalog.jsonb_typeof(v_variant) is distinct from 'object'
      or exists (
        select 1
        from pg_catalog.jsonb_object_keys(v_variant) as keys(key)
        where keys.key not in ('name', 'color_code', 'image_url', 'full_image_url', 'sort_order')
      ) then
      raise exception using message = 'VARIANTS_ONLY_PAYLOAD_INVALID',
        detail = pg_catalog.format('Variant %s has an invalid shape.', v_variant_index),
        errcode = 'P0001';
    end if;

    v_code := pg_catalog.btrim(v_variant ->> 'color_code');
    if pg_catalog.jsonb_typeof(v_variant -> 'color_code') is distinct from 'string'
      or v_code = ''
      or pg_catalog.char_length(v_code) > 80
      or pg_catalog.jsonb_typeof(v_variant -> 'name') is distinct from 'string'
      or pg_catalog.btrim(v_variant ->> 'name') is distinct from v_code then
      raise exception using message = 'VARIANTS_ONLY_PAYLOAD_INVALID',
        detail = pg_catalog.format('Variant %s has an invalid color code.', v_variant_index),
        errcode = 'P0001';
    end if;

    if pg_catalog.jsonb_typeof(v_variant -> 'image_url') is distinct from 'string'
      or (v_variant ->> 'image_url') !~ '^https://res[.]cloudinary[.]com/'
      or pg_catalog.char_length(v_variant ->> 'image_url') > 2000
      or pg_catalog.jsonb_typeof(v_variant -> 'full_image_url') is distinct from 'string'
      or (v_variant ->> 'full_image_url') !~ '^https://res[.]cloudinary[.]com/'
      or pg_catalog.char_length(v_variant ->> 'full_image_url') > 2000 then
      raise exception using message = 'VARIANTS_ONLY_PAYLOAD_INVALID',
        detail = pg_catalog.format('Variant %s has an invalid Cloudinary image.', v_variant_index),
        errcode = 'P0001';
    end if;

    if pg_catalog.jsonb_typeof(v_variant -> 'sort_order') is distinct from 'number'
      or (v_variant ->> 'sort_order') !~ '^[0-9]+$'
      or (v_variant ->> 'sort_order')::numeric > 2147483647 then
      raise exception using message = 'VARIANTS_ONLY_PAYLOAD_INVALID',
        detail = pg_catalog.format('Variant %s has an invalid sort_order.', v_variant_index),
        errcode = 'P0001';
    end if;
  end loop;

  if exists (
    select 1
    from pg_catalog.jsonb_array_elements(p_variants) as batch(item)
    group by pg_catalog.btrim(batch.item ->> 'color_code')
    having pg_catalog.count(*) > 1
  ) then
    raise exception using message = 'VARIANTS_ONLY_DUPLICATE_CODE', errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.product_variants pv
    join pg_catalog.jsonb_array_elements(p_variants) as batch(item)
      on pg_catalog.btrim(pv.color_code) = pg_catalog.btrim(batch.item ->> 'color_code')
    where pv.product_id = v_product_id
    group by pg_catalog.btrim(pv.color_code)
    having pg_catalog.count(*) > 1
  ) then
    raise exception using message = 'VARIANTS_ONLY_EXISTING_CODE_CONFLICT', errcode = 'P0001';
  end if;

  for v_variant in
    select batch.item
    from pg_catalog.jsonb_array_elements(p_variants) with ordinality as batch(item, ordinality)
    order by batch.ordinality
  loop
    v_code := pg_catalog.btrim(v_variant ->> 'color_code');
    select pg_catalog.array_agg(pv.id order by pv.id)
    into v_existing_ids
    from public.product_variants pv
    where pv.product_id = v_product_id
      and pg_catalog.btrim(pv.color_code) = v_code;

    if coalesce(pg_catalog.cardinality(v_existing_ids), 0) = 1 then
      update public.product_variants pv
      set
        image_url = v_variant ->> 'image_url',
        full_image_url = v_variant ->> 'full_image_url',
        sort_order = (v_variant ->> 'sort_order')::integer
      where pv.id = v_existing_ids[1];
      v_updated_count := v_updated_count + 1;
    elsif coalesce(pg_catalog.cardinality(v_existing_ids), 0) = 0 then
      insert into public.product_variants (
        product_id,
        name,
        color_code,
        image_url,
        full_image_url,
        status,
        sort_order
      ) values (
        v_product_id,
        v_code,
        v_code,
        v_variant ->> 'image_url',
        v_variant ->> 'full_image_url',
        'hidden',
        (v_variant ->> 'sort_order')::integer
      );
      v_inserted_count := v_inserted_count + 1;
    else
      raise exception using message = 'VARIANTS_ONLY_EXISTING_CODE_CONFLICT', errcode = 'P0001';
    end if;
  end loop;

  select pg_catalog.count(*)::integer
  into v_variant_count
  from public.product_variants pv
  where pv.product_id = v_product_id;

  return pg_catalog.jsonb_build_object(
    'productId', v_product_id,
    'targetSlug', pg_catalog.btrim(p_target_slug),
    'importedCount', v_batch_size,
    'insertedCount', v_inserted_count,
    'updatedCount', v_updated_count,
    'variantCount', v_variant_count
  );
end;
$$;

comment on function public.service_import_scraped_variant_images(text, jsonb)
  is 'Updates only variant images/order by Tiny target slug; inserts new variants hidden; service-role only.';

revoke all on function public.service_import_scraped_variant_images(text, jsonb)
  from public, anon, authenticated;
grant execute on function public.service_import_scraped_variant_images(text, jsonb)
  to service_role;
