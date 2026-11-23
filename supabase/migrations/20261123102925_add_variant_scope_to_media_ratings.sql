create unique index if not exists idx_ev_variants_listing_id_id
  on public.ev_variants (listing_id, id);

alter table public.ev_media_ratings
  add column if not exists variant_id uuid;

alter table public.ev_media_ratings
  add constraint ev_media_ratings_variant_listing_fkey
  foreign key (listing_id, variant_id)
  references public.ev_variants (listing_id, id)
  on delete cascade;

drop index if exists public.idx_ev_media_ratings_listing_source;

create unique index if not exists idx_ev_media_ratings_listing_source
  on public.ev_media_ratings (listing_id, lower(trim(source_name)))
  where variant_id is null;
create unique index if not exists idx_ev_media_ratings_listing_variant_source
  on public.ev_media_ratings (listing_id, variant_id, lower(trim(source_name)))
  where variant_id is not null;
create index if not exists idx_ev_media_ratings_listing_variant
  on public.ev_media_ratings (listing_id, variant_id);

notify pgrst, 'reload schema';