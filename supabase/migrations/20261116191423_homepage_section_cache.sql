create table if not exists public.homepage_section_cache (
  cache_key text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.homepage_section_cache enable row level security;

grant select on public.homepage_section_cache to anon, authenticated;
grant insert, update on public.homepage_section_cache to authenticated;

drop policy if exists "Public read homepage cache" on public.homepage_section_cache;
create policy "Public read homepage cache"
  on public.homepage_section_cache for select to anon, authenticated
  using (true);

drop policy if exists "Team refresh homepage cache" on public.homepage_section_cache;
create policy "Team refresh homepage cache"
  on public.homepage_section_cache for all to authenticated
  using (
    (select auth.jwt() -> 'app_metadata' ->> 'role') in ('team', 'admin')
    or (select auth.jwt() ->> 'email') like '%@evezy.com'
    or exists (
      select 1
      from public.evlistings listing
      where listing.created_by = (select auth.uid())
         or (select auth.jwt() ->> 'email') = any(coalesce(listing.editors_emails, '{}'::text[]))
    )
  )
  with check (
    (select auth.jwt() -> 'app_metadata' ->> 'role') in ('team', 'admin')
    or (select auth.jwt() ->> 'email') like '%@evezy.com'
    or exists (
      select 1
      from public.evlistings listing
      where listing.created_by = (select auth.uid())
         or (select auth.jwt() ->> 'email') = any(coalesce(listing.editors_emails, '{}'::text[]))
    )
  );

-- Seed the first snapshot so the cache is usable immediately after migration.
insert into public.homepage_section_cache (cache_key, payload)
select
  'homepage',
  jsonb_build_object(
    'listings', coalesce((
      select jsonb_agg(to_jsonb(listing) order by listing.created_at desc)
      from public.evlistings listing
      where coalesce(listing.deleted, false) = false
    ), '[]'::jsonb),
    'variants', coalesce((
      select jsonb_agg(to_jsonb(variant) order by variant.price asc nulls last)
      from public.ev_variants variant
      join public.evlistings listing on listing.id = variant.listing_id
      where coalesce(listing.deleted, false) = false
    ), '[]'::jsonb),
    'quickMatch2LakhSlugs', '[]'::jsonb,
    'categorySlugs', '{}'::jsonb
  )
on conflict (cache_key) do update
set payload = excluded.payload, updated_at = now()
where coalesce(jsonb_array_length(public.homepage_section_cache.payload -> 'listings'), 0) = 0;
