-- Эвентийн зохион байгуулагчийн утасны дугаар (заавал биш).
-- events хүснэгт бүх хүнд нээлттэй тул дугаарыг тусад нь хадгалж, групп чатын холбоос шиг
-- зөвхөн ирэх хүмүүс, зохион байгуулагч, админ харна; зөвхөн зохион байгуулагч (ба админ) өөрчилнө.
-- is_event_member, is_event_host, is_admin функцууд өмнөх migration-д бий. Дахин ажиллуулахад алдаа гарахгүй.

create table if not exists public.event_contacts (
  event_id bigint primary key references public.events (id) on delete cascade,
  -- lib/phone.ts-тэй тохирно: "+", цифр, зай, "-", хаалт; 6–20 тэмдэгт.
  phone text not null check (phone ~ '^\+?[0-9][0-9 ()-]{5,19}$'),
  updated_at timestamptz not null default now()
);

alter table public.event_contacts enable row level security;

drop policy if exists "event_contacts_read" on public.event_contacts;
create policy "event_contacts_read" on public.event_contacts
  for select to authenticated using (public.is_event_member(event_id) or public.is_admin());

drop policy if exists "event_contacts_insert" on public.event_contacts;
create policy "event_contacts_insert" on public.event_contacts
  for insert to authenticated with check (public.is_event_host(event_id) or public.is_admin());

drop policy if exists "event_contacts_update" on public.event_contacts;
create policy "event_contacts_update" on public.event_contacts
  for update to authenticated
  using (public.is_event_host(event_id) or public.is_admin())
  with check (public.is_event_host(event_id) or public.is_admin());

drop policy if exists "event_contacts_delete" on public.event_contacts;
create policy "event_contacts_delete" on public.event_contacts
  for delete to authenticated using (public.is_event_host(event_id) or public.is_admin());
