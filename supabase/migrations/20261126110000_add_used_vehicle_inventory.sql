-- A used listing can represent one inspected vehicle or a pool of matching units.
alter table public.used_vehicles
  add column if not exists listing_type text not null default 'detailed'
    check (listing_type in ('detailed', 'inventory')),
  add column if not exists stock_left integer not null default 0
    check (stock_left >= 0);

comment on column public.used_vehicles.listing_type is
  'detailed is one individually described vehicle; inventory is a model-level listing with multiple matching units.';
comment on column public.used_vehicles.stock_left is
  'Number of matching units currently available. Used only for inventory listings.';

notify pgrst, 'reload schema';
