-- Migration to add slug column to product_content table for custom SEO-friendly article URLs
ALTER TABLE public.product_content 
ADD COLUMN IF NOT EXISTS slug text;

CREATE INDEX IF NOT EXISTS idx_product_content_slug ON public.product_content(slug);
