-- Эвентэд бүртгүүлэхэд хэрэглэгчийн сонгосон хэл — баталгаажуулах, сануулах имэйлийг тэр хэлээр илгээнэ.
-- Сануулгыг cron (хөтөчгүй) илгээдэг тул хэлийг бүртгэлтэй хамт хадгална. Хуучин бүртгэлүүд монгол.
-- Дахин ажиллуулахад алдаа гарахгүй.

alter table public.event_attendees
  add column if not exists locale text not null default 'mn';

alter table public.event_attendees drop constraint if exists event_attendees_locale_check;
alter table public.event_attendees
  add constraint event_attendees_locale_check check (locale in ('mn', 'en'));
