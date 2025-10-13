# Cross Dock Management Network

Sistema de control de entrada y salida de camiones en depósito.

## Tecnologías

- **Frontend**: Next.js 15 con TypeScript y Tailwind CSS
- **Backend**: Next.js API Routes
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Autenticación**: NextAuth.js
- **Gráficos**: Chart.js

## Características

- ✅ Autenticación de usuarios
- ✅ Gestión de proveedores (CRUD)
- ✅ Gestión de camiones (CRUD)
- ✅ Registro de entradas/salidas con timestamps automáticos
- ✅ Cálculo automático de semana, mes y duración
- ✅ Dashboard con estadísticas
- ✅ Reportes con gráficos (barras y pie)
- ✅ Interfaz responsive con Tailwind CSS

## Instalación

1. Clona el repositorio
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Configura la base de datos en `.env`:
   ```
   DATABASE_URL="postgresql://..."
   NEXTAUTH_SECRET="tu-secreto"
   NEXTAUTH_URL="http://localhost:3000"
   ```
4. Ejecuta las migraciones de Prisma:
   ```bash
   npx prisma migrate dev
   ```
5. Crea un usuario administrador:
   ```bash
   npx tsx scripts/seed.ts
   ```
6. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## Credenciales de Acceso

**Usuario Administrador por Defecto:**
- **Email:** admin@example.com
- **Contraseña:** admin123

## Uso

1. Accede a http://localhost:3000
2. Inicia sesión (necesitas crear un usuario primero)
3. Gestiona proveedores y camiones
4. Registra entradas/salidas
5. Visualiza reportes y estadísticas

## Estructura del Proyecto

- `app/` - Páginas y API routes de Next.js
- `lib/` - Utilidades y configuración
- `prisma/` - Esquema de base de datos
- `components/` - Componentes reutilizables (si los hay)

## Base de Datos

El esquema incluye:
- Users: Autenticación
- Providers: Catálogo de proveedores
- Trucks: Camiones con patentes
- Entries: Registros de entrada/salida con cálculos automáticos
