-- SQL migration to add coming_soon, announced, concept, and facelift columns to public.evlistings
ALTER TABLE public.evlistings 
ADD COLUMN IF NOT EXISTS coming_soon boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS announced boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS concept boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS facelift boolean DEFAULT false;
