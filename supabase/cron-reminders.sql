-- Эвентийн сануулах имэйлийг 5 минут тутамд илгээнэ.
-- Supabase SQL Editor дээр нэг удаа ажиллуулна. migrations/-д биш: сайтын URL болон нууц түлхүүр агуулна.
-- 1) SITE_URL-ийг Vercel дээрх сайтын хаягаар, 2) YOUR_CRON_SECRET-ийг Vercel-ийн CRON_SECRET-тэй ижил утгаар солино.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('event-reminders')
where exists (select 1 from cron.job where jobname = 'event-reminders');

select cron.schedule(
  'event-reminders',
  '*/5 * * * *',
  $$
  select net.http_get(
    url := 'https://study-ub-omega.vercel.app/api/cron/reminders',
    headers := jsonb_build_object('Authorization', 'Bearer CRON_SECRET'),
    timeout_milliseconds := 30000
  );
  $$
);

-- Шалгах: select * from cron.job_run_details order by start_time desc limit 5;
--         select status_code, content from net._http_response order by created desc limit 5;
