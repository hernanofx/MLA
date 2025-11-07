# 🔍 Buscador de Tracking Number - VMS

## 📋 Descripción

Implementación de un buscador de tracking number en el módulo VMS que permite buscar cualquier paquete clasificado y obtener información completa sobre:
- **Lote** al que pertenece
- **Fecha** del lote
- **Transporte** asignado (vehículo)
- **Orden** de visita en la ruta

---

## ✨ Características Implementadas

### 1. **API Endpoint** ✅
**Ruta:** `GET /api/vms/search-tracking?tracking=MLAR123456`

#### Funcionalidades:
- ✅ Búsqueda por tracking number (case-insensitive)
- ✅ Soporte multi-tenant (respeta permisos por proveedor)
- ✅ Administradores pueden buscar en todos los proveedores
- ✅ Retorna información completa del paquete

#### Respuesta exitosa:
```json
{
  "found": true,
  "trackingNumber": "MLAR123456",
  "lote": {
    "id": "clxxx...",
    "fecha": "2025-11-07T00:00:00.000Z",
    "fechaFormateada": "07/11/2025"
  },
  "transporte": {
    "vehiculo": "VH-001",
    "orden": 3,
    "ordenVisita": "2"
  },
  "proveedor": "Nombre del Proveedor",
  "clasificacion": {
    "id": "clyyy...",
    "uploadedAt": "2025-11-07T10:30:00.000Z",
    "finalizado": true
  },
  "escaneo": {
    "escaneado": true,
    "escaneadoAt": "2025-11-07T11:15:00.000Z",
    "escaneadoPor": "user-id"
  }
}
```

#### Respuesta cuando no se encuentra:
```json
{
  "found": false,
  "message": "Tracking number no encontrado en clasificaciones"
}
```

---

### 2. **Widget de Búsqueda** ✅
**Componente:** `TrackingSearchWidget.tsx`

#### Características UI:
- 🎨 Diseño limpio y profesional integrado con el dashboard
- 🔍 Campo de búsqueda con botón
- ⚡ Búsqueda al presionar Enter
- 📊 Visualización de resultados en tarjetas informativas
- ✅ Indicadores visuales de estado (escaneado/pendiente)
- 🔗 Link directo al detalle del lote
- 💡 Manejo de errores y estados de carga

#### Información Mostrada:
1. **Tracking Number** - Con ícono de paquete
2. **Lote** - Fecha formateada y ID
3. **Transporte** - Vehículo asignado y orden de visita
4. **Proveedor** - Nombre del proveedor
5. **Estado de Escaneo** - Si fue escaneado y cuándo
6. **Clasificación** - Estado (finalizada/en progreso) y fecha de carga

---

### 3. **Integración en Dashboard VMS** ✅

El buscador se integró en el dashboard principal de VMS (`/vms`), ubicado entre las estadísticas y la lista de lotes recientes.

#### Ubicación:
```
Dashboard VMS
├── Header con estadísticas
├── Tarjetas de métricas (4 cards)
├── 🆕 Buscador de Tracking Number
└── Lista de lotes recientes
```

---

## 🎯 Casos de Uso

### Caso 1: Operario VMS busca un paquete
```
Usuario: operario@vms.com
Acción: Busca "MLAR123456"
Resultado: Ve solo paquetes de su proveedor
```

### Caso 2: Administrador busca cualquier paquete
```
Usuario: admin@sistema.com
Acción: Busca "MLAR789012"
Resultado: Ve paquetes de todos los proveedores
```

### Caso 3: Tracking no encontrado
```
Usuario: cualquiera
Acción: Busca "NOEXISTE123"
Resultado: Mensaje "Tracking number no encontrado en clasificaciones"
```

---

## 🔒 Seguridad

### Multi-tenant
- ✅ Usuarios VMS solo ven paquetes de su proveedor
- ✅ Administradores ven todos los paquetes
- ✅ Validación de acceso en el servidor
- ✅ Protección contra acceso no autorizado

### Validaciones
- ✅ Sesión de usuario requerida
- ✅ Tracking number requerido
- ✅ Trimming y uppercase automático
- ✅ Manejo de errores completo

---

## 📊 Base de Datos

### Tablas Consultadas:
1. **PaqueteClasificacion** - Datos del paquete clasificado
2. **ClasificacionArchivo** - Información de la clasificación
3. **Shipment** - Datos del lote
4. **Provider** - Nombre del proveedor

### Índices Utilizados:
- `trackingNumber` en `PaqueteClasificacion`
- `providerId` en `ClasificacionArchivo`
- Búsqueda optimizada con `findFirst` y `orderBy`

---

## 🚀 Uso del Buscador

### Para Usuarios:

1. **Acceder al Dashboard VMS**
   ```
   Navegar a: https://tmsma.up.railway.app/vms
   ```

2. **Buscar un Tracking**
   - Escribir el tracking number en el campo
   - Presionar Enter o click en "Buscar"

3. **Ver Resultados**
   - Si se encuentra: Ver todos los detalles
   - Si no se encuentra: Mensaje informativo
   - Click en "Ver Detalle del Lote" para más info

### Información Obtenida:
- ✅ ¿En qué **lote** está el paquete?
- ✅ ¿Qué **día** fue procesado?
- ✅ ¿Qué **transporte** lo llevará?
- ✅ ¿En qué **orden** saldrá en la ruta?
- ✅ ¿Fue **escaneado** en clasificación?
- ✅ ¿Cuándo y quién lo escaneó?

---

## 📁 Archivos Creados/Modificados

### Nuevos Archivos:
```
app/
├── api/vms/search-tracking/
│   └── route.ts                    # API endpoint de búsqueda
└── vms/
    └── TrackingSearchWidget.tsx    # Componente de búsqueda
```

### Archivos Modificados:
```
app/vms/
└── VMSDashboard.tsx                # Integración del widget
```

---

## 🎨 Diseño Visual

### Paleta de Colores:
- **Primario:** Indigo (#4F46E5) - Botones y acciones
- **Éxito:** Verde (#10B981) - Estados positivos
- **Alerta:** Naranja (#F59E0B) - Estados pendientes
- **Error:** Rojo (#EF4444) - Errores
- **Neutro:** Gris (#6B7280) - Texto y bordes

### Componentes UI:
- 📦 Tarjetas con bordes y sombras sutiles
- 🎯 Iconos de Lucide React
- 📱 Diseño responsive (grid adaptativo)
- ⚡ Animaciones de carga
- ✨ Transiciones suaves

---

## 🧪 Testing

### Escenarios de Prueba:
1. ✅ Buscar tracking existente
2. ✅ Buscar tracking no existente
3. ✅ Buscar con espacios extra
4. ✅ Buscar con minúsculas (se convierte a mayúsculas)
5. ✅ Buscar sin tracking (validación)
6. ✅ Multi-tenant (usuario VMS vs admin)
7. ✅ Tracking escaneado vs no escaneado
8. ✅ Clasificación finalizada vs en progreso

---

## 🔄 Flujo de Datos

```
Usuario escribe tracking
       ↓
TrackingSearchWidget (Frontend)
       ↓
GET /api/vms/search-tracking?tracking=XXX
       ↓
Validación de sesión y permisos
       ↓
Búsqueda en PaqueteClasificacion
       ↓
Join con Clasificacion → Shipment → Provider
       ↓
Formateo de respuesta
       ↓
Widget muestra resultados
```

---

## ✅ Beneficios

### Para Operarios:
- 🔍 Localización rápida de paquetes
- 📊 Información completa en un solo lugar
- ⏱️ Ahorro de tiempo en búsquedas
- 📱 Interfaz intuitiva y fácil de usar

### Para Administradores:
- 👁️ Visibilidad de todos los proveedores
- 📈 Auditoría de paquetes
- 🔍 Seguimiento detallado
- 📊 Información de escaneo y clasificación

### Para el Sistema:
- 🔒 Seguridad multi-tenant garantizada
- ⚡ Consultas optimizadas
- 📦 Reutilización de componentes
- 🎨 UI consistente con el resto del sistema

---

## 🎯 Próximas Mejoras Sugeridas

1. **Búsqueda por Lote**
   - Buscar todos los trackings de un lote específico

2. **Historial de Búsquedas**
   - Guardar últimas búsquedas del usuario

3. **Búsqueda Múltiple**
   - Buscar varios tracking numbers a la vez

4. **Exportar Resultados**
   - Descargar información de la búsqueda

5. **Búsqueda Avanzada**
   - Filtros por fecha, vehículo, estado, etc.

6. **Estadísticas de Búsqueda**
   - Dashboard de trackings más buscados

---

## 📚 Documentación Relacionada

- [Implementación de Clasificación VMS](./IMPLEMENTACION_CLASIFICACION_VMS.md)
- [Sistema Multi-Tenant VMS](./SISTEMA_MULTI_TENANT_VMS.md)
- [README VMS](./vendors/README_VMS.md)

---

## 💡 Notas Técnicas

### Performance:
- Búsqueda optimizada con índices en tracking number
- `findFirst` con `orderBy` para obtener el más reciente
- Carga lazy de relaciones (include solo lo necesario)

### Escalabilidad:
- Diseño preparado para millones de registros
- Paginación no necesaria (1 resultado por tracking)
- Caché potencial en el futuro

### Mantenibilidad:
- Código modular y reutilizable
- Componentes separados por responsabilidad
- Tipado completo con TypeScript
- Comentarios en código crítico

---

**Implementado por:** GitHub Copilot  
**Fecha:** 7 de noviembre de 2025  
**Versión:** 1.0.0  
**Estado:** ✅ Completado y Funcional
