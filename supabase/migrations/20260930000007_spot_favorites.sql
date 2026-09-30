-- Хадгалсан (дуртай) газрууд: хэрэглэгч бүр зөвхөн өөрийнхөө жагсаалтыг харж, өөрчилнө (хувийн).
-- Дахин ажиллуулахад алдаа гарахгүй.

create table if not exists public.spot_favorites (
  user_id text not null default (auth.jwt() ->> 'sub'),
  spot_id bigint not null references public.spots (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, spot_id)
);

alter table public.spot_favorites enable row level security;

drop policy if exists "spot_favorites_read_own" on public.spot_favorites;
create policy "spot_favorites_read_own" on public.spot_favorites
  for select to authenticated using ((auth.jwt() ->> 'sub') = user_id);

drop policy if exists "spot_favorites_insert_own" on public.spot_favorites;
create policy "spot_favorites_insert_own" on public.spot_favorites
  for insert to authenticated with check ((auth.jwt() ->> 'sub') = user_id);

drop policy if exists "spot_favorites_delete_own" on public.spot_favorites;
create policy "spot_favorites_delete_own" on public.spot_favorites
  for delete to authenticated using ((auth.jwt() ->> 'sub') = user_id);
