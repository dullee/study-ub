-- Сануулах имэйл илгээсэн цагийг тэмдэглэнэ; /api/cron/reminders нэг хүнд нэг л удаа илгээнэ.
-- Дахин ажиллуулахад алдаа гарахгүй.

alter table public.event_attendees add column if not exists reminder_sent_at timestamptz;
