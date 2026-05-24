-- EVPULSE: evlistings table
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)

create table if not exists public.evlistings (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  title text not null,
  brand text not null default '',
  types text[] default '{}',
  price text default '',
  top_speed numeric default null,
  commercial boolean default false,
  launchdate text default null,
  photo text default '',
  gallery_images jsonb default '[]',
  colors text[] default '{}',
  battery_variants jsonb default '[]',
  baas_variants jsonb default '[]',
  has_baas boolean default false,
  pros text[] default '{}',
  cons text[] default '{}',
  energy_comparison jsonb default '[]',
  battery_specs jsonb default '[]',
  charging_specs jsonb default '[]',
  body_type text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.evlistings enable row level security;

-- Public read access (anyone can view listings)
create policy "Public read access" on public.evlistings
  for select using (true);

-- Authenticated users can insert/update/delete (team members)
create policy "Team can insert" on public.evlistings
  for insert to authenticated with check (true);

create policy "Team can update" on public.evlistings
  for update to authenticated using (true) with check (true);

create policy "Team can delete" on public.evlistings
  for delete to authenticated using (true);

-- Auto-update updated_at timestamp
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger evlistings_updated_at
  before update on public.evlistings
  for each row execute function public.update_updated_at();

-- Index for slug lookups
create index if not exists idx_evlistings_slug on public.evlistings(slug);
create index if not exists idx_evlistings_brand on public.evlistings(brand);


-- ── Storage Bucket for EV Photos ─────────────────────────────────────────────
-- Run this separately in SQL Editor after creating the table above:

insert into storage.buckets (id, name, public)
values ('evphotos', 'evphotos', true)
on conflict (id) do nothing;

-- Allow public read access to photos
create policy "Public photo read" on storage.objects
  for select using (bucket_id = 'evphotos');

-- Allow authenticated users to upload/delete photos
create policy "Team photo upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'evphotos');

create policy "Team photo update" on storage.objects
  for update to authenticated using (bucket_id = 'evphotos');

create policy "Team photo delete" on storage.objects
  for delete to authenticated using (bucket_id = 'evphotos');
