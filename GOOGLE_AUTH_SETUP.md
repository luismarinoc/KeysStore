# Configuración de Google OAuth en Supabase

Sigue estos pasos para configurar Google Authentication en tu instancia de Supabase.

## Paso 1: Configurar Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a **APIs & Services** > **Credentials**
4. Haz clic en **Create Credentials** > **OAuth client ID**
5. Selecciona **Web application**
6. Configura:
   - **Name**: KeyStore App
   - **Authorized JavaScript origins**:
     - `https://spb.tbema.net`
     - `http://localhost:8081` (para desarrollo)
   - **Authorized redirect URIs**:
     - `https://spb.tbema.net/auth/v1/callback`
     - `http://localhost:8081` (para desarrollo)
7. Guarda el **Client ID** y **Client Secret**

## Paso 2: Configurar Supabase

1. Ve a tu panel de Supabase: `https://spb.tbema.net`
2. Ve a **Authentication** > **Providers**
3. Busca **Google** en la lista
4. Activa el toggle de Google
5. Ingresa:
   - **Client ID**: (del paso 1)
   - **Client Secret**: (del paso 1)
6. Guarda los cambios

## Paso 3: Ejecutar el SQL actualizado

1. Ve a **SQL Editor** en Supabase
2. Copia y pega el contenido completo de `supabase/schema.sql`
3. Ejecuta el script
4. Verifica que las tablas tengan el campo `user_id` y las políticas RLS estén activas

## Paso 4: Probar la aplicación

1. Refresca la aplicación (F5)
2. Deberías ver la pantalla de login
3. Haz clic en "Sign in with Google"
4. Autoriza la aplicación
5. Deberías ser redirigido a la app autenticado

## Verificación

- ✅ Las tablas `keys_projects` y `keys_credentials` tienen el campo `user_id`
- ✅ RLS está habilitado en ambas tablas
- ✅ Las políticas RLS filtran por `auth.uid()`
- ✅ Puedes hacer login con Google
- ✅ Los nuevos registros tienen `user_id` y `pc_name` (email)
- ✅ Solo ves tus propios proyectos y credenciales

## Solución de problemas

### Error: "Invalid redirect URI"
- Verifica que las URIs en Google Cloud Console coincidan exactamente con las de Supabase

### Error: "User not authenticated"
- Asegúrate de estar logueado antes de crear proyectos/credenciales
- Revisa la consola del navegador para más detalles

### No veo mis datos antiguos
- Los datos creados antes de la autenticación no tienen `user_id`
- Puedes migrarlos manualmente o empezar de cero

## Migración de datos existentes (Opcional)

Si tienes datos existentes sin `user_id`, puedes asignarlos a tu usuario:

```sql
-- Reemplaza 'TU_USER_ID' con tu ID de usuario de auth.users
UPDATE keys_projects SET user_id = 'TU_USER_ID' WHERE user_id IS NULL;
UPDATE keys_credentials SET user_id = 'TU_USER_ID' WHERE user_id IS NULL;
```

Para obtener tu user_id, ejecuta:
```sql
SELECT id, email FROM auth.users;
```
