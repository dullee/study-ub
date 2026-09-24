-- Supabase GitHub integration main руу push хийхэд автоматаар ажиллуулна.

create table if not exists public.spots (
  id bigint generated always as identity primary key,
  name text not null,
  location text not null,
  hours text,
  lat double precision not null,
  lng double precision not null,
  tags text[] default '{}',
  image text,
  wifi_speed text,
  quiet_score text,
  socket_score text,
  is_24h boolean default false,
  maps_url text,
  status text not null default 'approved' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now()
);

create table if not exists public.reviews (
  id bigint generated always as identity primary key,
  spot_id bigint not null references public.spots (id) on delete cascade,
  comment text not null,
  wifi_speed_test text,
  rating int not null check (rating between 1 and 5),
  created_at timestamptz default now()
);

create table if not exists public.events (
  id bigint generated always as identity primary key,
  title text not null,
  description text not null default '',
  spot_id bigint references public.spots (id) on delete set null,
  place_name text not null,
  lat double precision,
  lng double precision,
  starts_at timestamptz not null,
  host_name text not null,
  max_people int check (max_people is null or max_people > 0),
  created_at timestamptz default now()
);

create table if not exists public.event_attendees (
  id bigint generated always as identity primary key,
  event_id bigint not null references public.events (id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

alter table public.spots enable row level security;
alter table public.reviews enable row level security;
alter table public.events enable row level security;
alter table public.event_attendees enable row level security;

create policy "spots_public_read" on public.spots
  for select using (true);

create policy "spots_public_insert" on public.spots
  for insert with check (true);

create policy "reviews_public_read" on public.reviews
  for select using (true);

create policy "reviews_public_insert" on public.reviews
  for insert with check (true);

create policy "spots_public_update" on public.spots
  for update using (true) with check (true);

create policy "spots_public_delete" on public.spots
  for delete using (true);

create policy "reviews_public_update" on public.reviews
  for update using (true) with check (true);

create policy "reviews_public_delete" on public.reviews
  for delete using (true);

create policy "events_public_read" on public.events
  for select using (true);

create policy "events_public_insert" on public.events
  for insert with check (true);

create policy "events_public_delete" on public.events
  for delete using (true);

create policy "event_attendees_public_read" on public.event_attendees
  for select using (true);

create policy "event_attendees_public_insert" on public.event_attendees
  for insert with check (true);

create policy "event_attendees_public_delete" on public.event_attendees
  for delete using (true);
