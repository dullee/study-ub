-- API-ийн хүсэлтийн хязгаар (/api/maps/*): IP тус бүр ба нийт сайтын хэмжээнд цонхоор тоолно.
-- Vercel олон instance ажиллуулдаг тул санах ойд биш, энд тоолно. Зөвхөн сервер (secret key) дуудна.
-- Дахин ажиллуулахад алдаа гарахгүй.

create table if not exists public.api_rate_limits (
  key text not null,
  window_start timestamptz not null,
  count integer not null default 0,
  primary key (key, window_start)
);

-- RLS асаалттай, бодлогогүй: anon/authenticated огт хандахгүй. Service role RLS-ийг алгасна.
alter table public.api_rate_limits enable row level security;

-- Хүсэлтийг тоолж, хязгаарт багтсан эсэхийг буцаана. Атомар: нэг зэрэг ирсэн хүсэлтүүд зөв тоологдоно.
create or replace function public.rate_limit_hit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  bucket timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  hits integer;
begin
  insert into public.api_rate_limits as r (key, window_start, count)
  values (p_key, bucket, 1)
  on conflict (key, window_start) do update set count = r.count + 1
  returning r.count into hits;

  -- Хааяа хуучин цонхнуудыг цэвэрлэнэ (хүснэгт өсөхгүй).
  if random() < 0.01 then
    delete from public.api_rate_limits where window_start < now() - interval '1 day';
  end if;

  return hits <= p_limit;
end
$$;

revoke all on function public.rate_limit_hit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, integer, integer) to service_role;
