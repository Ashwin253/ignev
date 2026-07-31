-- SQL migration to add background_color and text_color columns to public.hero_banners
ALTER TABLE public.hero_banners 
ADD COLUMN IF NOT EXISTS background_color text DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS text_color text DEFAULT '#ffffff';
