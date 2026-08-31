-- Run against a disposable database with all migrations applied.
-- The transaction rolls back every fixture and mutation.

begin;

do $$
declare
  v_product_id bigint;
  v_existing_variant_id bigint;
  v_product_before jsonb;
  v_product_after jsonb;
  v_variant_before jsonb;
  v_variant_after jsonb;
  v_result jsonb;
begin
  insert into public.products (
    name, category, slug, price, base_price, description,
    image_url, full_image_url, status, sort_order
  ) values (
    'Variants-only fixture', 'yarn', 'variants-only-fixture-test', '99000', 99000,
    'Must stay unchanged', 'https://res.cloudinary.com/test/image/upload/product-old.webp',
    'https://res.cloudinary.com/test/image/upload/product-old-full.webp', 'hidden', 37
  ) returning id into v_product_id;

  insert into public.product_variants (
    product_id, name, color_code, color_name, sku, image_url,
    full_image_url, price, status, sort_order, stock
  ) values (
    v_product_id, 'Manual name', '1', 'Manual color', 'MANUAL-SKU',
    'https://res.cloudinary.com/test/image/upload/variant-old.webp',
    'https://res.cloudinary.com/test/image/upload/variant-old-full.webp',
    88000, 'out', 9, 6
  ) returning id into v_existing_variant_id;

  select pg_catalog.to_jsonb(p) into v_product_before
  from public.products p where p.id = v_product_id;
  select pg_catalog.to_jsonb(pv) into v_variant_before
  from public.product_variants pv where pv.id = v_existing_variant_id;

  v_result := public.service_import_scraped_variant_images(
    'variants-only-fixture-test',
    '[
      {"name":"1","color_code":"1","image_url":"https://res.cloudinary.com/test/image/upload/variant-new.webp","full_image_url":"https://res.cloudinary.com/test/image/upload/variant-new-full.webp","sort_order":1},
      {"name":"5","color_code":"5","image_url":"https://res.cloudinary.com/test/image/upload/variant-five.webp","full_image_url":"https://res.cloudinary.com/test/image/upload/variant-five-full.webp","sort_order":2}
    ]'::jsonb
  );

  if (v_result ->> 'targetSlug') <> 'variants-only-fixture-test'
    or (v_result ->> 'insertedCount')::integer <> 1
    or (v_result ->> 'updatedCount')::integer <> 1 then
    raise exception 'TEST_FAILED: variants-only result counts';
  end if;

  select pg_catalog.to_jsonb(p) into v_product_after
  from public.products p where p.id = v_product_id;
  if v_product_after is distinct from v_product_before then
    raise exception 'TEST_FAILED: variants-only changed product data';
  end if;

  select pg_catalog.to_jsonb(pv) into v_variant_after
  from public.product_variants pv where pv.id = v_existing_variant_id;
  if (v_variant_after - array['image_url', 'full_image_url', 'sort_order', 'updated_at'])
    is distinct from
    (v_variant_before - array['image_url', 'full_image_url', 'sort_order', 'updated_at']) then
    raise exception 'TEST_FAILED: existing variant protected fields changed';
  end if;
  if (v_variant_after ->> 'image_url') <> 'https://res.cloudinary.com/test/image/upload/variant-new.webp'
    or (v_variant_after ->> 'sort_order')::integer <> 1 then
    raise exception 'TEST_FAILED: existing variant image/order did not update';
  end if;

  if not exists (
    select 1
    from public.product_variants pv
    where pv.product_id = v_product_id
      and pv.name = '5'
      and pv.color_code = '5'
      and pv.status = 'hidden'
      and pv.stock is null
      and pv.price is null
      and pv.image_url = 'https://res.cloudinary.com/test/image/upload/variant-five.webp'
  ) then
    raise exception 'TEST_FAILED: new variant safe defaults';
  end if;
end;
$$;

do $$
begin
  begin
    perform public.service_import_scraped_variant_images(
      'variants-only-missing-test',
      '[{"name":"1","color_code":"1","image_url":"https://res.cloudinary.com/test/image/upload/1.webp","full_image_url":"https://res.cloudinary.com/test/image/upload/1.webp","sort_order":1}]'::jsonb
    );
    raise exception 'TEST_FAILED: missing target accepted';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'TARGET_PRODUCT_NOT_FOUND' then raise; end if;
  end;

  if exists (select 1 from public.products where slug = 'variants-only-missing-test') then
    raise exception 'TEST_FAILED: missing target created a product';
  end if;
end;
$$;

rollback;
