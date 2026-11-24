-- ── Used Vehicles Marketplace Table ──────────────────────────────────────────

-- Helper functions used by this table's triggers.
-- Defined with CREATE OR REPLACE so this migration also works on databases
-- that were not built from supabase/schema.sql (where they already exist).
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function public.clean_brand_name()
returns trigger as $$
begin
  new.brand = upper(trim(new.brand));
  return new;
end;
$$ language plpgsql;

create table if not exists public.used_vehicles (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  title text not null,
  brand text not null default '',
  model text not null default '',
  variant text default '',
  year integer not null,
  reg_month_year text default '',
  body_type text default 'SUV',
  odometer_km integer not null default 0,
  ownership text not null default '1st Owner',
  price integer not null, -- in INR (e.g. 945000)
  original_price integer default null, -- Ex-showroom new price
  emi_starting integer default null, -- Monthly EMI starting amount
  city text not null default 'Noida',
  state text default 'Delhi NCR',
  rto text default '',
  registration_number text default '',
  color text default '',

  -- EV Specific Attributes
  battery_capacity_kwh numeric(5,2) default null,
  battery_health_percentage integer default 95,
  real_range_km integer default null,
  certified_range_km integer default null,
  charging_time_hours numeric(4,1) default null,
  fast_charging_minutes integer default null,
  motor_power_ps integer default null,
  motor_torque_nm integer default null,
  warranty_remaining text default '',
  insurance_type text default 'Comprehensive',
  insurance_valid_till text default '',

  -- Source Information
  source_type text not null default 'direct', -- 'direct' (from us / Evplse Assured), 'dealer', 'customer'
  seller_name text default 'Evplse Assured Hub',
  seller_phone text default '',
  seller_location text default '',
  dealer_id uuid default null,

  -- Photos & 360 Turntable
  photo text default '',
  gallery_images jsonb default '[]'::jsonb,
  images_360 jsonb not null default '[]'::jsonb,
  media_images jsonb default '[]'::jsonb,

  -- Inspection & Condition Highlights
  inspection_rating numeric(2,1) default 4.8,
  inspection_summary jsonb default '[]'::jsonb,
  features text[] default '{}',
  pros text[] default '{}',
  imperfections jsonb default '[]'::jsonb,

  -- Status & Action CTA
  status text not null default 'available', -- 'available', 'booked', 'sold'
  cta_action text not null default 'both', -- 'test_drive', 'enquire', 'both'
  featured boolean default false,

  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on column public.used_vehicles.images_360 is
  'Clockwise exterior image URLs: Front, Front-right, Right, Right-end (rear-right), Rear, End-left (rear-left), Left, Left-start (front-left). 8-frame turntable view.';

comment on column public.used_vehicles.source_type is
  'Origin source of the pre-owned EV: direct (Evplse Assured / from us), dealer (Certified Dealer), or customer (Individual seller).';

comment on column public.used_vehicles.cta_action is
  'Customer action mode: test_drive (Book Test Drive / Visit), enquire (Enquire Now), or both.';

-- RLS policies
alter table public.used_vehicles enable row level security;

drop policy if exists "Public can read available used vehicles" on public.used_vehicles;
create policy "Public can read available used vehicles" on public.used_vehicles
  for select using (true);

drop policy if exists "Authenticated users can create used vehicles" on public.used_vehicles;
create policy "Authenticated users can create used vehicles" on public.used_vehicles
  for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update used vehicles" on public.used_vehicles;
create policy "Authenticated users can update used vehicles" on public.used_vehicles
  for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete used vehicles" on public.used_vehicles;
create policy "Authenticated users can delete used vehicles" on public.used_vehicles
  for delete to authenticated using (true);

-- Indexing for quick filtering
create index if not exists idx_used_vehicles_slug on public.used_vehicles(slug);
create index if not exists idx_used_vehicles_brand on public.used_vehicles(brand);
create index if not exists idx_used_vehicles_city on public.used_vehicles(city);
create index if not exists idx_used_vehicles_status on public.used_vehicles(status);
create index if not exists idx_used_vehicles_source on public.used_vehicles(source_type);

-- Trigger for brand uppercase
create or replace trigger enforce_uppercase_used_brand
  before insert or update on public.used_vehicles
  for each row execute function public.clean_brand_name();

-- Trigger for updated_at
create or replace trigger used_vehicles_updated_at
  before update on public.used_vehicles
  for each row execute function public.update_updated_at();

notify pgrst, 'reload schema';
