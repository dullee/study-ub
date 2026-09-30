-- "Би энд байна" тэмдэглэлийг Supabase Realtime-аар шууд түгээнэ — нээлттэй хуудаснууд
-- бусдын шинэ мэдээллийг дахин ачаалалгүйгээр харна. Realtime нь RLS-ийг баримтална
-- (spot_checkins_read бүх хүнд нээлттэй). Дахин ажиллуулахад алдаа гарахгүй.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'spot_checkins'
  ) then
    alter publication supabase_realtime add table public.spot_checkins;
  end if;
end
$$;
