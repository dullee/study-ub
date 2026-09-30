-- supabase/seed/mock_busyness.sql-ийн үүсгэсэн туршилтын тэмдэглэлүүдийг устгана.
-- Жинхэнэ хэрэглэгчдийн тэмдэглэлд хүрэхгүй (зөвхөн user_id нь "mock:"-оор эхэлсэн мөрүүд).
-- Supabase → SQL Editor дээр ажиллуулна.

delete from public.spot_checkins where user_id like 'mock:%';

select count(*) as remaining_mock_rows from public.spot_checkins where user_id like 'mock:%';
