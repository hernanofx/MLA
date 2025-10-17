# 🏢 Sistema Multi-Tenant VMS - Documentación Completa

## 📅 Fecha: 17 de octubre de 2025

---

## 🎯 Objetivo

Implementar un sistema multi-tenant donde **cada proveedor** tiene:
- ✅ Sus propios usuarios VMS
- ✅ Acceso SOLO a sus propios envíos
- ✅ Dashboard personalizado con su información
- ✅ Aislamiento completo de datos de otros proveedores
- ✅ Administradores pueden ver todos los proveedores

---

## 🏗️ Arquitectura

### **Modelo de Datos**

```prisma
model User {
  id          String    @id @default(cuid())
  email       String    @unique
  password    String
  name        String?
  role        String    @default("user")
  providerId  String?
  vmsProvider Provider? @relation("VMSUsers", fields: [providerId], references: [id])
  // ... otros campos
}

model Provider {
  id       String    @id @default(cuid())
  name     String    @unique
  vmsUsers User[]    @relation("VMSUsers")
  shipments Shipment[]
  // ... otros campos
}

model Shipment {
  id         String   @id @default(cuid())
  providerId String
  provider   Provider @relation(fields: [providerId], references: [id])
  // ... otros campos
}
```

### **Flujo de Autenticación**

```
1. Usuario se loguea → NextAuth crea session
2. Session incluye: { user: { id, email, role, providerId } }
3. API verifica:
   - Si role = 'admin' → providerId = null (ve todo)
   - Si role = 'vms' → providerId = su ID asignado
4. Queries filtran automáticamente por providerId
```

---

## 🔧 Componentes Implementados

### **1. Middleware de Autenticación (`lib/vms-auth.ts`)**

```typescript
export async function getVMSProviderId(session: Session | null): Promise<string | null> {
  // Verifica permisos y retorna providerId
  // Admin → null (ve todo)
  // VMS → su providerId
  // Otros → Error
}

export function verifyProviderAccess(
  shipmentProviderId: string,
  userProviderId: string | null
): void {
  // Verifica que el usuario tenga acceso al shipment
  // Admin siempre puede acceder
  // VMS solo si es su proveedor
}
```

**Uso:**
```typescript
const providerId = await getVMSProviderId(session)
verifyProviderAccess(shipment.providerId, providerId)
```

---

### **2. APIs Actualizadas**

Todas las APIs VMS ahora filtran por proveedor:

#### **GET /api/vms/shipments**
```typescript
// Obtiene solo shipments del proveedor del usuario
const providerId = await getVMSProviderId(session)
const where = providerId ? { providerId } : {} // Admin ve todo

const shipments = await prisma.shipment.findMany({ where })
```

#### **POST /api/vms/pre-alerta/upload**
```typescript
// Crea shipment vinculado al proveedor
const providerId = await getVMSProviderId(session)

const shipment = await prisma.shipment.create({
  data: {
    providerId: providerId,
    createdById: session.user.id,
    status: 'PRE_ALERTA'
  }
})
```

#### **POST /api/vms/pre-ruteo/upload**
```typescript
// Verifica que el shipment pertenezca al proveedor
const providerId = await getVMSProviderId(session)
verifyProviderAccess(shipment.providerId, providerId)
```

#### **POST /api/vms/verification/scan**
```typescript
// Verifica acceso antes de escanear
const providerId = await getVMSProviderId(session)
const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId } })
verifyProviderAccess(shipment.providerId, providerId)
```

#### **GET /api/vms/shipments/[id]/report**
```typescript
// Verifica acceso antes de mostrar reporte
const providerId = await getVMSProviderId(session)
verifyProviderAccess(shipment.providerId, providerId)
```

#### **GET /api/vms/reports/export**
```typescript
// Verifica acceso antes de exportar Excel
const providerId = await getVMSProviderId(session)
verifyProviderAccess(shipment.providerId, providerId)
```

---

### **3. Dashboard Personalizado**

```tsx
// VMSDashboard.tsx
const [providerInfo, setProviderInfo] = useState<ProviderInfo | null>(null)

// Muestra nombre del proveedor en el header
{providerInfo && (
  <p className="mt-1 text-sm text-gray-500">
    Proveedor: <span className="font-medium">{providerInfo.name}</span>
  </p>
)}

// Indicador para admin
{session?.user?.role === 'admin' && (
  <p className="mt-1 text-xs text-indigo-600 font-medium">
    Vista de administrador - Todos los proveedores
  </p>
)}
```

---

## 🛠️ Crear Usuarios VMS por Proveedor

### **Script: `scripts/create-vms-user.ts`**

```bash
# Sintaxis
DATABASE_URL="postgresql://..." \
npx tsx scripts/create-vms-user.ts \
  <email> \
  <password> \
  <nombre> \
  <nombre-proveedor>

# Ejemplo: Crear usuario para "Proveedor ABC"
DATABASE_URL="postgresql://..." \
npx tsx scripts/create-vms-user.ts \
  abc@proveedor.com \
  password123 \
  "Usuario ABC" \
  "Proveedor ABC"

# Ejemplo: Crear usuario para "Proveedor XYZ"
DATABASE_URL="postgresql://..." \
npx tsx scripts/create-vms-user.ts \
  xyz@proveedor.com \
  password456 \
  "Usuario XYZ" \
  "Proveedor XYZ"
```

**El script:**
1. ✅ Busca o crea el proveedor por nombre
2. ✅ Crea el usuario con rol 'vms'
3. ✅ Vincula el usuario al proveedor (providerId)
4. ✅ Hashea la contraseña

---

## 📊 Flujo de Trabajo Completo

### **Escenario: 2 Proveedores Separados**

#### **Proveedor ABC**
```bash
# 1. Crear usuario ABC
npx tsx scripts/create-vms-user.ts \
  abc@proveedor.com password123 "Usuario ABC" "Proveedor ABC"

# 2. Login como abc@proveedor.com

# 3. Subir Pre-Alerta (se vincula automáticamente a Proveedor ABC)

# 4. Subir Pre-Ruteo (solo ve shipments de Proveedor ABC)

# 5. Escanear paquetes (solo del Shipment de Proveedor ABC)

# 6. Ver Dashboard (solo stats de Proveedor ABC)
```

#### **Proveedor XYZ**
```bash
# 1. Crear usuario XYZ
npx tsx scripts/create-vms-user.ts \
  xyz@proveedor.com password456 "Usuario XYZ" "Proveedor XYZ"

# 2. Login como xyz@proveedor.com

# 3. Subir Pre-Alerta (se vincula automáticamente a Proveedor XYZ)

# 4. NO VE los datos de Proveedor ABC ✅

# 5. Solo ve sus propios shipments, reportes y estadísticas
```

#### **Administrador**
```bash
# 1. Login como admin

# 2. Ve TODOS los proveedores en el dashboard

# 3. Puede acceder a cualquier shipment

# 4. Puede generar reportes de cualquier proveedor
```

---

## 🔒 Seguridad y Aislamiento

### **Nivel de Base de Datos**
```sql
-- Todas las queries incluyen filtro por providerId
SELECT * FROM "Shipment" WHERE "providerId" = 'provider-abc-id';

-- Admin puede omitir el filtro
SELECT * FROM "Shipment"; -- Sin WHERE = todos los proveedores
```

### **Nivel de API**
```typescript
// Middleware verifica permisos ANTES de ejecutar query
const providerId = await getVMSProviderId(session) // Lanza error si no tiene permisos

// Verifica acceso ANTES de retornar datos
verifyProviderAccess(shipment.providerId, providerId) // Lanza error si no coincide
```

### **Nivel de Frontend**
```tsx
// Dashboard solo muestra datos del proveedor actual
// No hay forma de acceder a otros proveedores desde la UI
```

---

## ✅ Pruebas de Aislamiento

### **Test 1: Crear 2 Proveedores**
```bash
# Proveedor A
npx tsx scripts/create-vms-user.ts a@test.com pass1 "User A" "Provider A"

# Proveedor B
npx tsx scripts/create-vms-user.ts b@test.com pass2 "User B" "Provider B"
```

### **Test 2: Subir Datos como Proveedor A**
```bash
1. Login: a@test.com / pass1
2. Ir a /vms/shipments/new
3. Subir Pre-Alerta con 5 paquetes
4. Verificar que aparece en dashboard
```

### **Test 3: Verificar Aislamiento**
```bash
1. Logout de Proveedor A
2. Login: b@test.com / pass2
3. Ir a /vms
4. ✅ DEBE mostrar dashboard vacío (0 shipments)
5. ✅ NO debe ver los datos de Proveedor A
```

### **Test 4: Intento de Acceso No Autorizado**
```bash
1. Login como Proveedor B
2. Copiar URL del shipment de Proveedor A (ejemplo: /vms/shipments/abc-123)
3. Intentar acceder directamente
4. ✅ DEBE recibir error 403 "No tienes acceso a este envío"
```

### **Test 5: Vista de Admin**
```bash
1. Login como admin
2. Ir a /vms
3. ✅ DEBE ver todos los shipments de ambos proveedores
4. ✅ Puede acceder a cualquier reporte
5. ✅ Muestra indicador "Vista de administrador"
```

---

## 🎯 Roles y Permisos

| Rol | providerId | Acceso |
|-----|-----------|--------|
| `admin` | null | Ve todos los proveedores |
| `vms` | assigned | Solo su proveedor |
| `user` | null | Sin acceso a VMS |

---

## 📝 Checklist de Implementación

### ✅ Backend
- [x] Schema Prisma actualizado con relación User-Provider
- [x] Middleware `getVMSProviderId()` y `verifyProviderAccess()`
- [x] API shipments con filtro por proveedor
- [x] API pre-alerta con validación de proveedor
- [x] API pre-ruteo con validación de proveedor
- [x] API verification/scan con validación
- [x] API verification/finalize con validación
- [x] API reports con validación
- [x] API export con validación

### ✅ Frontend
- [x] Dashboard muestra nombre del proveedor
- [x] Indicador para admin
- [x] Sin acceso a proveedores externos

### ✅ Scripts
- [x] create-vms-user.ts vincula usuario a proveedor

### ⏳ Pendiente
- [ ] Migración de base de datos (ejecutar cuando Railway esté disponible)
- [ ] Testing con 2 proveedores reales
- [ ] Validación de aislamiento completo

---

## 🚀 Deployment

### **1. Aplicar Migración**
```bash
npx prisma db push
```

### **2. Generar Cliente Prisma**
```bash
npx prisma generate
```

### **3. Crear Proveedores**
```bash
# Crear varios proveedores
DATABASE_URL="..." npx tsx scripts/create-vms-user.ts \
  proveedor1@empresa.com password "User 1" "Proveedor 1"

DATABASE_URL="..." npx tsx scripts/create-vms-user.ts \
  proveedor2@empresa.com password "User 2" "Proveedor 2"
```

### **4. Verificar Funcionamiento**
```bash
npm run dev

# Login con cada usuario y verificar aislamiento
```

---

## 🆘 Troubleshooting

### **Error: "No hay proveedor asignado"**
**Causa:** Usuario VMS sin providerId
**Solución:**
```bash
# Actualizar usuario manualmente
UPDATE "User" SET "providerId" = '<provider-id>' WHERE email = 'usuario@email.com';
```

### **Error: "No tienes acceso a este envío"**
**Causa:** Intentando acceder a shipment de otro proveedor
**Solución:** Normal, el sistema está funcionando correctamente

### **Admin no ve todos los proveedores**
**Causa:** providerId no es null
**Solución:**
```bash
# Asegurar que admin tenga providerId = null
UPDATE "User" SET "providerId" = NULL WHERE role = 'admin';
```

---

## 📊 Estadísticas por Proveedor

Cada proveedor solo ve:
- ✅ Sus propios shipments
- ✅ Sus propias estadísticas (OK, Sobrante, Fuera Cobertura, Previo)
- ✅ Sus propios reportes Excel
- ✅ Su historial de escaneos

Admin ve:
- ✅ Todos los shipments de todos los proveedores
- ✅ Estadísticas globales
- ✅ Puede generar reportes de cualquier proveedor

---

**Implementado por:** GitHub Copilot
**Fecha:** 17 de octubre de 2025
**Estado:** ✅ COMPLETO (Pendiente migración BD)
**Archivos Modificados:** 11 archivos
**Nuevo Archivo:** `lib/vms-auth.ts`
