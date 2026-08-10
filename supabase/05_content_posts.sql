-- Marketing captions generated for products.
-- Safe to re-run. It does not delete existing captions.

create table if not exists public.content_posts (
  id bigserial primary key,
  product_id bigint not null references public.products(id) on delete cascade,
  facebook_caption text,
  zalo_caption text,
  tiktok_caption text,
  main_keyword text,
  hashtags text[],
  seo_score_note text,
  model text,
  prompt_version text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.content_posts
  add column if not exists facebook_caption text,
  add column if not exists zalo_caption text,
  add column if not exists tiktok_caption text,
  add column if not exists main_keyword text,
  add column if not exists hashtags text[],
  add column if not exists seo_score_note text,
  add column if not exists model text,
  add column if not exists prompt_version text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create index if not exists content_posts_product_id_idx
  on public.content_posts (product_id);

create unique index if not exists content_posts_product_id_unique_idx
  on public.content_posts (product_id);

drop trigger if exists set_content_posts_updated_at on public.content_posts;
create trigger set_content_posts_updated_at
before update on public.content_posts
for each row
execute function public.set_products_updated_at();

alter table public.content_posts enable row level security;

drop policy if exists "Admin users can read content posts" on public.content_posts;
create policy "Admin users can read content posts"
on public.content_posts
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admin users can insert content posts" on public.content_posts;
create policy "Admin users can insert content posts"
on public.content_posts
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admin users can update content posts" on public.content_posts;
create policy "Admin users can update content posts"
on public.content_posts
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
