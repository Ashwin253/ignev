-- Run in Supabase SQL editor if ev_variants already exists without these columns
alter table public.ev_variants
  add column if not exists extra_sections jsonb default '[]';

alter table public.ev_variants
  add column if not exists extra_dimensions jsonb default '[]';

alter table public.ev_variant_features
  add column if not exists extra_features jsonb default '[]';
