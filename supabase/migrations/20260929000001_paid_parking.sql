-- Баталгаажсан төлбөртэй зогсоол. Энэ файл өгөгдөл оруулахгүй.
-- Нэр, координат, үнэ, цагийг зохиомол утгаар бөглөхгүй — албан эх сурвалжаас оруулна.
-- Үнэ, цаг хоосон байж болно. Шууд сул байдал хадгалах багана байхгүй.
-- public.is_admin() нь 20260924000004_admin_role.sql-д байна.

create table if not exists public.paid_parking (
  id bigint generated always as identity primary key,
  name text not null check (length(trim(name)) > 0),
  address text not null check (length(trim(address)) > 0),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  price_mn text,
  price_en text,
  hours text,
  maps_url text,
  created_at timestamptz default now()
);

alter table public.paid_parking enable row level security;

drop policy if exists "paid_parking_public_read" on public.paid_parking;
create policy "paid_parking_public_read" on public.paid_parking
  for select using (true);

drop policy if exists "paid_parking_admin_insert" on public.paid_parking;
create policy "paid_parking_admin_insert" on public.paid_parking
  for insert to authenticated with check (public.is_admin());

drop policy if exists "paid_parking_admin_update" on public.paid_parking;
create policy "paid_parking_admin_update" on public.paid_parking
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "paid_parking_admin_delete" on public.paid_parking;
create policy "paid_parking_admin_delete" on public.paid_parking
  for delete to authenticated using (public.is_admin());
