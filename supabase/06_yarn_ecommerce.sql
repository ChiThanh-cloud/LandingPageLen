-- Yarn ecommerce fields, slugs, inventory, and wholesale pricing.
-- Safe to re-run. Existing product and variant rows are preserved.

create extension if not exists unaccent;

alter table public.product_variants
  add column if not exists stock integer;

alter table public.product_variants
  drop constraint if exists product_variants_stock_nonnegative;

alter table public.product_variants
  add constraint product_variants_stock_nonnegative
  check (stock is null or stock >= 0);

update public.products
set slug = trim(both '-' from regexp_replace(
  lower(unaccent(coalesce(nullif(trim(name), ''), 'san-pham'))),
  '[^a-z0-9]+',
  '-',
  'g'
)) || '-' || id::text
where slug is null or trim(slug) = '';

create unique index if not exists products_slug_unique_idx
  on public.products (slug)
  where slug is not null;

create table if not exists public.wholesale_prices (
  id bigserial primary key,
  product_id bigint not null references public.products(id) on delete cascade,
  min_quantity integer not null,
  max_quantity integer,
  price numeric not null,
  label text,
  status text default 'available',
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint wholesale_prices_min_quantity_positive check (min_quantity > 0),
  constraint wholesale_prices_max_quantity_valid check (max_quantity is null or max_quantity >= min_quantity),
  constraint wholesale_prices_price_nonnegative check (price >= 0)
);

create index if not exists wholesale_prices_product_sort_idx
  on public.wholesale_prices (product_id, sort_order, min_quantity);

alter table public.wholesale_prices enable row level security;

drop trigger if exists set_wholesale_prices_updated_at on public.wholesale_prices;
create trigger set_wholesale_prices_updated_at
before update on public.wholesale_prices
for each row
execute function public.set_products_updated_at();

drop policy if exists "Public can read visible wholesale prices" on public.wholesale_prices;
create policy "Public can read visible wholesale prices"
on public.wholesale_prices
for select
to anon
using (coalesce(status, 'available') <> 'hidden');

drop policy if exists "Admin users can read wholesale prices" on public.wholesale_prices;
create policy "Admin users can read wholesale prices"
on public.wholesale_prices
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admin users can insert wholesale prices" on public.wholesale_prices;
create policy "Admin users can insert wholesale prices"
on public.wholesale_prices
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admin users can update wholesale prices" on public.wholesale_prices;
create policy "Admin users can update wholesale prices"
on public.wholesale_prices
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
