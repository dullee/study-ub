-- Газрын төрөл (номын сан, кафе гэх мэт) ба товч тайлбар. Түлхүүрүүд types/index.ts-ийн SPOT_CATEGORIES-тэй тохирно.
-- Дахин ажиллуулахад алдаа гарахгүй.

alter table public.spots add column if not exists category text;
alter table public.spots add column if not exists description text;

alter table public.spots drop constraint if exists spots_category_check;
alter table public.spots add constraint spots_category_check
  check (category is null or category in ('library', 'cafe', 'coworking', 'university', 'reading_room', 'other'));

-- Байгаа газруудыг нэр, шошгоор нь ангилна. Тодорхойгүйг хоосон үлдээнэ.
update public.spots set category = 'library'
  where category is null and 'Номын сан' = any (tags);
update public.spots set category = 'cafe'
  where category is null and (name ilike '%coffee%' or name ilike '%кофе%' or name ilike '%cafe%' or name ilike '%кафе%');
