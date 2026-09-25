-- Өгөгдлийн сангийн хязгаарууд: вэбсайтаас гадуур (шууд API-аар) ч тойрч гарах боломжгүй.
-- Уртын хязгаарууд lib/limits.ts-тэй тохирно. Дахин ажиллуулахад алдаа гарахгүй.

-- 1) Текстийн урт. NOT VALID: одоо байгаа мөрийг шалгахгүй, шинэ болон засагдсан мөрийг шалгана.
alter table public.reviews drop constraint if exists reviews_comment_length;
alter table public.reviews add constraint reviews_comment_length
  check (char_length(btrim(comment)) between 1 and 2000) not valid;
alter table public.reviews drop constraint if exists reviews_author_name_length;
alter table public.reviews add constraint reviews_author_name_length
  check (author_name is null or char_length(author_name) <= 100) not valid;

alter table public.events drop constraint if exists events_title_length;
alter table public.events add constraint events_title_length
  check (char_length(btrim(title)) between 1 and 120) not valid;
alter table public.events drop constraint if exists events_description_length;
alter table public.events add constraint events_description_length
  check (char_length(description) <= 2000) not valid;
alter table public.events drop constraint if exists events_place_name_length;
alter table public.events add constraint events_place_name_length
  check (char_length(btrim(place_name)) between 1 and 200) not valid;
alter table public.events drop constraint if exists events_host_name_length;
alter table public.events add constraint events_host_name_length
  check (char_length(host_name) <= 100) not valid;
alter table public.events drop constraint if exists events_max_people_limit;
alter table public.events add constraint events_max_people_limit
  check (max_people is null or max_people <= 1000) not valid;

alter table public.event_attendees drop constraint if exists event_attendees_name_length;
alter table public.event_attendees add constraint event_attendees_name_length
  check (char_length(name) <= 100) not valid;

alter table public.spots drop constraint if exists spots_name_length;
alter table public.spots add constraint spots_name_length
  check (char_length(btrim(name)) between 1 and 120) not valid;
alter table public.spots drop constraint if exists spots_location_length;
alter table public.spots add constraint spots_location_length
  check (char_length(btrim(location)) between 1 and 200) not valid;
alter table public.spots drop constraint if exists spots_hours_length;
alter table public.spots add constraint spots_hours_length
  check (hours is null or char_length(hours) <= 100) not valid;
alter table public.spots drop constraint if exists spots_description_length;
alter table public.spots add constraint spots_description_length
  check (description is null or char_length(description) <= 500) not valid;
alter table public.spots drop constraint if exists spots_urls_length;
alter table public.spots add constraint spots_urls_length
  check (char_length(coalesce(image, '')) <= 1000 and char_length(coalesce(maps_url, '')) <= 1000) not valid;
alter table public.spots drop constraint if exists spots_tags_limit;
alter table public.spots add constraint spots_tags_limit
  check (cardinality(tags) <= 20) not valid;

-- 2) Нэг хэрэглэгч нэг газарт нэг л сэтгэгдэл. Одоо байгаа давхар сэтгэгдлийг устгахгүй тул unique index биш,
--    шинээр нэмэх (эсвэл өөр газар руу шилжүүлэх) үед шалгана. Хэрэглэгч өөрийн сэтгэгдлээ засаж болно.
create or replace function public.enforce_one_review_per_user()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.user_id is null then
    return new;
  end if;
  -- Нэг зэрэг хоёр хүсэлт ирсэн ч нэг л нь орно.
  perform pg_advisory_xact_lock(hashtextextended('review:' || new.spot_id || ':' || new.user_id, 0));
  if exists (
    select 1 from public.reviews r
    where r.spot_id = new.spot_id and r.user_id = new.user_id and r.id is distinct from new.id
  ) then
    raise exception 'already_reviewed' using errcode = '23505';
  end if;
  return new;
end
$$;

drop trigger if exists reviews_one_per_user on public.reviews;
create trigger reviews_one_per_user
  before insert or update of spot_id, user_id on public.reviews
  for each row execute function public.enforce_one_review_per_user();

drop policy if exists "reviews_update_own" on public.reviews;
create policy "reviews_update_own" on public.reviews
  for update to authenticated
  using ((auth.jwt() ->> 'sub') = user_id)
  with check ((auth.jwt() ->> 'sub') = user_id);

-- 3) Эвентийн хүний тоо ба дууссан эвент. Эвентийн мөрийг түгжиж тоолно — сүүлийн суудлыг хоёр хүн зэрэг авахгүй.
--    security definer: энгийн хэрэглэгч events мөрийг FOR UPDATE түгжих эрхгүй.
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
  -- Эхэлснээс хойш 3 цаг хүртэл бүртгүүлж болно (апп ч ийм цонхтой).
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

drop trigger if exists event_attendees_capacity on public.event_attendees;
create trigger event_attendees_capacity
  before insert on public.event_attendees
  for each row execute function public.enforce_event_attendance();

-- 4) Шинэ эвент өнгөрсөн цагт байж болохгүй (цагийн зөрүүнд 5 минут).
drop policy if exists "events_insert_own" on public.events;
create policy "events_insert_own" on public.events
  for insert to authenticated
  with check ((auth.jwt() ->> 'sub') = user_id and starts_at > now() - interval '5 minutes');
