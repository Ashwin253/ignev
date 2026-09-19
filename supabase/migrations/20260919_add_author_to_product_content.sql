-- Migration to add author_name and author_email to product_content table
ALTER TABLE public.product_content 
ADD COLUMN IF NOT EXISTS author_name text,
ADD COLUMN IF NOT EXISTS author_email text;
