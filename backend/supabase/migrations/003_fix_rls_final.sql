-- =========================================
-- Fix RLS Infinite Recursion (FINAL VERSION)
-- =========================================

-- Drop ALL existing policies on organization_members
DROP POLICY IF EXISTS "Users can view members of their organizations" ON organization_members;
DROP POLICY IF EXISTS "Users can view org members where they belong" ON organization_members;

-- Create a helper function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.user_organizations()
RETURNS SETOF UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT organization_id 
  FROM public.organization_members 
  WHERE user_id = auth.uid();
$$;

-- Now create a simple policy using the helper function
-- This avoids recursion because the function runs with SECURITY DEFINER
CREATE POLICY "Users can view members of their organizations" ON organization_members
    FOR SELECT USING (
        organization_id IN (SELECT public.user_organizations())
    );

-- Allow users to view their own membership record
CREATE POLICY "Users can view their own membership" ON organization_members
    FOR SELECT USING (
        user_id = auth.uid()
    );
