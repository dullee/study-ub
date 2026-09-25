-- Газрын нэмэлт зураг, бичлэг: [{ "url": "https://...", "type": "image" | "video" }, ...]
-- Нүүр зураг (image) хэвээр; энэ нь цонхны "Зураг, бичлэг" цомогт харагдана. Дахин ажиллуулахад алдаа гарахгүй.

alter table public.spots add column if not exists media jsonb not null default '[]'::jsonb;

alter table public.spots drop constraint if exists spots_media_check;
alter table public.spots add constraint spots_media_check
  check (jsonb_typeof(media) = 'array' and jsonb_array_length(media) <= 30);
