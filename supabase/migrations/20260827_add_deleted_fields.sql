-- SQL migration to add deleted and deleted_at columns to public.evlistings
ALTER TABLE public.evlistings 
ADD COLUMN IF NOT EXISTS deleted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT null;
