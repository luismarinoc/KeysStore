-- =========================================
-- SOLUCIÓN: Deshabilitar RLS o crear políticas
-- =========================================

-- OPCIÓN 1: Deshabilitar RLS completamente (más simple, para desarrollo/uso personal)
-- Ejecuta esto si NO necesitas control de acceso por usuario

ALTER TABLE keys_projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE keys_credentials DISABLE ROW LEVEL SECURITY;

-- =========================================
-- OPCIÓN 2: Mantener RLS pero crear políticas permisivas
-- =========================================
-- Ejecuta esto si quieres mantener RLS pero permitir acceso completo al rol anon

-- Primero, asegúrate de que RLS esté habilitado
-- ALTER TABLE keys_projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE keys_credentials ENABLE ROW LEVEL SECURITY;

-- Luego, crea políticas que permitan todo al rol anon

-- Políticas para keys_projects
-- CREATE POLICY "Enable all access for anon users on keys_projects"
--   ON keys_projects
--   FOR ALL
--   TO anon
--   USING (true)
--   WITH CHECK (true);

-- Políticas para keys_credentials
-- CREATE POLICY "Enable all access for anon users on keys_credentials"
--   ON keys_credentials
--   FOR ALL
--   TO anon
--   USING (true)
--   WITH CHECK (true);

-- =========================================
-- NOTA IMPORTANTE
-- =========================================
-- Para producción, deberías:
-- 1. Implementar autenticación de usuarios (Supabase Auth)
-- 2. Crear políticas RLS que filtren por auth.uid()
-- 3. Ejemplo:
--    CREATE POLICY "Users can only see their own projects"
--      ON keys_projects
--      FOR SELECT
--      USING (auth.uid() = user_id);
