-- Хүртээмж (тэргэнцэр, хараа, сонсгол гэх мэт). Түлхүүрүүд types/index.ts-ийн ACCESSIBILITY-тэй тохирно.
-- Дахин ажиллуулахад алдаа гарахгүй.

alter table public.spots add column if not exists accessibility text[] not null default '{}';
