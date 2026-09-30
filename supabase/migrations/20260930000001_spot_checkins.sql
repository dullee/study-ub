-- "Би энд байна" — хэрэглэгч газарт ирснээ тэмдэглээд хэр дүүрэн байгааг 1–5 шатлалаар үнэлнэ.
-- Сүүлийн 90 минутын үнэлгээнээс одоогийн ачааллыг тооцно (lib/busyness.ts).
-- Хэрэглэгч нэг газарт 30 минутад нэг л шинэ тэмдэглэл үүсгэнэ; түүнээс өмнө бол өөрийнхөө сүүлийнхийг засна.
-- Дахин ажиллуулахад алдаа гарахгүй.

create table if not exists public.spot_checkins (
  id bigint generated always as identity primary key,
  spot_id bigint not null references public.spots (id) on delete cascade,
  user_id text not null default (auth.jwt() ->> 'sub'),
  -- 1 хоосон, 2 сул, 3 дунд, 4 их хүнтэй, 5 суудал алга.
  level smallint not null check (level between 1 and 5),
  created_at timestamptz not null default now()
);

create index if not exists spot_checkins_spot_created_idx
  on public.spot_checkins (spot_id, created_at desc);

alter table public.spot_checkins enable row level security;

drop policy if exists "spot_checkins_read" on public.spot_checkins;
create policy "spot_checkins_read" on public.spot_checkins
  for select using (true);

drop policy if exists "spot_checkins_insert_own" on public.spot_checkins;
create policy "spot_checkins_insert_own" on public.spot_checkins
  for insert to authenticated with check ((auth.jwt() ->> 'sub') = user_id);

-- Зөвхөн дүүргэлтийн түвшнийг засна (spot_id, user_id-г өөрчлөхгүй — trigger доор шалгана).
drop policy if exists "spot_checkins_update_own" on public.spot_checkins;
create policy "spot_checkins_update_own" on public.spot_checkins
  for update to authenticated
  using ((auth.jwt() ->> 'sub') = user_id)
  with check ((auth.jwt() ->> 'sub') = user_id);

drop policy if exists "spot_checkins_delete_admin" on public.spot_checkins;
create policy "spot_checkins_delete_admin" on public.spot_checkins
  for delete to authenticated using (public.is_admin());

-- Спамаас хамгаална: нэг хэрэглэгч нэг газарт 30 минутад нэг шинэ тэмдэглэл.
create or replace function public.enforce_checkin_rate_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    -- Засахад зөвхөн түвшин өөрчлөгдөнө; хуучин тэмдэглэлийг "шинэ" болгож сэргээхгүй.
    new.spot_id := old.spot_id;
    new.user_id := old.user_id;
    new.created_at := old.created_at;
    return new;
  end if;
  perform pg_advisory_xact_lock(hashtextextended('checkin:' || new.spot_id || ':' || new.user_id, 0));
  if exists (
    select 1 from public.spot_checkins c
    where c.spot_id = new.spot_id and c.user_id = new.user_id
      and c.created_at > now() - interval '30 minutes'
  ) then
    raise exception 'checkin_too_soon' using errcode = 'P0001';
  end if;
  new.created_at := now();
  return new;
end
$$;

drop trigger if exists spot_checkins_rate_limit on public.spot_checkins;
create trigger spot_checkins_rate_limit
  before insert or update on public.spot_checkins
  for each row execute function public.enforce_checkin_rate_limit();
