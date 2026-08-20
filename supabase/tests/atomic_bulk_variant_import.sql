-- Run only against a disposable/local database after all migrations.
-- Every fixture and the forced-failure trigger are rolled back.

begin;

create or replace function pg_temp.p1b_force_variant_failure()
returns trigger
language plpgsql
as $$
begin
  if new.name = '__P1B_FORCE_ROLLBACK__' then
    raise exception using message = 'P1B_FORCED_FAILURE', errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger p1b_force_variant_failure
before insert or update on public.product_variants
for each row
execute function pg_temp.p1b_force_variant_failure();

do $$
declare
  v_admin uuid;
  v_yarn_product bigint;
  v_yarn_other_product bigint;
  v_other_product bigint;
  v_existing_variant bigint;
  v_result jsonb;
  v_batch jsonb;
  v_count integer;
  v_text text;
begin
  select u.id into v_admin from auth.users u order by u.created_at limit 1;
  if v_admin is null then
    raise exception 'TEST_SETUP_FAILED: one auth.users row is required';
  end if;

  insert into public.admin_users (user_id, active)
  values (v_admin, true)
  on conflict (user_id) do update set active = excluded.active;

  insert into public.products (name, category, slug, status, sort_order)
  values ('P1B yarn fixture', 'yarn', '__p1b-yarn-fixture__', 'hidden', 99999)
  returning id into v_yarn_product;

  insert into public.products (name, category, slug, status, sort_order)
  values ('P1B non-yarn fixture', 'handmade', '__p1b-other-fixture__', 'hidden', 99999)
  returning id into v_other_product;

  insert into public.products (name, category, slug, status, sort_order)
  values ('P1B other yarn fixture', 'yarn', '__p1b-other-yarn-fixture__', 'hidden', 99999)
  returning id into v_yarn_other_product;

  -- Normal insert of two rows.
  v_result := public.admin_import_product_variants(
    v_yarn_product,
    '[{"name":"P1B A","color_code":"A","image_url":"https://example.com/a.jpg","status":"available","sort_order":1},{"name":"P1B B","color_code":"B","image_url":"https://example.com/b.jpg","status":"hidden","sort_order":2}]'::jsonb,
    v_admin
  );
  if (v_result ->> 'importedCount')::integer <> 2
    or (v_result ->> 'insertedCount')::integer <> 2 then
    raise exception 'TEST_FAILED: normal insert counts';
  end if;

  -- Existing case-insensitive name updates in place and preserves stock.
  insert into public.product_variants (
    product_id, name, color_code, color_name, sku, image_url, full_image_url, status, sort_order, stock
  ) values (
    v_yarn_product, 'P1B Existing', 'OLD', 'Old name', 'OLD-SKU',
    'https://example.com/old.jpg', 'https://example.com/old-full.jpg', 'available', 3, 9
  ) returning id into v_existing_variant;

  v_result := public.admin_import_product_variants(
    v_yarn_product,
    '[{"name":"p1b existing","color_code":"NEW","image_url":"https://example.com/new.jpg","status":"out","sort_order":4}]'::jsonb,
    v_admin
  );
  select pv.color_code into v_text
  from public.product_variants pv
  where pv.id = v_existing_variant and pv.stock = 9 and pv.color_name = 'Old name' and pv.sku = 'OLD-SKU';
  if v_text is distinct from 'NEW' or (v_result ->> 'updatedCount')::integer <> 1 then
    raise exception 'TEST_FAILED: existing update semantics';
  end if;

  -- A same-name variant belonging to another product is never updated.
  insert into public.product_variants (product_id, name, color_code, image_url, status, sort_order)
  values (v_yarn_other_product, 'P1B Product Scoped', 'OTHER', 'https://example.com/other.jpg', 'available', 1);
  perform public.admin_import_product_variants(
    v_yarn_product,
    '[{"name":"P1B Product Scoped","color_code":"TARGET","image_url":"https://example.com/target.jpg","status":"available","sort_order":1}]'::jsonb,
    v_admin
  );
  select pv.color_code into v_text
  from public.product_variants pv
  where pv.product_id = v_yarn_other_product and pv.name = 'P1B Product Scoped';
  if v_text is distinct from 'OTHER' then
    raise exception 'TEST_FAILED: cross-product variant changed';
  end if;

  -- Mixed update and insert.
  v_result := public.admin_import_product_variants(
    v_yarn_product,
    '[{"name":"P1B A","color_code":"A2","image_url":"https://example.com/a2.jpg","status":"available","sort_order":5},{"name":"P1B C","image_url":"https://example.com/c.jpg","status":"preorder","sort_order":6}]'::jsonb,
    v_admin
  );
  if (v_result ->> 'insertedCount')::integer <> 1
    or (v_result ->> 'updatedCount')::integer <> 1 then
    raise exception 'TEST_FAILED: mixed batch counts';
  end if;

  -- Duplicate names inside one batch preserve legacy last-write-wins behavior.
  perform public.admin_import_product_variants(
    v_yarn_product,
    '[{"name":"P1B Duplicate","color_code":"FIRST","image_url":"https://example.com/first.jpg","status":"available","sort_order":7},{"name":"p1b duplicate","color_code":"LAST","image_url":"https://example.com/last.jpg","status":"hidden","sort_order":8}]'::jsonb,
    v_admin
  );
  select pg_catalog.count(*)::integer, pg_catalog.max(pv.color_code)
  into v_count, v_text
  from public.product_variants pv
  where pv.product_id = v_yarn_product and pg_catalog.lower(pv.name) = 'p1b duplicate';
  if v_count <> 1 or v_text is distinct from 'LAST' then
    raise exception 'TEST_FAILED: duplicate last-write-wins';
  end if;

  -- Current maximum batch size succeeds.
  select pg_catalog.jsonb_agg(
    pg_catalog.jsonb_build_object(
      'name', pg_catalog.format('P1B Max %s', series.value),
      'image_url', 'https://example.com/max.jpg',
      'status', 'available',
      'sort_order', series.value
    ) order by series.value
  ) into v_batch
  from pg_catalog.generate_series(1, 200) as series(value);
  v_result := public.admin_import_product_variants(v_yarn_product, v_batch, v_admin);
  if (v_result ->> 'importedCount')::integer <> 200 then
    raise exception 'TEST_FAILED: max batch';
  end if;

  -- Empty and over-limit batches fail before writes.
  begin
    perform public.admin_import_product_variants(v_yarn_product, '[]'::jsonb, v_admin);
    raise exception 'TEST_FAILED: empty batch accepted';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'VARIANT_IMPORT_INVALID' then raise; end if;
  end;

  select v_batch || pg_catalog.jsonb_build_array(
    pg_catalog.jsonb_build_object(
      'name', 'P1B Max 201',
      'image_url', 'https://example.com/max-201.jpg',
      'status', 'available',
      'sort_order', 201
    )
  ) into v_batch;
  begin
    perform public.admin_import_product_variants(v_yarn_product, v_batch, v_admin);
    raise exception 'TEST_FAILED: over-limit batch accepted';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'VARIANT_IMPORT_INVALID' then raise; end if;
  end;

  -- Product and authorization checks.
  begin
    perform public.admin_import_product_variants(9223372036854775807, '[{"name":"X","image_url":"https://example.com/x.jpg","sort_order":1}]'::jsonb, v_admin);
    raise exception 'TEST_FAILED: missing product accepted';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'PRODUCT_NOT_FOUND' then raise; end if;
  end;

  begin
    perform public.admin_import_product_variants(v_other_product, '[{"name":"X","image_url":"https://example.com/x.jpg","sort_order":1}]'::jsonb, v_admin);
    raise exception 'TEST_FAILED: non-yarn product accepted';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'PRODUCT_NOT_YARN' then raise; end if;
  end;

  begin
    perform public.admin_import_product_variants(v_yarn_product, '[{"name":"X","image_url":"https://example.com/x.jpg","sort_order":1}]'::jsonb, pg_catalog.gen_random_uuid());
    raise exception 'TEST_FAILED: unknown admin accepted';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'ADMIN_FORBIDDEN' then raise; end if;
  end;

  update public.admin_users set active = false where user_id = v_admin;
  begin
    perform public.admin_import_product_variants(v_yarn_product, '[{"name":"X","image_url":"https://example.com/x.jpg","sort_order":1}]'::jsonb, v_admin);
    raise exception 'TEST_FAILED: inactive admin accepted';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'ADMIN_FORBIDDEN' then raise; end if;
  end;
  update public.admin_users set active = true where user_id = v_admin;

  -- Field validation and malformed JSON types.
  begin
    perform public.admin_import_product_variants(v_yarn_product, '[{"name":"","image_url":"not-a-url","sort_order":-1}]'::jsonb, v_admin);
    raise exception 'TEST_FAILED: invalid fields accepted';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'VARIANT_IMPORT_INVALID' then raise; end if;
  end;

  begin
    perform public.admin_import_product_variants(v_yarn_product, '["not-an-object"]'::jsonb, v_admin);
    raise exception 'TEST_FAILED: malformed item accepted';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'VARIANT_IMPORT_INVALID' then raise; end if;
  end;

  -- Invalid first, middle, and last items all reject before mutation.
  begin
    perform public.admin_import_product_variants(
      v_yarn_product,
      '[{"name":"","image_url":"not-a-url","sort_order":1},{"name":"P1B Invalid First Marker","image_url":"https://example.com/marker.jpg","sort_order":2}]'::jsonb,
      v_admin
    );
    raise exception 'TEST_FAILED: invalid first item accepted';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'VARIANT_IMPORT_INVALID' then raise; end if;
  end;

  begin
    perform public.admin_import_product_variants(
      v_yarn_product,
      '[{"name":"P1B Invalid Middle A","image_url":"https://example.com/a.jpg","sort_order":1},{"name":"P1B Invalid Middle Bad","image_url":"not-a-url","sort_order":2},{"name":"P1B Invalid Middle C","image_url":"https://example.com/c.jpg","sort_order":3}]'::jsonb,
      v_admin
    );
    raise exception 'TEST_FAILED: invalid middle item accepted';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'VARIANT_IMPORT_INVALID' then raise; end if;
  end;

  begin
    perform public.admin_import_product_variants(
      v_yarn_product,
      '[{"name":"P1B Invalid Last Marker","image_url":"https://example.com/marker.jpg","sort_order":1},{"name":"P1B Invalid Last Bad","image_url":"not-a-url","sort_order":2}]'::jsonb,
      v_admin
    );
    raise exception 'TEST_FAILED: invalid last item accepted';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'VARIANT_IMPORT_INVALID' then raise; end if;
  end;

  select pg_catalog.count(*)::integer into v_count
  from public.product_variants pv
  where pv.product_id = v_yarn_product
    and pv.name in (
      'P1B Invalid First Marker',
      'P1B Invalid Middle A',
      'P1B Invalid Middle C',
      'P1B Invalid Last Marker'
    );
  if v_count <> 0 then
    raise exception 'TEST_FAILED: invalid-position batch left writes';
  end if;

  -- Existing duplicate names are rejected before mutation.
  insert into public.product_variants (product_id, name, image_url, status, sort_order)
  values
    (v_yarn_product, 'P1B Conflict', 'https://example.com/conflict-1.jpg', 'available', 9),
    (v_yarn_product, 'p1b conflict', 'https://example.com/conflict-2.jpg', 'available', 10);
  begin
    perform public.admin_import_product_variants(v_yarn_product, '[{"name":"P1B CONFLICT","image_url":"https://example.com/conflict-new.jpg","status":"available","sort_order":11}]'::jsonb, v_admin);
    raise exception 'TEST_FAILED: ambiguous existing match accepted';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'VARIANT_NAME_CONFLICT' then raise; end if;
  end;

  -- Force a later database failure after both an update and an insert.
  insert into public.product_variants (
    product_id, name, color_code, color_name, sku, image_url, full_image_url, status, sort_order, stock
  ) values
    (v_yarn_product, '__P1B_ROLLBACK_A__', 'A-OLD', 'A old', 'A-SKU', 'https://example.com/a-old.jpg', 'https://example.com/a-old-full.jpg', 'available', 12, 5),
    (v_yarn_product, '__P1B_ROLLBACK_B__', 'B-OLD', 'B old', 'B-SKU', 'https://example.com/b-old.jpg', 'https://example.com/b-old-full.jpg', 'hidden', 13, 7);

  begin
    perform public.admin_import_product_variants(
      v_yarn_product,
      '[{"name":"__P1B_ROLLBACK_A__","color_code":"A-CHANGED","color_name":"A changed","sku":"A-NEW-SKU","image_url":"https://example.com/a-new.jpg","full_image_url":"https://example.com/a-new-full.jpg","status":"out","sort_order":20},{"name":"__P1B_ROLLBACK_C__","color_code":"C-NEW","image_url":"https://example.com/c-new.jpg","status":"available","sort_order":21},{"name":"__P1B_FORCE_ROLLBACK__","image_url":"https://example.com/force.jpg","status":"available","sort_order":22}]'::jsonb,
      v_admin
    );
    raise exception 'TEST_FAILED: forced failure did not fire';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'P1B_FORCED_FAILURE' then raise; end if;
  end;
  select pg_catalog.count(*)::integer into v_count
  from public.product_variants pv
  where pv.product_id = v_yarn_product
    and (
      (
        pv.name = '__P1B_ROLLBACK_A__'
        and pv.color_code = 'A-OLD'
        and pv.color_name = 'A old'
        and pv.sku = 'A-SKU'
        and pv.image_url = 'https://example.com/a-old.jpg'
        and pv.full_image_url = 'https://example.com/a-old-full.jpg'
        and pv.status = 'available'
        and pv.sort_order = 12
        and pv.stock = 5
      )
      or (
        pv.name = '__P1B_ROLLBACK_B__'
        and pv.color_code = 'B-OLD'
        and pv.color_name = 'B old'
        and pv.sku = 'B-SKU'
        and pv.image_url = 'https://example.com/b-old.jpg'
        and pv.full_image_url = 'https://example.com/b-old-full.jpg'
        and pv.status = 'hidden'
        and pv.sort_order = 13
        and pv.stock = 7
      )
    );
  if v_count <> 2 then
    raise exception 'TEST_FAILED: existing rows changed after forced failure';
  end if;

  select pg_catalog.count(*)::integer into v_count
  from public.product_variants pv
  where pv.product_id = v_yarn_product
    and pv.name in ('__P1B_ROLLBACK_C__', '__P1B_FORCE_ROLLBACK__');
  if v_count <> 0 then
    raise exception 'TEST_FAILED: inserted rows survived forced failure';
  end if;

  -- Function grants expose execution only to service_role.
  if pg_catalog.has_function_privilege('anon', 'public.admin_import_product_variants(bigint,jsonb,uuid)', 'execute')
    or pg_catalog.has_function_privilege('authenticated', 'public.admin_import_product_variants(bigint,jsonb,uuid)', 'execute')
    or not pg_catalog.has_function_privilege('service_role', 'public.admin_import_product_variants(bigint,jsonb,uuid)', 'execute') then
    raise exception 'TEST_FAILED: function privileges';
  end if;
end;
$$;

rollback;
