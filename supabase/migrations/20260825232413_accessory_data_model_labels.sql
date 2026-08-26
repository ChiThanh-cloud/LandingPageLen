-- Generic display metadata for products that are sold as yarn or accessories.
-- This migration deliberately leaves protected categories and all inventory/order
-- functions untouched.

alter table public.products
  add column if not exists unit_label text,
  add column if not exists option_label text;

-- Preserve any label that was entered manually. Only yarn rows with a missing
-- or blank value receive the existing storefront defaults.
update public.products
set
  unit_label = case
    when unit_label is null or pg_catalog.btrim(unit_label) = '' then 'cuộn'
    else unit_label
  end,
  option_label = case
    when option_label is null or pg_catalog.btrim(option_label) = '' then 'Màu'
    else option_label
  end
where category = 'yarn'
  and (
    unit_label is null
    or pg_catalog.btrim(unit_label) = ''
    or option_label is null
    or pg_catalog.btrim(option_label) = ''
  );

do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_constraint
    where conrelid = 'public.products'::pg_catalog.regclass
      and conname = 'products_unit_label_not_blank'
  ) then
    alter table public.products
      add constraint products_unit_label_not_blank
      check (unit_label is null or pg_catalog.btrim(unit_label) <> '');
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_constraint
    where conrelid = 'public.products'::pg_catalog.regclass
      and conname = 'products_option_label_not_blank'
  ) then
    alter table public.products
      add constraint products_option_label_not_blank
      check (option_label is null or pg_catalog.btrim(option_label) <> '');
  end if;
end;
$$;
