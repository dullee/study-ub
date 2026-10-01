-- Easy Parking-ийн жагсаалтад хаяг, үнэ, цаг, координат дутуу байж болно.
-- Координат баталгаажаагүй мөрийг апп газрын зурагт харуулахгүй.
-- Өгөгдлийг энд оруулахгүй — анхны 28 байршил data/paidParking.ts-д байна.

alter table public.paid_parking alter column address drop not null;
alter table public.paid_parking alter column lat drop not null;
alter table public.paid_parking alter column lng drop not null;

alter table public.paid_parking add column if not exists district text;
alter table public.paid_parking add column if not exists capacity integer;
alter table public.paid_parking add column if not exists hourly_rate text;
alter table public.paid_parking add column if not exists source_url text;
alter table public.paid_parking add column if not exists verified_on date;
alter table public.paid_parking add column if not exists coordinates_verified boolean not null default false;

alter table public.paid_parking drop constraint if exists paid_parking_capacity_positive;
alter table public.paid_parking
  add constraint paid_parking_capacity_positive check (capacity is null or capacity > 0);
