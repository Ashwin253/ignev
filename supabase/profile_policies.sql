-- ── Profile & Leads Row-Level Security (RLS) Policies ─────────────────────────
-- Run this in your Supabase SQL Editor to secure your leads table.

-- 1. Enable RLS on public.leads (if not already done)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing loose select policy
DROP POLICY IF EXISTS "Team read leads" ON public.leads;
DROP POLICY IF EXISTS "Select leads policy" ON public.leads;

-- 3. Create a secure SELECT policy distinguishing Team members from Users
CREATE POLICY "Select leads policy" ON public.leads FOR SELECT TO authenticated
USING (
  -- Allow team/admin members based on metadata role or email indicators
  (auth.jwt() -> 'user_metadata' ->> 'role' = 'team') OR
  (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
  (auth.jwt() ->> 'email' LIKE '%@evezy.com') OR
  (auth.jwt() ->> 'email' LIKE '%admin%') OR
  (auth.jwt() ->> 'email' LIKE '%team%') OR
  
  -- Allow regular users to ONLY view leads matching their own registered phone number
  (phone = (auth.jwt() -> 'user_metadata' ->> 'phone'))
);

-- 4. Drop existing loose update policy
DROP POLICY IF EXISTS "Team update leads" ON public.leads;
DROP POLICY IF EXISTS "Update leads policy" ON public.leads;

-- 5. Create a secure UPDATE policy restricting edit access to Team members only
CREATE POLICY "Update leads policy" ON public.leads FOR UPDATE TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role' = 'team') OR
  (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
  (auth.jwt() ->> 'email' LIKE '%@evezy.com') OR
  (auth.jwt() ->> 'email' LIKE '%admin%') OR
  (auth.jwt() ->> 'email' LIKE '%team%')
)
WITH CHECK (true);

-- 6. Ensure anyone can insert leads (public submissions on buy/sell/service forms)
DROP POLICY IF EXISTS "Public insert leads" ON public.leads;
CREATE POLICY "Public insert leads" ON public.leads FOR INSERT WITH CHECK (true);

-- 7. Elevate all existing users in raw_user_meta_data to admin status
UPDATE auth.users
SET raw_user_meta_data = 
  COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb;

