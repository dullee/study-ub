-- Эвент админ зөвшөөрөлтэй болно. Шинэ эвент "pending"; нийтэд зөвхөн "approved" харагдана.
-- Дахин ажиллуулахад алдаа гарахгүй.

alter table public.events add column if not exists status text;
update public.events set status = 'approved' where status is null;
alter table public.events alter column status set default 'pending';
alter table public.events alter column status set not null;

alter table public.events drop constraint if exists events_status_check;
alter table public.events add constraint events_status_check
  check (status in ('pending', 'approved', 'rejected'));

-- Унших: зөвшөөрөгдсөн, өөрийнх, эсвэл админ.
drop policy if exists "events_public_read" on public.events;
create policy "events_public_read" on public.events
  for select using (
    status = 'approved'
    or public.is_admin()
    or (auth.jwt() ->> 'sub') = user_id
  );

-- Шинээр зөвхөн pending (админ шууд approved оруулж болно).
drop policy if exists "events_insert_own" on public.events;
create policy "events_insert_own" on public.events
  for insert to authenticated
  with check (
    (auth.jwt() ->> 'sub') = user_id
    and starts_at > now() - interval '5 minutes'
    and (status = 'pending' or public.is_admin())
  );

-- Бүртгэл зөвхөн зөвшөөрөгдсөн эвентэд (хуучин capacity/ended шалгалт хэвээр).
create or replace function public.enforce_event_attendance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  ev public.events%rowtype;
  taken integer;
begin
  select * into ev from public.events where id = new.event_id for update;
  if not found then
    raise exception 'event_not_found' using errcode = 'P0001';
  end if;
  if ev.status is distinct from 'approved' then
    raise exception 'event_not_approved' using errcode = 'P0001';
  end if;
  if ev.starts_at < now() - interval '3 hours' then
    raise exception 'event_ended' using errcode = 'P0001';
  end if;
  if ev.max_people is not null then
    select count(*) into taken from public.event_attendees where event_id = new.event_id;
    if taken >= ev.max_people then
      raise exception 'event_full' using errcode = 'P0001';
    end if;
  end if;
  return new;
end
$$;
