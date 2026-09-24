-- Эвентийн групп чатын холбоос (WhatsApp, Discord, Telegram, Instagram гэх мэт).
-- events хүснэгт бүх хүнд нээлттэй тул холбоосыг тусад нь хадгалж, зөвхөн ирэх хүмүүс, зохион байгуулагч (ба админ) харна.
-- Холбоосыг зөвхөн зохион байгуулагч нэмж, сольж, устгана. Дахин ажиллуулахад алдаа гарахгүй.

create table if not exists public.event_chat_links (
  event_id bigint primary key references public.events (id) on delete cascade,
  url text not null check (url ~* '^https://[^[:space:]]+$' and char_length(url) <= 500),
  updated_at timestamptz not null default now()
);

alter table public.event_chat_links enable row level security;

-- Одоогийн хэрэглэгч энэ эвентийн зохион байгуулагч эсэх.
create or replace function public.is_event_host(p_event_id bigint)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.events e
    where e.id = p_event_id and e.user_id = (auth.jwt() ->> 'sub')
  )
$$;

-- Одоогийн хэрэглэгч энэ эвентэд бүртгүүлсэн эсвэл зохион байгуулагч эсэх.
create or replace function public.is_event_member(p_event_id bigint)
returns boolean
language sql
stable
set search_path = ''
as $$
  select public.is_event_host(p_event_id) or exists (
    select 1 from public.event_attendees a
    where a.event_id = p_event_id and a.user_id = (auth.jwt() ->> 'sub')
  )
$$;

drop policy if exists "event_chat_links_read" on public.event_chat_links;
create policy "event_chat_links_read" on public.event_chat_links
  for select to authenticated using (public.is_event_member(event_id) or public.is_admin());

drop policy if exists "event_chat_links_insert_host" on public.event_chat_links;
create policy "event_chat_links_insert_host" on public.event_chat_links
  for insert to authenticated with check (public.is_event_host(event_id));

drop policy if exists "event_chat_links_update_host" on public.event_chat_links;
create policy "event_chat_links_update_host" on public.event_chat_links
  for update to authenticated using (public.is_event_host(event_id)) with check (public.is_event_host(event_id));

drop policy if exists "event_chat_links_delete_host" on public.event_chat_links;
create policy "event_chat_links_delete_host" on public.event_chat_links
  for delete to authenticated using (public.is_event_host(event_id) or public.is_admin());
