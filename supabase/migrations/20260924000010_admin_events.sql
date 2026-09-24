-- Админ бүх эвентийг засаж, устгана; групп чатын холбоосыг ч удирдана. Дахин ажиллуулахад алдаа гарахгүй.
-- (Өмнө нь эвентийг зөвхөн үүсгэгч нь устгаж, засах эрх хэнд ч байгаагүй.)

drop policy if exists "events_admin_update" on public.events;
create policy "events_admin_update" on public.events
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "events_admin_delete" on public.events;
create policy "events_admin_delete" on public.events
  for delete to authenticated using (public.is_admin());

drop policy if exists "event_chat_links_insert_admin" on public.event_chat_links;
create policy "event_chat_links_insert_admin" on public.event_chat_links
  for insert to authenticated with check (public.is_admin());

drop policy if exists "event_chat_links_update_admin" on public.event_chat_links;
create policy "event_chat_links_update_admin" on public.event_chat_links
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
