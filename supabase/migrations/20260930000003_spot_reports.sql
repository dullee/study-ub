-- "Мэдээлэл буруу / хуучирсан" мэдэгдэл: хэрэглэгч газрын аль мэдээлэл буруу байгааг тэмдэглээд тайлбар бичнэ.
-- Админы самбарт мэдэгдэл болж харагдана (Realtime-аар шууд), админ засаад "шийдсэн" гэж тэмдэглэнэ.
-- Хэрэглэгч нэг газарт нэг л нээлттэй мэдэгдэлтэй байна (спамаас хамгаална). Дахин ажиллуулахад алдаа гарахгүй.

create table if not exists public.spot_reports (
  id bigint generated always as identity primary key,
  spot_id bigint not null references public.spots (id) on delete cascade,
  user_id text not null default (auth.jwt() ->> 'sub'),
  author_name text check (author_name is null or char_length(author_name) <= 100),
  -- lib/reports.ts-ийн REPORT_TOPICS-тэй тохирно.
  topics text[] not null default '{}'
    check (cardinality(topics) <= 8 and topics <@ array['hours', 'location', 'wifi', 'closed', 'photos', 'amenities', 'other']),
  message text not null default '' check (char_length(message) <= 1000),
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  check (cardinality(topics) > 0 or char_length(btrim(message)) > 0)
);

create index if not exists spot_reports_status_created_idx on public.spot_reports (status, created_at desc);

alter table public.spot_reports enable row level security;

-- Хэрэглэгч өөрийн мэдэгдлийг (нээлттэй эсэхийг шалгахад), админ бүгдийг уншина.
drop policy if exists "spot_reports_read" on public.spot_reports;
create policy "spot_reports_read" on public.spot_reports
  for select to authenticated using ((auth.jwt() ->> 'sub') = user_id or public.is_admin());

drop policy if exists "spot_reports_insert_own" on public.spot_reports;
create policy "spot_reports_insert_own" on public.spot_reports
  for insert to authenticated
  with check ((auth.jwt() ->> 'sub') = user_id and status = 'open' and resolved_at is null);

drop policy if exists "spot_reports_admin_update" on public.spot_reports;
create policy "spot_reports_admin_update" on public.spot_reports
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "spot_reports_admin_delete" on public.spot_reports;
create policy "spot_reports_admin_delete" on public.spot_reports
  for delete to authenticated using (public.is_admin());

-- Нэг хэрэглэгч нэг газарт нэг л нээлттэй мэдэгдэл.
create or replace function public.enforce_one_open_report()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('report:' || new.spot_id || ':' || new.user_id, 0));
  if exists (
    select 1 from public.spot_reports r
    where r.spot_id = new.spot_id and r.user_id = new.user_id and r.status = 'open'
  ) then
    raise exception 'already_reported' using errcode = '23505';
  end if;
  return new;
end
$$;

drop trigger if exists spot_reports_one_open on public.spot_reports;
create trigger spot_reports_one_open
  before insert on public.spot_reports
  for each row execute function public.enforce_one_open_report();

-- Админы самбарт шинэ мэдэгдэл шууд ирнэ. Realtime нь RLS-ийг баримталдаг — зөвхөн админд (ба зохиогчид) хүрнэ.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'spot_reports'
  ) then
    alter publication supabase_realtime add table public.spot_reports;
  end if;
end
$$;
