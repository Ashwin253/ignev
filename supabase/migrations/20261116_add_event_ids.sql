-- Shared event IDs for stories, vehicle listings, and event-specific variants.
-- Example: EICMA2026 groups editorial content, vehicle listings, and variants.

CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  hero_image text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read events" ON public.events;
CREATE POLICY "Public read events" ON public.events FOR SELECT TO anon, authenticated USING (is_active = true);
DROP POLICY IF EXISTS "Authenticated manage events" ON public.events;
CREATE POLICY "Authenticated manage events" ON public.events FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events (slug);

-- Backfill one event record per legacy event_id so existing event pages survive migration.
INSERT INTO public.events (event_id, slug, title)
SELECT DISTINCT ON (normalized_id)
  normalized_id,
  lower(regexp_replace(normalized_id, '[^a-zA-Z0-9]+', '-', 'g')),
  normalized_id
FROM (
  SELECT upper(trim(event_id)) AS normalized_id FROM public.evlistings WHERE nullif(trim(event_id), '') IS NOT NULL
  UNION ALL
  SELECT upper(trim(event_id)) AS normalized_id FROM public.ev_variants WHERE nullif(trim(event_id), '') IS NOT NULL
  UNION ALL
  SELECT upper(trim(event_id)) AS normalized_id FROM public.product_content WHERE nullif(trim(event_id), '') IS NOT NULL
) AS legacy_events
ORDER BY normalized_id
ON CONFLICT (event_id) DO NOTHING;

ALTER TABLE public.evlistings
  ADD COLUMN IF NOT EXISTS event_id text;

ALTER TABLE public.ev_variants
  ADD COLUMN IF NOT EXISTS event_id text;

ALTER TABLE public.product_content
  ADD COLUMN IF NOT EXISTS event_id text,
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS author_name text,
  ADD COLUMN IF NOT EXISTS author_email text;

ALTER TABLE public.evlistings
  ADD COLUMN IF NOT EXISTS event_uuid uuid REFERENCES public.events(id) ON DELETE SET NULL;

ALTER TABLE public.ev_variants
  ADD COLUMN IF NOT EXISTS event_uuid uuid REFERENCES public.events(id) ON DELETE SET NULL;

ALTER TABLE public.product_content
  ADD COLUMN IF NOT EXISTS event_uuid uuid REFERENCES public.events(id) ON DELETE SET NULL;

UPDATE public.evlistings l SET event_uuid = e.id FROM public.events e WHERE l.event_uuid IS NULL AND upper(trim(l.event_id)) = e.event_id;
UPDATE public.ev_variants v SET event_uuid = e.id FROM public.events e WHERE v.event_uuid IS NULL AND upper(trim(v.event_id)) = e.event_id;
UPDATE public.product_content c SET event_uuid = e.id FROM public.events e WHERE c.event_uuid IS NULL AND upper(trim(c.event_id)) = e.event_id;

-- Keep the legacy-friendly event_id editor fields in sync with canonical UUID links.
CREATE OR REPLACE FUNCTION public.sync_event_reference()
RETURNS trigger AS $$
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
  ON CONFLICT (event_id) DO NOTHING;

  SELECT id INTO resolved_event_uuid FROM public.events WHERE event_id = normalized_event_id;
  NEW.event_id := normalized_event_id;
  NEW.event_uuid := resolved_event_uuid;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS evlistings_sync_event_reference ON public.evlistings;
CREATE TRIGGER evlistings_sync_event_reference BEFORE INSERT OR UPDATE OF event_id ON public.evlistings FOR EACH ROW EXECUTE FUNCTION public.sync_event_reference();
DROP TRIGGER IF EXISTS ev_variants_sync_event_reference ON public.ev_variants;
CREATE TRIGGER ev_variants_sync_event_reference BEFORE INSERT OR UPDATE OF event_id ON public.ev_variants FOR EACH ROW EXECUTE FUNCTION public.sync_event_reference();
DROP TRIGGER IF EXISTS product_content_sync_event_reference ON public.product_content;
CREATE TRIGGER product_content_sync_event_reference BEFORE INSERT OR UPDATE OF event_id ON public.product_content FOR EACH ROW EXECUTE FUNCTION public.sync_event_reference();

CREATE INDEX IF NOT EXISTS idx_evlistings_event_id
  ON public.evlistings (event_id)
  WHERE event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_content_event_id
  ON public.product_content (event_id)
  WHERE event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_content_slug
  ON public.product_content (slug)
  WHERE slug IS NOT NULL;

-- Keep legacy article URLs usable, and initialize the optional slug from url.
UPDATE public.product_content
SET slug = url
WHERE slug IS NULL AND url IS NOT NULL;

NOTIFY pgrst, 'reload schema';

CREATE INDEX IF NOT EXISTS idx_ev_variants_event_id
  ON public.ev_variants (event_id)
  WHERE event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_evlistings_event_uuid ON public.evlistings (event_uuid) WHERE event_uuid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ev_variants_event_uuid ON public.ev_variants (event_uuid) WHERE event_uuid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_product_content_event_uuid ON public.product_content (event_uuid) WHERE event_uuid IS NOT NULL;

NOTIFY pgrst, 'reload schema';

