-- Keep event IDs durable for the whole site and make recently used IDs easy to find.
-- The dashboard reads the three most recently referenced rows from public.events.

CREATE OR REPLACE FUNCTION public.sync_event_reference()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  normalized_event_id text;
  event_slug text;
  resolved_event_uuid uuid;
BEGIN
  normalized_event_id := nullif(upper(trim(NEW.event_id)), '');
  IF normalized_event_id IS NULL THEN
    NEW.event_id := NULL;
    NEW.event_uuid := NULL;
    RETURN NEW;
  END IF;

  event_slug := trim(both '-' from lower(regexp_replace(normalized_event_id, '[^a-zA-Z0-9]+', '-', 'g')));
  INSERT INTO public.events (event_id, slug, title)
  VALUES (normalized_event_id, event_slug, normalized_event_id)
  ON CONFLICT (event_id) DO UPDATE
    SET updated_at = now();

  SELECT id INTO resolved_event_uuid
  FROM public.events
  WHERE event_id = normalized_event_id;
  NEW.event_id := normalized_event_id;
  NEW.event_uuid := resolved_event_uuid;
  RETURN NEW;
END;
$$;

-- This function is invoked only by the protected table triggers, not by the API.
REVOKE ALL ON FUNCTION public.sync_event_reference() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_event_reference() TO authenticated;

CREATE INDEX IF NOT EXISTS idx_events_recently_used
  ON public.events (updated_at DESC);

NOTIFY pgrst, 'reload schema';
