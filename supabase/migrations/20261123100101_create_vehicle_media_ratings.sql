create table if not exists public.ev_media_ratings (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.evlistings(id) on delete cascade,
  source_name text not null,
  rating_value numeric(6, 2) not null,
  rating_max numeric(6, 2) not null default 5,
  review_url text,
  created_at timestamptz not null default now(),
  constraint ev_media_ratings_source_name_check check (length(trim(source_name)) > 0),
  constraint ev_media_ratings_rating_check check (
    rating_value >= 0 and rating_max > 0 and rating_value <= rating_max
  )
);

create unique index if not exists idx_ev_media_ratings_listing_source
  on public.ev_media_ratings (listing_id, lower(trim(source_name)));
create index if not exists idx_ev_media_ratings_listing
  on public.ev_media_ratings (listing_id);

alter table public.ev_media_ratings enable row level security;

revoke all on table public.ev_media_ratings from anon, authenticated;
grant select on table public.ev_media_ratings to anon, authenticated;
grant insert, update, delete on table public.ev_media_ratings to authenticated;

create policy "Public read vehicle media ratings"
  on public.ev_media_ratings for select
  to anon, authenticated
  using (true);

create policy "Team insert vehicle media ratings"
  on public.ev_media_ratings for insert
  to authenticated
  with check (
    (select auth.jwt() -> 'app_metadata' ->> 'role') in ('team', 'admin')
    or (select auth.jwt() ->> 'email') like '%@evezy.com'
    or exists (
      select 1
      from public.evlistings listing
      where listing.id = ev_media_ratings.listing_id
        and (
          listing.created_by = (select auth.uid())
          or (select auth.jwt() ->> 'email') = any(coalesce(listing.editors_emails, '{}'::text[]))
        )
    )
  );

create policy "Team update vehicle media ratings"
  on public.ev_media_ratings for update
  to authenticated
  using (
    (select auth.jwt() -> 'app_metadata' ->> 'role') in ('team', 'admin')
    or (select auth.jwt() ->> 'email') like '%@evezy.com'
    or exists (
      select 1
      from public.evlistings listing
      where listing.id = ev_media_ratings.listing_id
        and (
          listing.created_by = (select auth.uid())
          or (select auth.jwt() ->> 'email') = any(coalesce(listing.editors_emails, '{}'::text[]))
        )
    )
  )
  with check (
    (select auth.jwt() -> 'app_metadata' ->> 'role') in ('team', 'admin')
    or (select auth.jwt() ->> 'email') like '%@evezy.com'
    or exists (
      select 1
      from public.evlistings listing
      where listing.id = ev_media_ratings.listing_id
        and (
          listing.created_by = (select auth.uid())
          or (select auth.jwt() ->> 'email') = any(coalesce(listing.editors_emails, '{}'::text[]))
        )
    )
  );

create policy "Team delete vehicle media ratings"
  on public.ev_media_ratings for delete
  to authenticated
  using (
    (select auth.jwt() -> 'app_metadata' ->> 'role') in ('team', 'admin')
    or (select auth.jwt() ->> 'email') like '%@evezy.com'
    or exists (
      select 1
      from public.evlistings listing
      where listing.id = ev_media_ratings.listing_id
        and (
          listing.created_by = (select auth.uid())
          or (select auth.jwt() ->> 'email') = any(coalesce(listing.editors_emails, '{}'::text[]))
        )
    )
  );

notify pgrst, 'reload schema';