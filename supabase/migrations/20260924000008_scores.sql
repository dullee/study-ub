-- Wi-Fi, чимээгүй байдал, розеткыг тоогоор хадгална. Газар нэмэгчийн утга нэг санал болж,
-- сэтгэгдлийн утгуудтай хамт дундажлагдана (lib/scores.ts).
-- Хуучин текст баганууд (wifi_speed, quiet_score, socket_score, wifi_speed_test) хэвээр үлдэнэ — апп ашиглахаа больсон.
-- Дахин ажиллуулахад алдаа гарахгүй.

alter table public.spots add column if not exists wifi_mbps numeric check (wifi_mbps is null or wifi_mbps between 0 and 10000);
alter table public.spots add column if not exists quiet_rating smallint check (quiet_rating is null or quiet_rating between 1 and 5);
alter table public.spots add column if not exists outlet_rating smallint check (outlet_rating is null or outlet_rating between 1 and 5);

alter table public.reviews add column if not exists wifi_mbps numeric check (wifi_mbps is null or wifi_mbps between 0 and 10000);
alter table public.reviews add column if not exists quiet_rating smallint check (quiet_rating is null or quiet_rating between 1 and 5);
alter table public.reviews add column if not exists outlet_rating smallint check (outlet_rating is null or outlet_rating between 1 and 5);

-- Хуучин текстээс хөрвүүлнэ: "40 Mbps" → 40, "4.8/5" → 5, "Ихтэй" → 4.
update public.spots
  set wifi_mbps = least(substring(wifi_speed from '(\d+(?:\.\d+)?)')::numeric, 10000)
  where wifi_mbps is null and wifi_speed ~ '\d';

update public.spots
  set quiet_rating = least(greatest(round(substring(quiet_score from '(\d+(?:\.\d+)?)')::numeric), 1), 5)
  where quiet_rating is null and quiet_score ~ '\d';

update public.spots
  set outlet_rating = case
    when socket_score ilike '%ширээ бүрт%' then 5
    when socket_score ilike '%их%' then 4
    when socket_score ilike '%дунд%' then 3
    when socket_score ilike '%цөөн%' then 2
    when socket_score ilike '%байхгүй%' then 1
  end
  where outlet_rating is null and socket_score is not null;

update public.reviews
  set wifi_mbps = least(substring(wifi_speed_test from '(\d+(?:\.\d+)?)')::numeric, 10000)
  where wifi_mbps is null and wifi_speed_test ~ '\d';
