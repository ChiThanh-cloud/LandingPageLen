-- Run only against the disposable PostgreSQL 17 fixture database.
-- All fixtures and the forced-failure constraint are rolled back.

begin;

alter table public.product_variants
add constraint p1b_force_scrape_variant_failure
check (name <> '__P1B_SCRAPE_FORCE_FAILURE__');

-- The real CLI role can execute the wrapper and create a complete product.
set local role service_role;
select public.service_import_scraped_product(
  '__p1b-scrape-new__',
  'P1B scrape new',
  99000,
  'New description',
  'https://res.cloudinary.com/test/image/upload/p1b/new-main.webp',
  false,
  false,
  '[
    {"name":"N01","color_code":"N01","image_url":"https://res.cloudinary.com/test/image/upload/p1b/n01.webp","full_image_url":"https://res.cloudinary.com/test/image/upload/p1b/n01.webp","sort_order":1},
    {"name":"N02","color_code":"N02","image_url":"https://res.cloudinary.com/test/image/upload/p1b/n02.webp","full_image_url":"https://res.cloudinary.com/test/image/upload/p1b/n02.webp","sort_order":2}
  ]'::jsonb
);
reset role;

do $$
declare
  v_product_id bigint;
  v_count integer;
begin
  select p.id into v_product_id
  from public.products p
  where p.slug = '__p1b-scrape-new__'
    and p.name = 'P1B scrape new'
    and p.category = 'yarn'
    and p.price = '99000'
    and p.base_price = 99000
    and p.description = 'New description'
    and p.image_url = 'https://res.cloudinary.com/test/image/upload/p1b/new-main.webp'
    and p.full_image_url = p.image_url
    and p.status = 'available';
  if v_product_id is null then
    raise exception 'TEST_FAILED: service-role new product import';
  end if;

  select pg_catalog.count(*)::integer into v_count
  from public.product_variants pv
  where pv.product_id = v_product_id
    and pv.name = pv.color_code
    and pv.status = 'available';
  if v_count <> 2 then
    raise exception 'TEST_FAILED: service-role new variant import';
  end if;
end;
$$;

-- Existing full import: preserve manual fields, update an existing variant,
-- insert a new one, and retain stale variants.
do $$
declare
  v_product_id bigint;
  v_result jsonb;
  v_count integer;
begin
  insert into public.products (
    name, category, slug, price, base_price, description,
    image_url, full_image_url, status, sort_order
  ) values (
    'Manual product name', 'yarn', '__p1b-scrape-existing__', '120,000đ', 110000,
    'Manual description', 'https://res.cloudinary.com/test/image/upload/p1b/old-main.webp',
    'https://res.cloudinary.com/test/image/upload/p1b/old-main.webp', 'hidden', 42
  ) returning id into v_product_id;

  insert into public.product_variants (
    product_id, name, color_code, color_name, sku, image_url,
    full_image_url, price, status, sort_order, stock
  ) values
    (v_product_id, 'E01', 'E01', 'Manual color', 'MANUAL-SKU',
      'https://res.cloudinary.com/test/image/upload/p1b/e01-old.webp',
      'https://res.cloudinary.com/test/image/upload/p1b/e01-old.webp', 125000, 'out', 8, 7),
    (v_product_id, 'STALE', 'STALE', 'Stale color', 'STALE-SKU',
      'https://res.cloudinary.com/test/image/upload/p1b/stale.webp',
      'https://res.cloudinary.com/test/image/upload/p1b/stale.webp', 130000, 'hidden', 9, 4);

  v_result := public.service_import_scraped_product(
    '__p1b-scrape-existing__',
    'Scraped product name',
    150000,
    'Scraped description',
    'https://res.cloudinary.com/test/image/upload/p1b/existing-main.webp',
    false,
    false,
    '[
      {"name":"E01","color_code":"E01","image_url":"https://res.cloudinary.com/test/image/upload/p1b/e01-new.webp","full_image_url":"https://res.cloudinary.com/test/image/upload/p1b/e01-new.webp","sort_order":1},
      {"name":"E02","color_code":"E02","image_url":"https://res.cloudinary.com/test/image/upload/p1b/e02.webp","full_image_url":"https://res.cloudinary.com/test/image/upload/p1b/e02.webp","sort_order":2}
    ]'::jsonb
  );

  if (v_result ->> 'insertedCount')::integer <> 1
    or (v_result ->> 'updatedCount')::integer <> 1
    or (v_result ->> 'variantCount')::integer <> 3 then
    raise exception 'TEST_FAILED: mixed scrape result counts';
  end if;

  if not exists (
    select 1 from public.products p
    where p.id = v_product_id
      and p.name = 'Manual product name'
      and p.description = 'Manual description'
      and p.price = '120,000đ'
      and p.base_price = 120000
      and p.status = 'hidden'
      and p.sort_order = 42
      and p.image_url = 'https://res.cloudinary.com/test/image/upload/p1b/existing-main.webp'
      and p.full_image_url = p.image_url
  ) then
    raise exception 'TEST_FAILED: existing product preservation';
  end if;

  if not exists (
    select 1 from public.product_variants pv
    where pv.product_id = v_product_id
      and pv.color_code = 'E01'
      and pv.name = 'E01'
      and pv.color_name = 'Manual color'
      and pv.sku = 'MANUAL-SKU'
      and pv.price = 125000
      and pv.status = 'out'
      and pv.stock = 7
      and pv.sort_order = 1
      and pv.image_url = 'https://res.cloudinary.com/test/image/upload/p1b/e01-new.webp'
  ) then
    raise exception 'TEST_FAILED: existing variant preservation';
  end if;

  select pg_catalog.count(*)::integer into v_count
  from public.product_variants pv
  where pv.product_id = v_product_id
    and pv.color_code in ('E02', 'STALE');
  if v_count <> 2 then
    raise exception 'TEST_FAILED: new or stale variant semantics';
  end if;

  perform public.service_import_scraped_product(
    '__p1b-scrape-existing__',
    'Scraped product name',
    175000,
    'Scraped description',
    'https://res.cloudinary.com/test/image/upload/p1b/existing-main-2.webp',
    false,
    true,
    '[{"name":"E01","color_code":"E01","image_url":"https://res.cloudinary.com/test/image/upload/p1b/e01-new-2.webp","full_image_url":"https://res.cloudinary.com/test/image/upload/p1b/e01-new-2.webp","sort_order":1}]'::jsonb
  );
  if not exists (
    select 1 from public.products p
    where p.id = v_product_id and p.price = '175000' and p.base_price = 175000
  ) then
    raise exception 'TEST_FAILED: explicit price sync';
  end if;
end;
$$;

-- Gallery-only import updates only product runtime image fields.
do $$
declare
  v_product_id bigint;
  v_variant_before jsonb;
  v_variant_after jsonb;
begin
  insert into public.products (
    name, category, slug, price, base_price, description,
    image_url, full_image_url, status, sort_order
  ) values (
    'Gallery product', 'yarn', '__p1b-scrape-gallery__', '88000', 88000,
    'Gallery description', 'https://res.cloudinary.com/test/image/upload/p1b/gallery-old.webp',
    'https://res.cloudinary.com/test/image/upload/p1b/gallery-old.webp', 'hidden', 19
  ) returning id into v_product_id;
  insert into public.product_variants (
    product_id, name, color_code, image_url, full_image_url, status, sort_order, stock
  ) values (
    v_product_id, 'G01', 'G01', 'https://res.cloudinary.com/test/image/upload/p1b/g01.webp',
    'https://res.cloudinary.com/test/image/upload/p1b/g01.webp', 'out', 3, 6
  );

  select pg_catalog.to_jsonb(pv) into v_variant_before
  from public.product_variants pv where pv.product_id = v_product_id;

  perform public.service_import_scraped_product(
    '__p1b-scrape-gallery__', 'Ignored scrape name', null, 'Ignored description',
    'https://res.cloudinary.com/test/image/upload/p1b/gallery-new.webp', true, false, '[]'::jsonb
  );

  select pg_catalog.to_jsonb(pv) into v_variant_after
  from public.product_variants pv where pv.product_id = v_product_id;
  if v_variant_after is distinct from v_variant_before then
    raise exception 'TEST_FAILED: gallery-only changed a variant';
  end if;
  if not exists (
    select 1 from public.products p
    where p.id = v_product_id
      and p.name = 'Gallery product'
      and p.price = '88000'
      and p.base_price = 88000
      and p.description = 'Gallery description'
      and p.status = 'hidden'
      and p.sort_order = 19
      and p.image_url = 'https://res.cloudinary.com/test/image/upload/p1b/gallery-new.webp'
      and p.full_image_url = p.image_url
  ) then
    raise exception 'TEST_FAILED: gallery-only product fields';
  end if;
end;
$$;

-- An invalid middle item is rejected before either product or variant writes.
do $$
declare
  v_product_id bigint;
  v_product_before jsonb;
  v_product_after jsonb;
  v_variants_before jsonb;
  v_variants_after jsonb;
begin
  insert into public.products (
    name, category, slug, price, base_price, description,
    image_url, full_image_url, status, sort_order
  ) values (
    'Invalid fixture', 'yarn', '__p1b-scrape-invalid__', '70000', 70000,
    'Before invalid', 'https://res.cloudinary.com/test/image/upload/p1b/invalid-old.webp',
    'https://res.cloudinary.com/test/image/upload/p1b/invalid-old.webp', 'hidden', 31
  ) returning id into v_product_id;
  insert into public.product_variants (product_id, name, color_code, image_url, status, sort_order)
  values (v_product_id, 'I01', 'I01', 'https://res.cloudinary.com/test/image/upload/p1b/i01-old.webp', 'out', 1);

  select pg_catalog.to_jsonb(p) into v_product_before from public.products p where p.id = v_product_id;
  select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(pv) order by pv.id) into v_variants_before
  from public.product_variants pv where pv.product_id = v_product_id;

  begin
    perform public.service_import_scraped_product(
      '__p1b-scrape-invalid__', 'Changed invalid', 71000, 'Changed invalid description',
      'https://res.cloudinary.com/test/image/upload/p1b/invalid-new.webp', false, true,
      '[
        {"name":"I01","color_code":"I01","image_url":"https://res.cloudinary.com/test/image/upload/p1b/i01-new.webp","sort_order":1},
        {"name":"BAD","color_code":"DIFFERENT","image_url":"not-cloudinary","sort_order":2},
        {"name":"I03","color_code":"I03","image_url":"https://res.cloudinary.com/test/image/upload/p1b/i03.webp","sort_order":3}
      ]'::jsonb
    );
    raise exception 'TEST_FAILED: invalid middle scrape item accepted';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'VARIANT_IMPORT_INVALID' then raise; end if;
  end;

  select pg_catalog.to_jsonb(p) into v_product_after from public.products p where p.id = v_product_id;
  select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(pv) order by pv.id) into v_variants_after
  from public.product_variants pv where pv.product_id = v_product_id;
  if v_product_after is distinct from v_product_before
    or v_variants_after is distinct from v_variants_before then
    raise exception 'TEST_FAILED: invalid middle scrape changed database state';
  end if;
end;
$$;

-- A database error on the last item rolls back the earlier product update,
-- existing variant update, and new variant insert exactly.
do $$
declare
  v_product_id bigint;
  v_product_before jsonb;
  v_product_after jsonb;
  v_variants_before jsonb;
  v_variants_after jsonb;
begin
  insert into public.products (
    name, category, slug, price, base_price, description,
    image_url, full_image_url, status, sort_order
  ) values (
    'Rollback fixture', 'yarn', '__p1b-scrape-rollback__', '200000', 200000,
    'Rollback before', 'https://res.cloudinary.com/test/image/upload/p1b/rollback-old.webp',
    'https://res.cloudinary.com/test/image/upload/p1b/rollback-old.webp', 'hidden', 77
  ) returning id into v_product_id;
  insert into public.product_variants (
    product_id, name, color_code, color_name, sku, image_url,
    full_image_url, price, status, sort_order, stock
  ) values
    (v_product_id, 'R01', 'R01', 'R old', 'R-SKU',
      'https://res.cloudinary.com/test/image/upload/p1b/r01-old.webp',
      'https://res.cloudinary.com/test/image/upload/p1b/r01-old.webp', 205000, 'out', 5, 8),
    (v_product_id, 'R02', 'R02', 'R stale', 'R-STALE',
      'https://res.cloudinary.com/test/image/upload/p1b/r02.webp',
      'https://res.cloudinary.com/test/image/upload/p1b/r02.webp', 210000, 'hidden', 6, 3);

  select pg_catalog.to_jsonb(p) into v_product_before from public.products p where p.id = v_product_id;
  select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(pv) order by pv.id) into v_variants_before
  from public.product_variants pv where pv.product_id = v_product_id;

  begin
    perform public.service_import_scraped_product(
      '__p1b-scrape-rollback__', 'Rollback changed', 250000, 'Rollback changed description',
      'https://res.cloudinary.com/test/image/upload/p1b/rollback-new.webp', false, true,
      '[
        {"name":"R01","color_code":"R01","image_url":"https://res.cloudinary.com/test/image/upload/p1b/r01-new.webp","full_image_url":"https://res.cloudinary.com/test/image/upload/p1b/r01-new.webp","sort_order":1},
        {"name":"R03","color_code":"R03","image_url":"https://res.cloudinary.com/test/image/upload/p1b/r03.webp","full_image_url":"https://res.cloudinary.com/test/image/upload/p1b/r03.webp","sort_order":2},
        {"name":"__P1B_SCRAPE_FORCE_FAILURE__","color_code":"__P1B_SCRAPE_FORCE_FAILURE__","image_url":"https://res.cloudinary.com/test/image/upload/p1b/force.webp","full_image_url":"https://res.cloudinary.com/test/image/upload/p1b/force.webp","sort_order":3}
      ]'::jsonb
    );
    raise exception 'TEST_FAILED: forced scrape failure did not fire';
  exception when check_violation then
    null;
  end;

  select pg_catalog.to_jsonb(p) into v_product_after from public.products p where p.id = v_product_id;
  select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(pv) order by pv.id) into v_variants_after
  from public.product_variants pv where pv.product_id = v_product_id;
  if v_product_after is distinct from v_product_before
    or v_variants_after is distinct from v_variants_before then
    raise exception 'TEST_FAILED: forced scrape failure was not fully atomic';
  end if;
end;
$$;

-- Only service_role can invoke the public scrape wrapper, and nobody outside
-- the owner context can bypass it by executing the private core directly.
do $$
begin
  if pg_catalog.has_function_privilege(
      'anon',
      'public.service_import_scraped_product(text,text,numeric,text,text,boolean,boolean,jsonb)',
      'execute'
    )
    or pg_catalog.has_function_privilege(
      'authenticated',
      'public.service_import_scraped_product(text,text,numeric,text,text,boolean,boolean,jsonb)',
      'execute'
    )
    or not pg_catalog.has_function_privilege(
      'service_role',
      'public.service_import_scraped_product(text,text,numeric,text,text,boolean,boolean,jsonb)',
      'execute'
    ) then
    raise exception 'TEST_FAILED: scrape wrapper privileges';
  end if;

  if pg_catalog.has_function_privilege(
      'service_role',
      'private.import_product_variant_batch(bigint,jsonb,text,boolean)',
      'execute'
    ) then
    raise exception 'TEST_FAILED: service role can execute private core';
  end if;
end;
$$;

rollback;
