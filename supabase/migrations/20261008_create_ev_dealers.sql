-- Dealer locations managed from the Team > Map panel.
create table if not exists public.ev_dealers (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  brands text[] not null default '{}',
  lat numeric(10, 7) not null,
  lng numeric(10, 7) not null,
  pincode text not null default '',
  city text not null default '',
  address text not null default '',
  offers text[] not null default '{}',
  offer_ids text[] not null default '{}',
  is_active boolean not null default true,
  added_by_email text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ev_dealers_lat_check check (lat between -90 and 90),
  constraint ev_dealers_lng_check check (lng between -180 and 180)
);

-- Store references as text so this remains compatible with the existing offers table
-- regardless of whether its primary key is UUID or another string-compatible type.
alter table public.ev_dealers
  add column if not exists offer_ids text[] not null default '{}';

alter table public.ev_dealers enable row level security;

revoke all on table public.ev_dealers from anon, authenticated;
grant select on table public.ev_dealers to anon, authenticated;
grant insert, update, delete on table public.ev_dealers to authenticated;

drop policy if exists "Public read dealers" on public.ev_dealers;
create policy "Public read dealers"
  on public.ev_dealers for select
  to anon, authenticated
  using (true);

drop policy if exists "Authenticated manage dealers" on public.ev_dealers;
create policy "Authenticated manage dealers"
  on public.ev_dealers for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated update dealers" on public.ev_dealers;
create policy "Authenticated update dealers"
  on public.ev_dealers for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated delete dealers" on public.ev_dealers;
create policy "Authenticated delete dealers"
  on public.ev_dealers for delete
  to authenticated
  using (true);

create index if not exists idx_ev_dealers_city on public.ev_dealers(city);
create index if not exists idx_ev_dealers_pincode on public.ev_dealers(pincode);
create index if not exists idx_ev_dealers_brands on public.ev_dealers using gin(brands);
