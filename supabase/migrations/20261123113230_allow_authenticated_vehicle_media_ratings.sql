revoke all on table public.ev_media_ratings from anon, authenticated;
grant select on table public.ev_media_ratings to anon, authenticated;
grant insert, update, delete on table public.ev_media_ratings to authenticated;

drop policy if exists "Team insert vehicle media ratings" on public.ev_media_ratings;
drop policy if exists "Team update vehicle media ratings" on public.ev_media_ratings;
drop policy if exists "Team delete vehicle media ratings" on public.ev_media_ratings;

drop policy if exists "Authenticated insert vehicle media ratings" on public.ev_media_ratings;
drop policy if exists "Authenticated update vehicle media ratings" on public.ev_media_ratings;
drop policy if exists "Authenticated delete vehicle media ratings" on public.ev_media_ratings;

create policy "Authenticated insert vehicle media ratings"
  on public.ev_media_ratings for insert
  to authenticated
  with check (true);

create policy "Authenticated update vehicle media ratings"
  on public.ev_media_ratings for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated delete vehicle media ratings"
  on public.ev_media_ratings for delete
  to authenticated
  using (true);

notify pgrst, 'reload schema';