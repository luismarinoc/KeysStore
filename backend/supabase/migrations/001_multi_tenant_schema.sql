-- =========================================
-- Multi-Tenant Schema Migration
-- =========================================

-- 1. Create Organizations Table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Organization Members Table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'organization_role') THEN
        CREATE TYPE organization_role AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS organization_members (
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role organization_role DEFAULT 'MEMBER',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (organization_id, user_id)
);

-- 3. Add organization_id to existing tables
ALTER TABLE keys_projects 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE keys_credentials 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- 4. Create Indexes
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_org ON keys_projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_credentials_org ON keys_credentials(organization_id);

-- 5. Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- Organizations
CREATE POLICY "Users can view organizations they belong to" ON organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_members.organization_id = organizations.id
            AND organization_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create organizations" ON organizations
    FOR INSERT WITH CHECK (true); -- Allow creation, trigger handles membership

-- Organization Members
CREATE POLICY "Users can view members of their organizations" ON organization_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = organization_members.organization_id
            AND om.user_id = auth.uid()
        )
    );

-- Projects (Update existing policies)
DROP POLICY IF EXISTS "Users can view their own projects" ON keys_projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON keys_projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON keys_projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON keys_projects;

CREATE POLICY "Users can view projects in their organizations" ON keys_projects
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_members.organization_id = keys_projects.organization_id
            AND organization_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert projects in their organizations" ON keys_projects
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_members.organization_id = keys_projects.organization_id
            AND organization_members.user_id = auth.uid()
            AND organization_members.role IN ('OWNER', 'ADMIN')
        )
    );

CREATE POLICY "Users can update projects in their organizations" ON keys_projects
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_members.organization_id = keys_projects.organization_id
            AND organization_members.user_id = auth.uid()
            AND organization_members.role IN ('OWNER', 'ADMIN')
        )
    );

CREATE POLICY "Users can delete projects in their organizations" ON keys_projects
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_members.organization_id = keys_projects.organization_id
            AND organization_members.user_id = auth.uid()
            AND organization_members.role = 'OWNER'
        )
    );

-- Credentials (Update existing policies)
DROP POLICY IF EXISTS "Users can view their own credentials" ON keys_credentials;
DROP POLICY IF EXISTS "Users can insert their own credentials" ON keys_credentials;
DROP POLICY IF EXISTS "Users can update their own credentials" ON keys_credentials;
DROP POLICY IF EXISTS "Users can delete their own credentials" ON keys_credentials;

CREATE POLICY "Users can view credentials in their organizations" ON keys_credentials
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_members.organization_id = keys_credentials.organization_id
            AND organization_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert credentials in their organizations" ON keys_credentials
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_members.organization_id = keys_credentials.organization_id
            AND organization_members.user_id = auth.uid()
            AND organization_members.role IN ('OWNER', 'ADMIN')
        )
    );

CREATE POLICY "Users can update credentials in their organizations" ON keys_credentials
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_members.organization_id = keys_credentials.organization_id
            AND organization_members.user_id = auth.uid()
            AND organization_members.role IN ('OWNER', 'ADMIN')
        )
    );

CREATE POLICY "Users can delete credentials in their organizations" ON keys_credentials
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_members.organization_id = keys_credentials.organization_id
            AND organization_members.user_id = auth.uid()
            AND organization_members.role IN ('OWNER', 'ADMIN')
        )
    );

-- 7. Trigger to auto-add creator as OWNER
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (NEW.id, auth.uid(), 'OWNER');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_organization_created ON organizations;
CREATE TRIGGER on_organization_created
    AFTER INSERT ON organizations
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_organization();
