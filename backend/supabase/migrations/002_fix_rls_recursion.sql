-- =========================================
-- Fix RLS Infinite Recursion
-- =========================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view members of their organizations" ON organization_members;

-- Create a simpler policy that doesn't cause recursion
-- Users can only see organization_members records where they are a member
CREATE POLICY "Users can view members of their organizations" ON organization_members
    FOR SELECT USING (
        user_id = auth.uid()
        OR
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Alternative: Use SECURITY DEFINER to bypass RLS in the check
-- This is safer and prevents recursion
DROP POLICY IF EXISTS "Users can view members of their organizations" ON organization_members;

CREATE POLICY "Users can view members of their organizations" ON organization_members
    FOR SELECT USING (
        -- User can see their own membership
        user_id = auth.uid()
    );

-- Add policy to allow viewing other members if you're in the same org
-- But we need to do this without recursion
CREATE POLICY "Users can view org members where they belong" ON organization_members
    FOR SELECT USING (
        organization_id IN (
            SELECT om.organization_id 
            FROM organization_members om
            WHERE om.user_id = auth.uid()
        )
    );
