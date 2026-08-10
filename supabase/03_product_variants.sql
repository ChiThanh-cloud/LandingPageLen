-- Product variants for yarn color/image tables.
-- Safe to re-run.

create table if not exists public.product_variants (
  id bigserial primary key,
  product_id bigint not null references public.products(id) on delete cascade,
  sku text,
  name text not null,
  color_code text,
  color_name text,
  color_hex text,
  image_url text,
  full_image_url text,
  price numeric,
  status text default 'available',
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.product_variants
  add column if not exists sku text,
  add column if not exists color_code text,
  add column if not exists color_name text,
  add column if not exists color_hex text,
  add column if not exists full_image_url text;

create index if not exists product_variants_product_sort_idx
  on public.product_variants (product_id, sort_order, created_at desc);

create index if not exists product_variants_status_idx
  on public.product_variants (status);

create index if not exists product_variants_product_sku_idx
  on public.product_variants (product_id, sku);

alter table public.product_variants enable row level security;

drop trigger if exists set_product_variants_updated_at on public.product_variants;
create trigger set_product_variants_updated_at
before update on public.product_variants
for each row
execute function public.set_products_updated_at();

create or replace function public.fill_variant_full_image_url()
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

drop trigger if exists fill_variant_full_image_url on public.product_variants;
create trigger fill_variant_full_image_url
before insert or update of image_url, full_image_url
on public.product_variants
for each row
execute function public.fill_variant_full_image_url();

drop policy if exists "Public can read visible product variants" on public.product_variants;
create policy "Public can read visible product variants"
on public.product_variants
for select
to anon
using (coalesce(status, 'available') <> 'hidden');

drop policy if exists "Admin users can read product variants" on public.product_variants;
create policy "Admin users can read product variants"
on public.product_variants
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admin users can insert product variants" on public.product_variants;
create policy "Admin users can insert product variants"
on public.product_variants
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admin users can update product variants" on public.product_variants;
create policy "Admin users can update product variants"
on public.product_variants
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
