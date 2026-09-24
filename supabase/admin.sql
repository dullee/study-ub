-- Аль хэдийн schema.sql ажиллуулсан төсөл дээр нэг удаа ажиллуулна.

alter table public.spots
  add column if not exists status text not null default 'approved';

alter table public.spots
  add column if not exists maps_url text;

alter table public.spots drop constraint if exists spots_status_check;
alter table public.spots
  add constraint spots_status_check check (status in ('pending', 'approved', 'rejected'));

create policy "spots_public_update" on public.spots
  for update using (true) with check (true);

create policy "spots_public_delete" on public.spots
  for delete using (true);

create policy "reviews_public_update" on public.reviews
  for update using (true) with check (true);

create policy "reviews_public_delete" on public.reviews
  for delete using (true);
