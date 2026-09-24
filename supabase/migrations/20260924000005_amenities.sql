-- Газрын үйлчилгээ (принтер, хоол, ундаа гэх мэт). Түлхүүрүүд types/index.ts-ийн AMENITIES-тэй тохирно.
-- Дахин ажиллуулахад алдаа гарахгүй.

alter table public.spots add column if not exists amenities text[] not null default '{}';
