# Pasos para Aplicar Migración en Railway

## Problema
El endpoint `/api/packages` devuelve 500 porque las tablas `Package` y `PackageMovement` no existen en la base de datos de producción.

## Solución: Aplicar Migración en Railway

### Opción 1: Desde el Dashboard de Railway (Recomendado)

1. **Ir a Railway Dashboard**
   - https://railway.app/dashboard

2. **Seleccionar tu proyecto**
   - Encuentra el proyecto `truck-managment`

3. **Abrir la consola del servicio**
   - Click en tu servicio web
   - Ve a la pestaña "Settings" o "Deploy"
   - Busca "Shell" o "Console"

4. **Ejecutar la migración**
   ```bash
   npx prisma db push
   ```
   
   **O si prefieres crear una migración formal:**
   ```bash
   npx prisma migrate deploy
   ```

### Opción 2: Desde tu terminal local conectándote a Railway DB

1. **Obtener la URL de conexión de Railway**
   - En Railway, ve a tu base de datos PostgreSQL
   - Copia la `DATABASE_URL`

2. **Ejecutar desde local**
   ```bash
   # Temporal: usar la URL de Railway
   DATABASE_URL="postgresql://postgres:BQxpaoOzILduENMFtkaBkTjayApTHckf@crossover.proxy.rlwy.net:43716/railway" npx prisma db push
   ```

### Opción 3: Agregar comando de migración al build

1. **Editar `package.json`**
   Agrega un script de postinstall:
   ```json
   {
     "scripts": {
       "build": "prisma generate && next build",
       "postinstall": "prisma generate"
     }
   }
   ```

2. **Crear archivo de configuración para Railway**
   Archivo: `railway.toml`
   ```toml
   [build]
   builder = "nixpacks"
   buildCommand = "npm install && npx prisma generate && npx prisma db push --accept-data-loss && npm run build"

   [deploy]
   startCommand = "npm start"
   ```

## Verificar que funcionó

1. **Accede a:**
   ```
   https://tmsma.up.railway.app/api/debug/db-status
   ```

2. **Deberías ver:**
   ```json
   {
     "status": "ok",
     "tables": [..., "Package", "PackageMovement", ...]
   }
   ```

3. **Prueba el endpoint de paquetes:**
   ```
   https://tmsma.up.railway.app/api/packages?page=1&limit=25
   ```

## Notas Importantes

- ⚠️ `prisma db push` puede perder datos si hay conflictos
- ✅ Para producción es mejor usar `prisma migrate deploy`
- 📝 Si usas migrat deploy, primero necesitas crear la migración con `prisma migrate dev` localmente y hacer commit

## Siguiente Deploy

Para evitar este problema en el futuro, asegúrate de que Railway ejecute las migraciones automáticamente en cada deploy agregando al build command:

```
npx prisma migrate deploy && npm run build
```
