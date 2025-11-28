cd /ruta/a/KeysStore

# 1. Borrar el lock viejo
rm package-lock.json

# 2. Instalar según tu package.json (esto genera un lock nuevo)
npm install

# 3. Verifica que todo anda
npm run build   # o npm run dev, lo que uses normalmente

# 4. Sube los cambios a Git
git add package.json package-lock.json
git commit -m "Sync deps (vite, rollup, esbuild) and regenerate lockfile"
git push
