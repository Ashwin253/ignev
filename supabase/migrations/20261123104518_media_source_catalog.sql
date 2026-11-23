create table if not exists public.ev_media_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website_url text,
  logo_url text,
  created_at timestamptz not null default now(),
  constraint ev_media_sources_name_check check (length(trim(name)) > 0),
  constraint ev_media_sources_website_url_check check (website_url is null or website_url ~* '^https?://'),
  constraint ev_media_sources_logo_url_check check (logo_url is null or logo_url ~* '^https?://')
);

create unique index if not exists idx_ev_media_sources_name
  on public.ev_media_sources (lower(trim(name)));

insert into public.ev_media_sources (name, website_url, logo_url)
values
  ('Autocar India', 'https://www.autocarindia.com', null),
  ('CarWale', 'https://www.carwale.com', null),
  ('ZigWheels', 'https://www.zigwheels.com', 'https://images.zigcdn.com/images/fav-icon.ico'),
  ('CarDekho', 'https://www.cardekho.com', 'https://stimg.cardekho.com/pwa/img/Desktop-logo.svg'),
  ('EVO India', 'https://www.evoindia.com', null),
  ('Overdrive', 'https://www.overdrive.in', null),
  ('RushLane', 'https://www.rushlane.com', null),
  ('MotorBeam', 'https://www.motorbeam.com', null)
on conflict ((lower(trim(name)))) do nothing;

insert into public.ev_media_sources (name)
select distinct trim(source_name)
from public.ev_media_ratings
where length(trim(source_name)) > 0
on conflict ((lower(trim(name)))) do nothing;

alter table public.ev_media_ratings
  add column if not exists source_id uuid references public.ev_media_sources(id) on delete restrict;

update public.ev_media_ratings rating
set source_id = source.id
from public.ev_media_sources source
where lower(trim(source.name)) = lower(trim(rating.source_name))
  and rating.source_id is null;

alter table public.ev_media_ratings
  alter column source_id set not null;

alter table public.ev_media_sources enable row level security;

revoke all on table public.ev_media_sources from anon, authenticated;
grant select on table public.ev_media_sources to anon, authenticated;
grant insert, update on table public.ev_media_sources to authenticated;

create policy "Public read vehicle media sources"
  on public.ev_media_sources for select
  to anon, authenticated
  using (true);

create policy "Team insert vehicle media sources"
  on public.ev_media_sources for insert
  to authenticated
  with check (
    (select auth.jwt() -> 'app_metadata' ->> 'role') in ('team', 'admin')
    or (select auth.jwt() ->> 'email') like '%@evezy.com'
  );

create policy "Team update vehicle media sources"
  on public.ev_media_sources for update
  to authenticated
  using (
    (select auth.jwt() -> 'app_metadata' ->> 'role') in ('team', 'admin')
    or (select auth.jwt() ->> 'email') like '%@evezy.com'
  )
  with check (
    (select auth.jwt() -> 'app_metadata' ->> 'role') in ('team', 'admin')
    or (select auth.jwt() ->> 'email') like '%@evezy.com'
  );

notify pgrst, 'reload schema';