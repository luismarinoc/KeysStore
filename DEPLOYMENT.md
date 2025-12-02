# Guía de Deployment para VM

Esta guía explica cómo desplegar KeysStore en una máquina virtual (Ubuntu/Debian).

## 📋 Pre-requisitos en la VM

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalación
node --version  # debe ser v18+
npm --version   # debe ser v9+

# Instalar Git
sudo apt install -y git
```

## 🚀 Pasos de Deployment

### 1. Clonar el Repositorio

```bash
cd ~
git clone https://github.com/luismarinoc/KeysStore.git
cd KeysStore
```

### 2. Instalar Dependencias

```bash
# Instalar todas las dependencias del monorepo
npm install
```

### 3. Configurar Variables de Entorno

Crea el archivo de configuración para la app web:

```bash
cd apps/web
cp .env.example .env  # si existe
nano .env
```

Agrega tus credenciales de Supabase:

```env
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

### 4. Build de los Paquetes Compartidos

```bash
# Volver a la raíz del proyecto
cd ~/KeysStore

# Build de shared-types
npm run build -w packages/shared-types

# Build del SDK
npm run build -w packages/sdk-client
```

### 5. Build de la Aplicación Web

```bash
# Build de producción
npm run build -w apps/web
```

Los archivos compilados estarán en `apps/web/dist/`

### 6. Servir la Aplicación

#### Opción A: Con serve (Simple)

```bash
# Instalar serve globalmente
sudo npm install -g serve

# Servir la app en puerto 3000
cd ~/KeysStore/apps/web
serve -s dist -l 3000
```

#### Opción B: Con nginx (Producción)

```bash
# Instalar nginx
sudo apt install -y nginx

# Copiar archivos al directorio web
sudo cp -r ~/KeysStore/apps/web/dist/* /var/www/html/

# Configurar nginx
sudo nano /etc/nginx/sites-available/default
```

Configuración nginx:

```nginx
server {
    listen 80;
    server_name tu_dominio_o_ip;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
# Reiniciar nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

#### Opción C: Con PM2 (Proceso persistente)

```bash
# Instalar PM2
sudo npm install -g pm2

# Crear script de inicio
cd ~/KeysStore/apps/web
echo "serve -s dist -l 3000" > start.sh
chmod +x start.sh

# Iniciar con PM2
pm2 start start.sh --name keysstore-web

# Guardar configuración
pm2 save
pm2 startup
```

### 7. Configurar Firewall

```bash
# Permitir tráfico HTTP
sudo ufw allow 80/tcp
sudo ufw allow 3000/tcp  # si usas serve directamente
sudo ufw enable
```

## 🔄 Actualizar la Aplicación

Cuando hagas cambios y quieras actualizar la VM:

```bash
cd ~/KeysStore

# Obtener últimos cambios
git pull origin main

# Reinstalar dependencias (si hay cambios)
npm install

# Rebuild de los paquetes
npm run build -w packages/shared-types
npm run build -w packages/sdk-client
npm run build -w apps/web

# Actualizar archivos servidos
# Si usas nginx:
sudo cp -r ~/KeysStore/apps/web/dist/* /var/www/html/

# Si usas PM2:
pm2 restart keysstore-web
```

## 🧪 Verificación

Accede a tu aplicación:

- **Con nginx**: `http://tu_ip_o_dominio`
- **Con serve/PM2**: `http://tu_ip_o_dominio:3000`

## 💡 Tips

- Usa HTTPS en producción con Let's Encrypt
- Configura un dominio en lugar de usar IP
- Monitorea logs con `pm2 logs` o `sudo tail -f /var/log/nginx/error.log`
