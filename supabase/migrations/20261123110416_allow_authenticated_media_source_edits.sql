drop policy if exists "Team insert vehicle media sources" on public.ev_media_sources;
drop policy if exists "Team update vehicle media sources" on public.ev_media_sources;
drop policy if exists "Authenticated insert vehicle media sources" on public.ev_media_sources;
drop policy if exists "Authenticated update vehicle media sources" on public.ev_media_sources;

grant insert, update on table public.ev_media_sources to authenticated;

create policy "Authenticated insert vehicle media sources"
  on public.ev_media_sources for insert
  to authenticated
  with check (true);

create policy "Authenticated update vehicle media sources"
  on public.ev_media_sources for update
  to authenticated
  using (true)
  with check (true);

notify pgrst, 'reload schema';