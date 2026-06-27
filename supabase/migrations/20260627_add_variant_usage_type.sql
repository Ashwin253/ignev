-- SQL migration to add usage type and continuing variant slug/id to ev_variants
ALTER TABLE public.ev_variants 
ADD COLUMN IF NOT EXISTS usage_type TEXT DEFAULT null,
ADD COLUMN IF NOT EXISTS continuing_variant_id TEXT DEFAULT null;
