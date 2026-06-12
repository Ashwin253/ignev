-- SQL migration to add discontinued status and discontinued date to evlistings and ev_variants
ALTER TABLE public.evlistings 
ADD COLUMN IF NOT EXISTS discontinued BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS discontinued_date TEXT DEFAULT null;

ALTER TABLE public.ev_variants 
ADD COLUMN IF NOT EXISTS discontinued BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS discontinued_date TEXT DEFAULT null;
