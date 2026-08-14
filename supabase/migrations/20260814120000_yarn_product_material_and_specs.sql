-- Add a dedicated material field and normalize the four public yarn rows.
-- This migration updates existing stable product identities; it never inserts rows.

begin;

alter table public.products
  add column if not exists material text;

do $$
declare
  matched_rows integer;
begin
  select count(*) into matched_rows
  from public.products
  where category = 'yarn'
    and slug in ('milk-bo', 'nhung-dua', 'nhung-gau', 'mac-den');

  if matched_rows <> 4 then
    raise exception 'Expected exactly four existing yarn products with stable public slugs; found %', matched_rows;
  end if;
end;
$$;

update public.products
set
  name = case slug
    when 'milk-bo' then 'Milk Bò'
    when 'nhung-dua' then 'Nhung Đũa'
    when 'nhung-gau' then 'Nhung Gấu'
    when 'mac-den' then 'Milk Cotton Mác Đen 50g'
  end,
  description = case slug
    when 'milk-bo' then 'Cuộn Milk Bò 50g ±2g, cỡ sợi 2.5mm, thành phần 80% Cotton + 20% Milk Protein.'
    when 'nhung-dua' then 'Cuộn Nhung Đũa 100g ±10g, cỡ sợi 6mm, thành phần 100% Polyester.'
    when 'nhung-gau' then 'Cuộn Nhung Gấu 50g ±2g, cỡ sợi 2.5mm, thành phần 100% Polyester.'
    when 'mac-den' then 'Cuộn Milk Cotton Mác Đen 50g, cỡ sợi 2mm, thành phần 80% Cotton + 20% Milk Protein.'
  end,
  weight = case slug
    when 'milk-bo' then '50g ±2g'
    when 'nhung-dua' then '100g ±10g'
    when 'nhung-gau' then '50g ±2g'
    when 'mac-den' then '50g ±2g'
  end,
  yarn_size = case slug
    when 'milk-bo' then '2.5mm'
    when 'nhung-dua' then '6mm'
    when 'nhung-gau' then '2.5mm'
    when 'mac-den' then '2mm'
  end,
  material = case slug
    when 'milk-bo' then '80% Cotton + 20% Milk Protein'
    when 'nhung-dua' then '100% Polyester'
    when 'nhung-gau' then '100% Polyester'
    when 'mac-den' then '80% Cotton + 20% Milk Protein'
  end,
  crochet_hook = case slug
    when 'milk-bo' then '2.5–3mm'
    when 'nhung-dua' then '6–9mm'
    when 'nhung-gau' then '2.5–3mm'
    when 'mac-den' then '2.5–3mm'
  end,
  origin = null
where category = 'yarn'
  and slug in ('milk-bo', 'nhung-dua', 'nhung-gau', 'mac-den');

commit;
