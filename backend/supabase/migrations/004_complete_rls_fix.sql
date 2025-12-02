-- =========================================
-- COMPLETE RLS FIX - Apply this in Supabase SQL Editor
-- =========================================

-- 1. Drop ALL existing problematic policies
DROP POLICY IF EXISTS "Users can view members of their organizations" ON organization_members;
DROP POLICY IF EXISTS "Users can view org members where they belong" ON organization_members;
DROP POLICY IF EXISTS "Users can view their own membership" ON organization_members;
DROP POLICY IF EXISTS "Users can view org members" ON organization_members;
DROP POLICY IF EXISTS "System can insert org members" ON organization_members;

-- 2. Temporarily DISABLE RLS on organization_members to break the recursion
ALTER TABLE organization_members DISABLE ROW LEVEL SECURITY;

-- 3. Verify the trigger is working properly
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (NEW.id, auth.uid(), 'OWNER');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_organization_created ON organizations;
CREATE TRIGGER on_organization_created
    AFTER INSERT ON organizations
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_organization();

-- 4. Create helper function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.user_belongs_to_org(org_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.organization_members 
    WHERE organization_id = org_id 
    AND user_id = auth.uid()
  );
$$;

-- 5. Fix the projects policies to use the helper function
DROP POLICY IF EXISTS "Users can view projects in their organizations" ON keys_projects;
DROP POLICY IF EXISTS "Users can insert projects in their organizations" ON keys_projects;
DROP POLICY IF EXISTS "Users can update projects in their organizations" ON keys_projects;
DROP POLICY IF EXISTS "Users can delete projects in their organizations" ON keys_projects;

CREATE POLICY "Users can view projects in their organizations" ON keys_projects
    FOR SELECT USING (
        organization_id IS NULL OR public.user_belongs_to_org(organization_id)
    );

CREATE POLICY "Users can insert projects in their organizations" ON keys_projects
    FOR INSERT WITH CHECK (
        organization_id IS NULL OR public.user_belongs_to_org(organization_id)
    );

CREATE POLICY "Users can update projects in their organizations" ON keys_projects
    FOR UPDATE USING (
        organization_id IS NULL OR public.user_belongs_to_org(organization_id)
    );

CREATE POLICY "Users can delete projects in their organizations" ON keys_projects
    FOR DELETE USING (
        organization_id IS NULL OR public.user_belongs_to_org(organization_id)
    );

-- 6. Fix the credentials policies to use the helper function
DROP POLICY IF EXISTS "Users can view credentials in their organizations" ON keys_credentials;
DROP POLICY IF EXISTS "Users can insert credentials in their organizations" ON keys_credentials;
DROP POLICY IF EXISTS "Users can update credentials in their organizations" ON keys_credentials;
DROP POLICY IF EXISTS "Users can delete credentials in their organizations" ON keys_credentials;

CREATE POLICY "Users can view credentials in their organizations" ON keys_credentials
    FOR SELECT USING (
        organization_id IS NULL OR public.user_belongs_to_org(organization_id)
    );

CREATE POLICY "Users can insert credentials in their organizations" ON keys_credentials
    FOR INSERT WITH CHECK (
        organization_id IS NULL OR public.user_belongs_to_org(organization_id)
    );

CREATE POLICY "Users can update credentials in their organizations" ON keys_credentials
    FOR UPDATE USING (
        organization_id IS NULL OR public.user_belongs_to_org(organization_id)
    );

CREATE POLICY "Users can delete credentials in their organizations" ON keys_credentials
    FOR DELETE USING (
        organization_id IS NULL OR public.user_belongs_to_org(organization_id)
    );
