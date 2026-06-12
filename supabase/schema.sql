-- EVPULSE: Normalized EV Listings Schema
-- Run this in your Supabase SQL Editor

-- Auto-update timestamp function
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ── Main Listings Table ──────────────────────────────────────────────────────

create table if not exists public.evlistings (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  title text not null,
  brand text not null default '',
  body_type text default '',
  commercial boolean default false,
  launchdate text default null,
  photo text default '',
  gallery_images jsonb default '[]',
  colors text[] default '{}',
  types text[] default '{}',
  pros text[] default '{}',
  cons text[] default '{}',
  has_baas boolean default false,
  price_bracket text default '',
  discontinued boolean default false,
  discontinued_date text default null,
  video_links jsonb default '[]',
  featured_photos jsonb default '[]',
  parent_id uuid references public.evlistings(id) on delete set null,
  created_by uuid references auth.users(id) default auth.uid(),
  created_by_email text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.evlistings enable row level security;

create policy "Public read access" on public.evlistings
  for select using (true);
create policy "Team can insert" on public.evlistings
  for insert to authenticated with check (true);
create policy "Owner can update" on public.evlistings
  for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy "Owner can delete" on public.evlistings
  for delete to authenticated using (created_by = auth.uid());

create trigger evlistings_updated_at
  before update on public.evlistings
  for each row execute function public.update_updated_at();

create index if not exists idx_evlistings_slug on public.evlistings(slug);
create index if not exists idx_evlistings_brand on public.evlistings(brand);

-- ── Variants Table ───────────────────────────────────────────────────────────

create table if not exists public.ev_variants (
  id uuid default gen_random_uuid() primary key,
  listing_id uuid references public.evlistings(id) on delete cascade not null,
  variant_name text not null,
  slug text not null,
  model_year integer not null,
  price numeric default 0,
  top_speed numeric default null,
  battery_capacity_kwh numeric default null,
  driving_range_km numeric default null,
  charging_time_mins numeric default null,
  max_power_bhp numeric default null,
  max_torque_nm numeric default null,
  has_baas boolean default false,
  baas_price_per_km numeric default null,
  baas_upfront_price numeric default null,
  baas_model_name text default '',
  charging_time_ac_hours numeric default null,
  charging_time_dc_mins numeric default null,
  max_dc_charging_rate_kw numeric default null,
  -- Capacity & Dimensions
  length_mm numeric default null,
  width_mm numeric default null,
  height_mm numeric default null,
  wheelbase_mm numeric default null,
  ground_clearance_mm numeric default null,
  boot_space_litres numeric default null,
  turning_radius_m numeric default null,
  custom_fields jsonb default '[]',
  extra_motor jsonb default '[]',
  extra_charging jsonb default '[]',
  extra_sections jsonb default '[]',
  extra_dimensions jsonb default '[]',
  discontinued boolean default false,
  discontinued_date text default null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint ev_variants_slug_year_unique unique (slug, model_year)
);

alter table public.ev_variants enable row level security;

create policy "Public read variants" on public.ev_variants for select using (true);
create policy "Team manage variants insert" on public.ev_variants for insert to authenticated with check (true);
create policy "Team manage variants update" on public.ev_variants for update to authenticated using (true) with check (true);
create policy "Team manage variants delete" on public.ev_variants for delete to authenticated using (true);

create trigger ev_variants_updated_at
  before update on public.ev_variants
  for each row execute function public.update_updated_at();

create index if not exists idx_ev_variants_listing on public.ev_variants(listing_id);

-- ── Variant Features Table ───────────────────────────────────────────────────

create table if not exists public.ev_variant_features (
  variant_id uuid references public.ev_variants(id) on delete cascade primary key,
  front_brakes text default 'Disc',
  rear_brakes text default 'Disc',
  drivetrain text default 'FWD',
  seating_capacity integer default 5,
  front_suspension text default '',
  rear_suspension text default '',
  wheel_size_inches integer default null,
  has_rear_wiper boolean default false,
  has_rear_defogger boolean default false,
  has_rain_sensing_wipers boolean default false,
  headlight_type text default 'Halogen',
  has_sunroof boolean default false,
  is_panoramic_sunroof boolean default false,
  has_rear_ac_vents boolean default false,
  has_ventilated_seats boolean default false,
  has_climate_control boolean default false,
  has_cruise_control boolean default false,
  has_wireless_charger boolean default false,
  has_keyless_entry boolean default false,
  screen_size_inches numeric default null,
  speaker_count integer default 4,
  has_wireless_carplay_android_auto boolean default false,
  has_connected_car_app boolean default false,
  has_ota_updates boolean default false,
  airbag_count integer default 2,
  has_abs boolean default true,
  has_ebd boolean default true,
  has_esp boolean default false,
  has_tpms boolean default false,
  has_360_camera boolean default false,
  adas_level integer default 0,
  ncap_safety_rating integer default null,
  custom_fields jsonb default '[]',
  extra_features jsonb default '[]',
  updated_at timestamptz default now()
);

alter table public.ev_variant_features enable row level security;

create policy "Public read features" on public.ev_variant_features for select using (true);
create policy "Team manage features insert" on public.ev_variant_features for insert to authenticated with check (true);
create policy "Team manage features update" on public.ev_variant_features for update to authenticated using (true) with check (true);
create policy "Team manage features delete" on public.ev_variant_features for delete to authenticated using (true);

create trigger ev_variant_features_updated_at
  before update on public.ev_variant_features
  for each row execute function public.update_updated_at();

-- ── Energy Comparisons Table ─────────────────────────────────────────────────

create table if not exists public.ev_energy_comparisons (
  id uuid default gen_random_uuid() primary key,
  listing_id uuid references public.evlistings(id) on delete cascade not null,
  category text not null default 'fuel',  -- 'fuel' or 'model'
  name text not null default '',           -- e.g. "Avg Petrol Car" or "Tata Nexon EV"
  fuel_type text not null default '',      -- Petrol, Diesel, CNG, EV, self
  mileage text default '',                 -- km/L or km range for EVs
  fuel_price text default '',              -- ₹/L or ₹/km for EVs
  model_used text default '',              -- variant name used for comparison
  brand text default '',                   -- competitor brand (for model category)
  created_at timestamptz default now()
);

alter table public.ev_energy_comparisons enable row level security;
create policy "Public read energy" on public.ev_energy_comparisons for select using (true);
create policy "Team manage energy" on public.ev_energy_comparisons for insert to authenticated with check (true);
create policy "Team update energy" on public.ev_energy_comparisons for update to authenticated using (true) with check (true);
create policy "Team delete energy" on public.ev_energy_comparisons for delete to authenticated using (true);

-- ── Page Views / Activity Analytics ───────────────────────────────────────────

create table if not exists public.page_views (
  id uuid default gen_random_uuid() primary key,
  path text not null,
  slug text default '',
  referrer text default '',
  device text default 'desktop',
  created_at timestamptz default now()
);

alter table public.page_views enable row level security;
create policy "Public insert views" on public.page_views for insert with check (true);
create policy "Team read views" on public.page_views for select to authenticated using (true);

create index if not exists idx_page_views_path on public.page_views(path);
create index if not exists idx_page_views_created on public.page_views(created_at);

-- Function to get top pages
create or replace function public.get_top_pages()
returns table(path text, count bigint) as $$
  select path, count(*) as count
  from public.page_views
  group by path
  order by count desc
  limit 10;
$$ language sql security definer;

-- ── Fuel Prices Table ─────────────────────────────────────────────────────────

create table if not exists public.fuel_prices (
  id uuid default gen_random_uuid() primary key,
  city text not null default 'Delhi',
  petrol_per_litre numeric not null default 104,
  diesel_per_litre numeric not null default 90,
  cng_per_kg numeric not null default 80,
  electricity_per_kwh numeric not null default 8,
  updated_by_email text default '',
  updated_at timestamptz default now()
);

alter table public.fuel_prices enable row level security;
create policy "Public read fuel prices" on public.fuel_prices for select using (true);
create policy "Team manage fuel prices" on public.fuel_prices for insert to authenticated with check (true);
create policy "Team update fuel prices" on public.fuel_prices for update to authenticated using (true) with check (true);
create policy "Team delete fuel prices" on public.fuel_prices for delete to authenticated using (true);

-- Insert default Delhi prices
insert into public.fuel_prices (city, petrol_per_litre, diesel_per_litre, cng_per_kg, electricity_per_kwh)
values ('Delhi', 94.72, 87.62, 75.09, 8)
on conflict do nothing;

-- ── Leads / Enquiries Table ──────────────────────────────────────────────────

create table if not exists public.leads (
  id uuid default gen_random_uuid() primary key,
  name text not null default '',
  phone text not null default '',
  pincode text default '',
  interest text default '',
  message text default '',
  source text default 'get-assist',
  assisted_by uuid references auth.users(id) default null,
  assisted_at timestamptz default null,
  created_at timestamptz default now()
);

alter table public.leads enable row level security;

-- All authenticated team members can view leads
create policy "Team read leads" on public.leads for select to authenticated using (true);
-- Anyone can insert (from the public enquiry form)
create policy "Public insert leads" on public.leads for insert with check (true);
-- Team can update (mark as assisted)
create policy "Team update leads" on public.leads for update to authenticated using (true) with check (true);

-- ── Storage Bucket for EV Photos ─────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('evphotos', 'evphotos', true)
on conflict (id) do nothing;

create policy "Public photo read" on storage.objects
  for select using (bucket_id = 'evphotos');
create policy "Team photo upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'evphotos');
create policy "Team photo update" on storage.objects
  for update to authenticated using (bucket_id = 'evphotos');
create policy "Team photo delete" on storage.objects
  for delete to authenticated using (bucket_id = 'evphotos');

-- ── Brand Capitalization & Triggers ──────────────────────────────────────────

-- Trigger to enforce uppercase brand names on evlistings
create or replace function public.clean_brand_name()
returns trigger as $$
begin
  new.brand = upper(trim(new.brand));
  return new;
end;
$$ language plpgsql;

create or replace trigger enforce_uppercase_brand
  before insert or update on public.evlistings
  for each row execute function public.clean_brand_name();

-- Trigger to enforce uppercase brand names on ev_energy_comparisons
create or replace function public.clean_energy_brand_name()
returns trigger as $$
begin
  new.brand = upper(trim(new.brand));
  return new;
end;
$$ language plpgsql;

create or replace trigger enforce_uppercase_energy_brand
  before insert or update on public.ev_energy_comparisons
  for each row execute function public.clean_energy_brand_name();

