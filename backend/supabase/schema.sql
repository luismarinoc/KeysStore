-- =========================================
-- Extensión para UUID (si aún no existe)
-- =========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================
-- ENUMs: crear solo si no existen
-- =========================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'tab_category'
    ) THEN
        CREATE TYPE tab_category AS ENUM ('APP', 'WIFI', 'VPN', 'NOTE');
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'environment'
    ) THEN
        CREATE TYPE environment AS ENUM ('DEV', 'QAS', 'PRD', 'NONE');
    END IF;
END
$$;

-- =========================================
-- Tabla de proyectos
-- =========================================
CREATE TABLE IF NOT EXISTS keys_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    logo_url TEXT,
    api_key TEXT,
    pc_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- Tabla de credenciales
-- =========================================
CREATE TABLE IF NOT EXISTS keys_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES keys_projects(id) ON DELETE CASCADE,
    tab_category tab_category NOT NULL,
    environment environment DEFAULT 'NONE',
    title TEXT NOT NULL,
    username TEXT,
    password_encrypted TEXT,
    host_address TEXT,
    saprouter_string TEXT,
    ssid TEXT,
    psk_encrypted TEXT,
    note_content TEXT,
    instance_number TEXT,
    mandt TEXT,
    api_key TEXT,
    pc_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- Índices
-- =========================================
CREATE INDEX IF NOT EXISTS idx_projects_user_id
    ON keys_projects(user_id);

CREATE INDEX IF NOT EXISTS idx_credentials_user_id
    ON keys_credentials(user_id);

CREATE INDEX IF NOT EXISTS idx_credentials_project_id
    ON keys_credentials(project_id);

CREATE INDEX IF NOT EXISTS idx_credentials_category
    ON keys_credentials(tab_category, environment);

-- =========================================
-- Row Level Security (RLS)
-- =========================================

-- Enable RLS
ALTER TABLE keys_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE keys_credentials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own projects" ON keys_projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON keys_projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON keys_projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON keys_projects;

DROP POLICY IF EXISTS "Users can view their own credentials" ON keys_credentials;
DROP POLICY IF EXISTS "Users can insert their own credentials" ON keys_credentials;
DROP POLICY IF EXISTS "Users can update their own credentials" ON keys_credentials;
DROP POLICY IF EXISTS "Users can delete their own credentials" ON keys_credentials;

-- Projects policies
CREATE POLICY "Users can view their own projects"
    ON keys_projects FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
    ON keys_projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
    ON keys_projects FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
    ON keys_projects FOR DELETE
    USING (auth.uid() = user_id);

-- Credentials policies
CREATE POLICY "Users can view their own credentials"
    ON keys_credentials FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credentials"
    ON keys_credentials FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credentials"
    ON keys_credentials FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own credentials"
    ON keys_credentials FOR DELETE
    USING (auth.uid() = user_id);