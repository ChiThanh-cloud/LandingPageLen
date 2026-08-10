-- Products base schema.
-- Safe to re-run. It does not delete product rows.

alter table public.products
  add column if not exists name text,
  add column if not exists slug text,
  add column if not exists category text,
  add column if not exists sub_category text,
  add column if not exists description text,
  add column if not exists cover_image text,
  add column if not exists image_url text,
  add column if not exists full_image_url text,
  add column if not exists base_price numeric,
  add column if not exists price numeric,
  add column if not exists weight text,
  add column if not exists yarn_size text,
  add column if not exists knitting_needle text,
  add column if not exists crochet_hook text,
  add column if not exists origin text,
  add column if not exists status text default 'available',
  add column if not exists sort_order integer default 0,
  add column if not exists updated_at timestamptz default now();

update public.products
set status = 'available'
where status is null or trim(status) = '';

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'type'
  ) then
    execute $sql$
      update public.products
      set sub_category = lower(trim(type))
      where sub_category is null
        and type is not null
        and trim(type) <> ''
    $sql$;
  end if;
end;
$$;

create or replace function public.set_products_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row
execute function public.set_products_updated_at();

create extension if not exists pg_trgm;

create index if not exists products_category_sort_idx
  on public.products (category, sort_order, created_at desc);

create index if not exists products_category_sub_category_idx
  on public.products (category, sub_category);

create index if not exists products_status_idx
  on public.products (status);

create index if not exists products_name_trgm_idx
  on public.products using gin (name gin_trgm_ops);

create or replace function public.fill_product_full_image_url()
returns trigger
language plpgsql
as $$
begin
  if new.full_image_url is null or trim(new.full_image_url) = '' then
    new.full_image_url = new.image_url;
  end if;

  return new;
end;
$$;

drop trigger if exists fill_product_full_image_url on public.products;
create trigger fill_product_full_image_url
before insert or update of image_url, full_image_url
on public.products
for each row
execute function public.fill_product_full_image_url();
