-- Demo эвентүүд: 4 approved (нийтэд), 3 pending (админ зөвшөөрнө).
-- 20260925000002_event_status.sql-ийн дараа ажиллуулна. Ижил гарчиг+host байвал алгасна.

insert into public.events (
  title, description, spot_id, place_name, lat, lng, starts_at, host_name, max_people, user_id, status
)
select
  v.title,
  v.description,
  s.id,
  coalesce(s.name, v.spot_name),
  s.lat,
  s.lng,
  now() + v.starts_in,
  v.host_name,
  v.max_people,
  null,
  v.status
from (values
  (
    'IELTS Speaking клубын уулзалт',
    'Part 2 сэдвүүдээр хамт бэлдэнэ. Өөрийн тэмдэглэлтэй ирээрэй.',
    'UBean Coffee House & Roasterie',
    interval '2 days',
    'Сараа',
    8,
    'approved'
  ),
  (
    'Algorithm problem solving night',
    'LeetCode medium-аас 2–3 бодлого хамт шийднэ. Laptop авчрана уу.',
    'ШУТИС Номын сан',
    interval '4 days',
    'Бат',
    12,
    'approved'
  ),
  (
    'Чимээгүй суралцах өдөр',
    'Уншлагын танхимд 3 цаг чимээгүй суралцана. Утас чимээгүй горимд.',
    'МУҮНС Салбар номын сан',
    interval '6 days',
    'Оюунаа',
    20,
    'approved'
  ),
  (
    'Notion workshop — суралцах систем',
    'Суралцах системээ Notion-д хэрхэн цэгцлэх вэ — богино workshop.',
    'Coffee Fellows (Seoul Street)',
    interval '3 days',
    'Тэмүүлэн',
    10,
    'approved'
  ),
  (
    'Групп төслийн brainstorm',
    'Hackathon/ангийн төсөлд санаа цуглуулна. Салбар хамаагүй.',
    'Moffice Coworking',
    interval '5 days',
    'Анхбаяр',
    6,
    'pending'
  ),
  (
    'Япон хэл JLPT N3 бэлтгэл',
    'Kanji + grammar дасгал. Шинэ суралцагчид ч нэгдэж болно.',
    'Anjuna Book & Art Cafe',
    interval '7 days',
    'Мөнхзаяа',
    8,
    'pending'
  ),
  (
    'Математик туслах цаг',
    'Калкулус/линейн алгебрын бодлогод тусална. Асуултаа авчирна уу.',
    'МУИС кампус / номын сан',
    interval '8 days',
    'Эрдэнэ',
    15,
    'pending'
  )
) as v(title, description, spot_name, starts_in, host_name, max_people, status)
left join public.spots s on s.name = v.spot_name and s.status = 'approved'
where not exists (
  select 1 from public.events e where e.title = v.title and e.host_name = v.host_name
);
