-- ТУРШИЛТЫН өгөгдөл: бүх зөвшөөрөгдсөн газарт "Би энд байна" тэмдэглэл үүсгэнэ —
--   • сүүлийн 8 долоо хоног (08:00–21:59) → "Ихэвчлэн хэр дүүрэн" график;
--   • сүүлийн 80 минут (ихэнх газарт) → карт, газрын зургийн одоогийн ачаалал.
-- Газар бүр өөр оргил цаг, эрчимтэй; амралтын өдөр илүү дүүрэн.
--
-- Supabase → SQL Editor дээр гараар ажиллуулна. migrations/-д биш — deploy хийхэд автоматаар ажиллахгүй.
-- Дахин ажиллуулбал өмнөх туршилтын мөрүүдийг устгаад шинээр үүсгэнэ.
-- Устгах: supabase/seed/mock_busyness_cleanup.sql. Туршилтын мөрүүдийн user_id нь "mock:"-оор эхэлнэ.
--
-- Шаардлага: 20260930000001_spot_checkins.sql, 20260930000005_busyness_pattern.sql ажилласан байх.

begin;

-- Trigger нь created_at-ийг now() болгож, 30 минутын хязгаар тавьдаг — өнгөрсөн огноотой мөр оруулахын тулд түр унтраана.
-- (Транзакц дотор: алдаа гарвал буцаж, trigger асаалттай хэвээр үлдэнэ.)
alter table public.spot_checkins disable trigger spot_checkins_rate_limit;

delete from public.spot_checkins where user_id like 'mock:%';

-- 1) Сүүлийн 8 долоо хоног.
insert into public.spot_checkins (spot_id, user_id, level, created_at)
select
  s.id,
  'mock:' || (1 + floor(random() * 40))::int,
  greatest(1, least(5, round(
    1 + p.intensity * (case when extract(isodow from t.local_time) >= 6 then 4.0 else 3.2 end)
      * exp(-power(h.hour - p.peak_hour, 2) / 10.0)
      + (random() - 0.5) * 1.2
  )))::smallint,
  t.local_time at time zone 'Asia/Ulaanbaatar'
from public.spots s
-- Газар бүрийн "зан": оргил цаг 11–18, эрчим 0.6–1.5 (id-аас тогтмол).
cross join lateral (
  select 11 + (s.id * 7) % 8 as peak_hour, 0.6 + ((s.id * 13) % 10) / 10.0 as intensity
) p
cross join generate_series(1, 55) as d(days_ago)
cross join generate_series(8, 21) as h(hour)
cross join lateral (
  select date_trunc('day', now() at time zone 'Asia/Ulaanbaatar')
    - make_interval(days => d.days_ago)
    + make_interval(hours => h.hour, mins => floor(random() * 55)::int) as local_time
) t
where s.status = 'approved'
  and random() < 0.45;

-- 2) Одоо (сүүлийн 80 минут): 5 газар тутмын 4-т нь 2–4 тэмдэглэл, одоогийн цагт тохирсон түвшинтэй.
insert into public.spot_checkins (spot_id, user_id, level, created_at)
select
  s.id,
  'mock:live' || n,
  greatest(1, least(5, round(
    1 + p.intensity * 3.4 * exp(-power(extract(hour from now() at time zone 'Asia/Ulaanbaatar') - p.peak_hour, 2) / 10.0)
      + (random() - 0.5) * 1.5
  )))::smallint,
  now() - make_interval(mins => floor(random() * 80)::int)
from public.spots s
cross join lateral (
  select 11 + (s.id * 7) % 8 as peak_hour, 0.6 + ((s.id * 13) % 10) / 10.0 as intensity
) p
cross join generate_series(1, 4) as n
where s.status = 'approved'
  and s.id % 5 <> 0
  and n <= 2 + (s.id % 3);

alter table public.spot_checkins enable trigger spot_checkins_rate_limit;

commit;

-- Шалгах: газар бүрт хэдэн туршилтын тэмдэглэл үүссэн.
select s.name, count(c.id) as mock_checkins,
       count(c.id) filter (where c.created_at > now() - interval '90 minutes') as live_now
from public.spots s
left join public.spot_checkins c on c.spot_id = s.id and c.user_id like 'mock:%'
where s.status = 'approved'
group by s.id, s.name
order by s.id;
