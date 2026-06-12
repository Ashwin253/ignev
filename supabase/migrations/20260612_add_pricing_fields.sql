-- SQL migration to add city_pricing JSONB column to evlistings
ALTER TABLE public.evlistings 
ADD COLUMN IF NOT EXISTS city_pricing jsonb DEFAULT '[]';
