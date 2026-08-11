-- Clean the two approved public yarn product URLs without changing product identity.
begin;

do $$
declare
  migrated_rows integer;
begin
  if not exists (
    select 1
    from public.products
    where id = 39
      and slug = 'mac-den-39'
  ) then
    raise exception 'Expected product 39 with slug mac-den-39 was not found';
  end if;

  if not exists (
    select 1
    from public.products
    where id = 40
      and slug = 'milk-bo-40'
  ) then
    raise exception 'Expected product 40 with slug milk-bo-40 was not found';
  end if;

  if exists (
    select 1
    from public.products
    where slug = 'mac-den'
      and id <> 39
  ) then
    raise exception 'Target slug mac-den is already in use';
  end if;

  if exists (
    select 1
    from public.products
    where slug = 'milk-bo'
      and id <> 40
  ) then
    raise exception 'Target slug milk-bo is already in use';
  end if;

  update public.products
  set slug = case id
    when 39 then 'mac-den'
    when 40 then 'milk-bo'
  end
  where (id = 39 and slug = 'mac-den-39')
     or (id = 40 and slug = 'milk-bo-40');

  get diagnostics migrated_rows = row_count;

  if migrated_rows <> 2 then
    raise exception 'Expected to migrate exactly 2 product slugs, migrated %', migrated_rows;
  end if;
end;
$$;

commit;
