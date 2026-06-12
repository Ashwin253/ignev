-- SQL migration to add video_links and featured_photos JSONB columns to evlistings
ALTER TABLE public.evlistings 
ADD COLUMN IF NOT EXISTS video_links jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS featured_photos jsonb DEFAULT '[]';
