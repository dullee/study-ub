-- Одоо байгаа DB дээр: хуурамч/хуучин seed-ийг цэвэрлээд data/initialSpots.ts-ийн
-- бодит газруудыг нэрээр нь нэмнэ (байвал алгасна). Дахин ажиллуулахад аюулгүй.

-- Хуучин demo газрууд
delete from public.spots
where name in (
  '24/7 Study Hub UB',
  'Central Tower Coffee',
  'Их Нацагдоржийн Номын Сан',
  'UBean Coffee Roasters',
  'МУИС-ийн Номын Сан',
  'ШУТИС-ийн Номын Сан'
);

insert into public.spots (
  name, location, hours, lat, lng, tags, image, is_24h, status, maps_url,
  wifi_mbps, quiet_rating, outlet_rating, category, description, amenities, accessibility
)
select v.*
from (values
  (
    'Монгол Улсын Үндэсний номын сан',
    'Сүхбаатар дүүрэг, Чингисийн өргөн чөлөө-4',
    '09:00 - 18:00',
    47.91484, 106.91628,
    array['Номын сан', 'Маш чимээгүй', 'Залгуур ихтэй']::text[],
    'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=600&auto=format&fit=crop',
    false, 'approved',
    'https://maps.app.goo.gl/29rhdK1HAq5Qnxbe6',
    40::numeric, 5::smallint, 4::smallint, 'library',
    'Үндэсний номын сангийн төв байр. Уншлагын танхим, Wi-Fi.',
    array['restroom', 'water']::text[],
    array[]::text[]
  ),
  (
    'МУҮНС Салбар номын сан',
    'Сүхбаатар дүүрэг, 7-р хороо, Денверийн гудамж',
    '07:30 - 16:30 (ажлын өдөр)',
    47.92681, 106.93059,
    array['Номын сан', 'Маш чимээгүй', 'Wi-Fi хурдан', 'Залгуур ихтэй']::text[],
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&auto=format&fit=crop',
    false, 'approved',
    'https://maps.app.goo.gl/6nvmj6JH7ewVYcSm6',
    55::numeric, 5::smallint, 4::smallint, 'library',
    '2024 онд нээгдсэн шинэ салбар — 16 уншлагын танхим, орчин үеийн суух орчин.',
    array['restroom', 'water', 'ac']::text[],
    array['elevator', 'wheelchair']::text[]
  ),
  (
    'УБ хотын нийтийн төв номын сан',
    'Сөүлийн гудамж, Сүхбаатар дүүрэг',
    '09:00 - 20:00',
    47.91359, 106.90833,
    array['Номын сан', 'Маш чимээгүй', 'Залгуур ихтэй']::text[],
    'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&auto=format&fit=crop',
    false, 'approved', null,
    35::numeric, 5::smallint, 3::smallint, 'library',
    'Хотын нийтийн төв номын сан — төв хэсэгт, оюутнуудад ойр.',
    array['restroom', 'water']::text[],
    array[]::text[]
  ),
  (
    'МУИС кампус / номын сан',
    'Их сургуулийн гудамж, МУИС',
    '09:00 - 18:00 (сургуулийн хуваарь)',
    47.92585, 106.92155,
    array['Номын сан', 'Маш чимээгүй', 'Залгуур ихтэй']::text[],
    'https://images.unsplash.com/photo-1562774053-701939374585?w=600&auto=format&fit=crop',
    false, 'approved', null,
    50::numeric, 5::smallint, 4::smallint, 'university',
    'Монгол Улсын Их Сургуулийн төв кампус — номын сан, уншлагын танхим.',
    array['restroom', 'water', 'food']::text[],
    array[]::text[]
  ),
  (
    'ШУТИС Номын сан',
    'Бээжингийн гудамж, ШУТИС',
    '09:00 - 20:00',
    47.92171, 106.9245,
    array['Номын сан', 'Залгуур ихтэй', 'Wi-Fi хурдан']::text[],
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop',
    false, 'approved', null,
    60::numeric, 4::smallint, 4::smallint, 'library',
    'Шинжлэх Ухаан, Технологийн Их Сургуулийн номын сан.',
    array['restroom', 'water', 'printer']::text[],
    array[]::text[]
  ),
  (
    'МУБИС (Боловсролын их сургууль)',
    'Бага тойруу, МУБИС A байр',
    '09:00 - 18:00 (сургуулийн хуваарь)',
    47.91832, 106.92446,
    array['Номын сан', 'Залгуур ихтэй']::text[],
    'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop',
    false, 'approved', null,
    45::numeric, 4::smallint, 3::smallint, 'university',
    'Монгол Улсын Боловсролын Их Сургуулийн төв байрны орчим.',
    array['restroom', 'food']::text[],
    array[]::text[]
  ),
  (
    'UBean Coffee House & Roasterie',
    'Жамъян гүний гудамж, Хүүхдийн паркийн баруун тал',
    '08:00 - 22:00',
    47.91555, 106.91717,
    array['Wi-Fi хурдан', 'Залгуур ихтэй']::text[],
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop',
    false, 'approved', null,
    85::numeric, 4::smallint, 5::smallint, 'cafe',
    'Specialty кофе, laptop-тай суухад тохиромжтой ширээ, розетка.',
    array['drinks', 'food', 'restroom', 'ac']::text[],
    array[]::text[]
  ),
  (
    'Coffee Fellows (Seoul Street)',
    'Сөүлийн гудамж, Сүхбаатар дүүрэг',
    '07:30 - 22:00',
    47.91383, 106.90649,
    array['Wi-Fi хурдан', 'Залгуур ихтэй']::text[],
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop',
    false, 'approved', null,
    50::numeric, 3::smallint, 4::smallint, 'cafe',
    'Digital nomad-уудын түгээмэл суудаг кафе — Wi-Fi, розетка.',
    array['drinks', 'food', 'restroom']::text[],
    array[]::text[]
  ),
  (
    'Anjuna Book & Art Cafe',
    'Чингэлтэй дүүрэг, 1-р хороо (Гутлын 22 орчим)',
    '06:00 - 22:00',
    47.9187, 106.9058,
    array['Wi-Fi хурдан', 'Залгуур ихтэй']::text[],
    'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=600&auto=format&fit=crop',
    false, 'approved', null,
    80::numeric, 4::smallint, 4::smallint, 'cafe',
    'Ном, урлагтай хослуулсан тайван кафе — суралцахад тохиромжтой.',
    array['drinks', 'food', 'restroom']::text[],
    array[]::text[]
  ),
  (
    'the Coffee Bean & Tea Leaf',
    'Сөүлийн гудамж, Бага тойрог',
    '08:00 - 22:00',
    47.91294, 106.89961,
    array['Wi-Fi хурдан', 'Залгуур ихтэй']::text[],
    'https://images.unsplash.com/photo-1442512595331-e89e7382450f?w=600&auto=format&fit=crop',
    false, 'approved', null,
    55::numeric, 3::smallint, 3::smallint, 'cafe',
    'Сөүлийн гудамжны том ширээтэй кофе шоп.',
    array['drinks', 'food', 'restroom', 'ac']::text[],
    array[]::text[]
  ),
  (
    'Tom N Toms Coffee',
    'Чингисийн өргөн чөлөө',
    '08:00 - 22:00',
    47.89914, 106.89833,
    array['Wi-Fi хурдан', 'Залгуур ихтэй']::text[],
    'https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=600&auto=format&fit=crop',
    false, 'approved', null,
    45::numeric, 3::smallint, 3::smallint, 'cafe',
    'Солонгос брэндийн кофе шоп — урт суух боломжтой.',
    array['drinks', 'food', 'restroom']::text[],
    array[]::text[]
  ),
  (
    'Caffe Bene',
    'Чингисийн өргөн чөлөө (төв хэсэг)',
    '08:00 - 22:00',
    47.89861, 106.896,
    array['Wi-Fi хурдан']::text[],
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&auto=format&fit=crop',
    false, 'approved', null,
    40::numeric, 2::smallint, 2::smallint, 'cafe',
    'Том дэлгүүр/гудамжны дэргэдэх кафе — богино суулт, хурдан кофе.',
    array['drinks', 'food', 'restroom']::text[],
    array[]::text[]
  ),
  (
    'Code Cafe',
    'Жуулчны гудамж, Чингэлтэй дүүрэг',
    '08:00 - 21:00',
    47.91943, 106.90727,
    array['Wi-Fi хурдан', 'Залгуур ихтэй']::text[],
    'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=600&auto=format&fit=crop',
    false, 'approved', null,
    60::numeric, 4::smallint, 4::smallint, 'cafe',
    'Төв хэсгийн жижиг кафе — laptop-тай ажиллахад тохиромжтой.',
    array['drinks', 'restroom']::text[],
    array[]::text[]
  ),
  (
    'Central Tower — кофе / суух талбай',
    'Сүхбаатарын талбай, Central Tower',
    '08:00 - 22:00',
    47.91812, 106.92019,
    array['Wi-Fi хурдан', 'Залгуур ихтэй']::text[],
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop',
    false, 'approved', null,
    70::numeric, 3::smallint, 3::smallint, 'cafe',
    'Төв цамхаг доторх кофе, лобби суух талбай — төв байршил.',
    array['drinks', 'restroom', 'ac']::text[],
    array['elevator', 'wheelchair']::text[]
  ),
  (
    'Moffice Coworking',
    'Ж.Самбуугийн гудамж 47, Чингэлтэй',
    '09:00 - 18:00 (Да–Ба)',
    47.92079, 106.90491,
    array['Wi-Fi хурдан', 'Залгуур ихтэй', 'Маш чимээгүй']::text[],
    'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=600&auto=format&fit=crop',
    false, 'approved', null,
    50::numeric, 4::smallint, 5::smallint, 'coworking',
    'Төлбөртэй коворкинг — хурдан Wi-Fi, ширээ бүрт розетка.',
    array['drinks', 'restroom', 'printer', 'ac']::text[],
    array[]::text[]
  ),
  (
    'Startup Terminal',
    'Баянзүрх дүүрэг, 25-р хороо, Их Монгол комплекс, 3 давхар',
    '08:00 - 20:00 (Да–Бя)',
    47.9125, 106.938,
    array['Wi-Fi хурдан', 'Залгуур ихтэй']::text[],
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=600&auto=format&fit=crop',
    false, 'approved',
    'https://startupterminal.mn/',
    45::numeric, 4::smallint, 5::smallint, 'coworking',
    'Стартап коворкинг — өдрийн/сарын гишүүнчлэл, хурлын өрөө.',
    array['drinks', 'restroom', 'printer', 'whiteboard', 'ac', 'parking']::text[],
    array[]::text[]
  ),
  (
    'Горькийн нэрэмжит салбар номын сан',
    'Сангийн хорооны гудамж, Сүхбаатар дүүрэг',
    '09:00 - 18:00',
    47.91712, 106.93484,
    array['Номын сан', 'Маш чимээгүй']::text[],
    'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&auto=format&fit=crop',
    false, 'approved', null,
    30::numeric, 5::smallint, 3::smallint, 'library',
    'Дүүргийн салбар номын сан — чимээгүй унших орчин.',
    array['restroom']::text[],
    array[]::text[]
  ),
  (
    'Хотын нийтийн номын сан (3-р салбар)',
    'Их тойруу, Баянзүрх дүүрэг',
    '09:00 - 18:00',
    47.92711, 106.93796,
    array['Номын сан', 'Маш чимээгүй']::text[],
    'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=600&auto=format&fit=crop',
    false, 'approved', null,
    30::numeric, 5::smallint, 3::smallint, 'library',
    'Баянзүрх дэх хотын нийтийн номын сангийн салбар.',
    array['restroom']::text[],
    array[]::text[]
  )
) as v(
  name, location, hours, lat, lng, tags, image, is_24h, status, maps_url,
  wifi_mbps, quiet_rating, outlet_rating, category, description, amenities, accessibility
)
where not exists (
  select 1 from public.spots s where s.name = v.name
);
