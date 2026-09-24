-- Clerk хэрэглэгчтэй холбоно. auth.jwt()->>'sub' нь Clerk-ийн user id (Supabase Third-Party Auth → Clerk).
-- Дахин ажиллуулахад алдаа гарахгүй.

alter table public.reviews add column if not exists user_id text default (auth.jwt() ->> 'sub');
alter table public.reviews add column if not exists author_name text;
alter table public.events add column if not exists user_id text default (auth.jwt() ->> 'sub');
alter table public.event_attendees add column if not exists user_id text default (auth.jwt() ->> 'sub');

create unique index if not exists event_attendees_event_user_key
  on public.event_attendees (event_id, user_id);

-- Нэвтэрсэн хэрэглэгч зөвхөн өөрийн нэрээр сэтгэгдэл, эвент, бүртгэл үүсгэнэ.
drop policy if exists "reviews_public_insert" on public.reviews;
drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own" on public.reviews
  for insert to authenticated with check ((auth.jwt() ->> 'sub') = user_id);

drop policy if exists "events_public_insert" on public.events;
drop policy if exists "events_insert_own" on public.events;
create policy "events_insert_own" on public.events
  for insert to authenticated with check ((auth.jwt() ->> 'sub') = user_id);

drop policy if exists "events_public_delete" on public.events;
drop policy if exists "events_delete_own" on public.events;
create policy "events_delete_own" on public.events
  for delete to authenticated using ((auth.jwt() ->> 'sub') = user_id);

drop policy if exists "event_attendees_public_insert" on public.event_attendees;
drop policy if exists "event_attendees_insert_own" on public.event_attendees;
create policy "event_attendees_insert_own" on public.event_attendees
  for insert to authenticated with check ((auth.jwt() ->> 'sub') = user_id);

drop policy if exists "event_attendees_public_delete" on public.event_attendees;
drop policy if exists "event_attendees_delete_own" on public.event_attendees;
create policy "event_attendees_delete_own" on public.event_attendees
  for delete to authenticated using ((auth.jwt() ->> 'sub') = user_id);
