-- Газрыг хэн илгээснийг хадгална: нэвтэрсэн хэрэглэгч өөрийн хүлээгдэж буй/татгалзсан газрыг харна.
-- Нэвтрээгүй хүн илгээвэл user_id хоосон (өмнөх шиг). Дахин ажиллуулахад алдаа гарахгүй.

alter table public.spots add column if not exists user_id text default (auth.jwt() ->> 'sub');
create index if not exists spots_user_id_idx on public.spots (user_id);

-- Бүгд зөвшөөрөгдсөнийг; админ бүгдийг; хэрэглэгч өөрийн илгээснийг харна.
drop policy if exists "spots_read" on public.spots;
create policy "spots_read" on public.spots
  for select using (
    status = 'approved'
    or public.is_admin()
    or (user_id is not null and user_id = (auth.jwt() ->> 'sub'))
  );

-- Шинэ газар "pending"-ээр; user_id нь зөвхөн өөрийнх (эсвэл хоосон) байж болно.
drop policy if exists "spots_insert_pending" on public.spots;
create policy "spots_insert_pending" on public.spots
  for insert with check (
    (status = 'pending' or public.is_admin())
    and (user_id is null or user_id = (auth.jwt() ->> 'sub'))
  );
