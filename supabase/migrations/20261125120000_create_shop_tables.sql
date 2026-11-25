-- ── Shop: products & COD orders ──────────────────────────────────────────────

-- Helper used by this table's triggers (also defined in earlier migrations).
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ── Products / inventory ─────────────────────────────────────────────────────
create table if not exists public.shop_products (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  name text not null,
  description text default '',
  -- accessory | vehicle | spare_part | merch
  product_type text not null default 'accessory',
  category text default 'Accessories',
  brand text default '',
  -- Optional link to a vehicle / model (e.g. "Nexon EV", "/product/tata-nexon-ev")
  vehicle_model text default '',
  vehicle_slug text default '',
  price integer not null default 0, -- in INR
  mrp integer default null,         -- struck-through list price
  sku text default '',
  stock integer not null default 0,
  image text default '',
  gallery_images jsonb default '[]'::jsonb,
  -- [{ "label": "Material", "value": "ABS" }]
  specs jsonb default '[]'::jsonb,
  highlights text[] default '{}',
  is_active boolean default true,
  featured boolean default false,
  cod_available boolean default true,
  sort_order integer default 0,
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on column public.shop_products.product_type is
  'accessory (generic EV accessory), vehicle (an actual EV), spare_part (model-specific part), merch (branded merchandise).';

comment on column public.shop_products.vehicle_model is
  'Optional display link to a vehicle model, e.g. "Nexon EV".';

comment on column public.shop_products.vehicle_slug is
  'Optional site slug to link to, e.g. "tata-nexon-ev" (resolved as /product/<slug>).';

-- ── Cash-on-delivery orders ──────────────────────────────────────────────────
create table if not exists public.shop_orders (
  id uuid default gen_random_uuid() primary key,
  order_number text unique not null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text default '',
  address text not null default '',
  city text default '',
  state text default '',
  pincode text default '',
  -- [{ "productId": "...", "name": "...", "price": 1299, "qty": 1, "image": "..." }]
  items jsonb not null default '[]'::jsonb,
  subtotal integer not null default 0,
  shipping integer not null default 0,
  total integer not null default 0,
  payment_method text not null default 'cod',
  -- placed | confirmed | shipped | delivered | cancelled
  status text not null default 'placed',
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on column public.shop_orders.status is
  'Fulfilment state: placed → confirmed → shipped → delivered, or cancelled.';

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.shop_products enable row level security;
alter table public.shop_orders enable row level security;

-- Products: anyone can read active listings; signed-in team can read everything.
drop policy if exists "Public can read active shop products" on public.shop_products;
create policy "Public can read active shop products" on public.shop_products
  for select using (is_active = true);

drop policy if exists "Team can read all shop products" on public.shop_products;
create policy "Team can read all shop products" on public.shop_products
  for select to authenticated using (true);

drop policy if exists "Team can create shop products" on public.shop_products;
create policy "Team can create shop products" on public.shop_products
  for insert to authenticated with check (true);

drop policy if exists "Team can update shop products" on public.shop_products;
create policy "Team can update shop products" on public.shop_products
  for update to authenticated using (true) with check (true);

drop policy if exists "Team can delete shop products" on public.shop_products;
create policy "Team can delete shop products" on public.shop_products
  for delete to authenticated using (true);

-- Orders: customers (anonymous) may place an order; only the team can read/manage.
drop policy if exists "Anyone can place a shop order" on public.shop_orders;
create policy "Anyone can place a shop order" on public.shop_orders
  for insert to anon, authenticated with check (true);

drop policy if exists "Team can read shop orders" on public.shop_orders;
create policy "Team can read shop orders" on public.shop_orders
  for select to authenticated using (true);

drop policy if exists "Team can update shop orders" on public.shop_orders;
create policy "Team can update shop orders" on public.shop_orders
  for update to authenticated using (true) with check (true);

drop policy if exists "Team can delete shop orders" on public.shop_orders;
create policy "Team can delete shop orders" on public.shop_orders
  for delete to authenticated using (true);

-- ── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists idx_shop_products_slug on public.shop_products(slug);
create index if not exists idx_shop_products_active on public.shop_products(is_active);
create index if not exists idx_shop_products_type on public.shop_products(product_type);
create index if not exists idx_shop_products_model on public.shop_products(vehicle_model);
create index if not exists idx_shop_orders_status on public.shop_orders(status);
create index if not exists idx_shop_orders_created on public.shop_orders(created_at desc);

-- ── Triggers ─────────────────────────────────────────────────────────────────
drop trigger if exists shop_products_updated_at on public.shop_products;
create trigger shop_products_updated_at
  before update on public.shop_products
  for each row execute function public.update_updated_at();

drop trigger if exists shop_orders_updated_at on public.shop_orders;
create trigger shop_orders_updated_at
  before update on public.shop_orders
  for each row execute function public.update_updated_at();

notify pgrst, 'reload schema';
