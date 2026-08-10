-- Public read policy and admin allowlist.
-- Safe to re-run.

alter table public.products enable row level security;

drop policy if exists "Public can read visible products" on public.products;
create policy "Public can read visible products"
on public.products
for select
to anon
using (coalesce(status, 'available') <> 'hidden');

drop policy if exists "Authenticated can read all products" on public.products;
drop policy if exists "Authenticated can insert products" on public.products;
drop policy if exists "Authenticated can update products" on public.products;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

drop policy if exists "Admin users can read products" on public.products;
create policy "Admin users can read products"
on public.products
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admin users can insert products" on public.products;
create policy "Admin users can insert products"
on public.products
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admin users can update products" on public.products;
create policy "Admin users can update products"
on public.products
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
