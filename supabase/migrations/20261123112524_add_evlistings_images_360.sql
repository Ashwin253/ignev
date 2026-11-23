alter table public.evlistings
  add column if not exists images_360 jsonb not null default '[]'::jsonb;

notify pgrst, 'reload schema';