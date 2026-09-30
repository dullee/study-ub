-- "Ихэвчлэн хэр дүүрэн" график: газрын "Би энд байна" тэмдэглэлүүдийг Улаанбаатарын цагаар гараг, цаг тус бүрээр
-- дундажлана (сүүлийн p_weeks долоо хоног). Зөвхөн нэгтгэл буцаана — хэн хэзээ ирсэн нь харагдахгүй.
-- lib/busyness.ts-ийн busynessPattern() (Supabase-гүй үеийн хувилбар) ижил тооцоолол хийнэ.
-- Гараг: 0 = Даваа … 6 = Ням. Дахин ажиллуулахад алдаа гарахгүй.

create or replace function public.spot_busyness_pattern(p_spot_id bigint, p_weeks integer default 8)
returns table (weekday smallint, hour smallint, avg_level numeric, reports integer)
language sql
stable
set search_path = ''
as $$
  select
    (extract(isodow from local_time) - 1)::smallint as weekday,
    extract(hour from local_time)::smallint as hour,
    round(avg(level), 2) as avg_level,
    count(*)::integer as reports
  from (
    select c.level, c.created_at at time zone 'Asia/Ulaanbaatar' as local_time
    from public.spot_checkins c
    where c.spot_id = p_spot_id
      and c.created_at > now() - make_interval(weeks => least(greatest(p_weeks, 1), 26))
  ) recent
  group by 1, 2
$$;

grant execute on function public.spot_busyness_pattern(bigint, integer) to anon, authenticated;
