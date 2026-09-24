-- Админ эрхийг Clerk-ээс шалгана: user.public_metadata.role = "admin" нь session token-ы "metadata" claim-д орно.
-- Хүлээгдэж буй газар харах, зөвшөөрөх, засах, устгах, сэтгэгдэл засах/устгах нь зөвхөн админд.
-- Дахин ажиллуулахад алдаа гарахгүй.

create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'metadata' ->> 'role') = 'admin', false)
$$;

-- Газар: бүх хүн зөвхөн зөвшөөрөгдсөнийг харна; шинээр нэмэхэд заавал "pending".
drop policy if exists "spots_public_read" on public.spots;
drop policy if exists "spots_read" on public.spots;
create policy "spots_read" on public.spots
  for select using (status = 'approved' or public.is_admin());

drop policy if exists "spots_public_insert" on public.spots;
drop policy if exists "spots_insert_pending" on public.spots;
create policy "spots_insert_pending" on public.spots
  for insert with check (status = 'pending' or public.is_admin());

drop policy if exists "spots_public_update" on public.spots;
drop policy if exists "spots_admin_update" on public.spots;
create policy "spots_admin_update" on public.spots
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "spots_public_delete" on public.spots;
drop policy if exists "spots_admin_delete" on public.spots;
create policy "spots_admin_delete" on public.spots
  for delete to authenticated using (public.is_admin());

-- Сэтгэгдэл: засах, устгах нь зөвхөн админд.
drop policy if exists "reviews_public_update" on public.reviews;
drop policy if exists "reviews_admin_update" on public.reviews;
create policy "reviews_admin_update" on public.reviews
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "reviews_public_delete" on public.reviews;
drop policy if exists "reviews_admin_delete" on public.reviews;
create policy "reviews_admin_delete" on public.reviews
  for delete to authenticated using (public.is_admin());
