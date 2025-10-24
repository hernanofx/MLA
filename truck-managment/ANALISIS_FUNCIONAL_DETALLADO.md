# 📋 ANÁLISIS FUNCIONAL DETALLADO
## Network Management Argentina (NMA)

**Documento**: Análisis de Funcionalidades  
**Fecha**: 24 de Octubre de 2025  
**Versión**: 1.0  
**Audiencia**: Gerencia de Sistemas, Product Owners, Stakeholders

---

## 📑 ÍNDICE

1. [Visión General del Sistema](#visión-general-del-sistema)
2. [Módulo de Dashboard y Analytics](#módulo-de-dashboard-y-analytics)
3. [Módulo TMS - Transport Management](#módulo-tms---transport-management)
4. [Módulo WMS - Warehouse Management](#módulo-wms---warehouse-management)
5. [Módulo VMS - Vendor Management](#módulo-vms---vendor-management)
6. [Módulo GIS - Geographic Information](#módulo-gis---geographic-information)
7. [Sistema de Gestión de Usuarios](#sistema-de-gestión-de-usuarios)
8. [Sistema de Notificaciones](#sistema-de-notificaciones)
9. [Sistema de Reportes y Exportación](#sistema-de-reportes-y-exportación)
10. [Flujos de Trabajo Completos](#flujos-de-trabajo-completos)

---

## 🎯 VISIÓN GENERAL DEL SISTEMA

### Propósito del Sistema

Network Management Argentina es una **plataforma integral de gestión logística** que centraliza y automatiza las operaciones críticas de una red de distribución, incluyendo:

- Control de flota y movimientos de camiones
- Gestión de inventario multi-almacén
- Verificación y trazabilidad de paquetes
- Asignación de zonas de cobertura
- Análisis de datos y reportería

### Usuarios del Sistema

```yaml
Perfiles de Usuario:
  
  Administrador (Admin):
    Cantidad Estimada: 5-10 usuarios
    Acceso: Total al sistema
    Responsabilidades:
      - Configuración de maestros (proveedores, camiones, almacenes)
      - Gestión de usuarios y permisos
      - Configuración de zonas geográficas
      - Asignación de coberturas
      - Supervisión general de operaciones
      - Generación de reportes ejecutivos
    
  Usuario Regular (User):
    Cantidad Estimada: 20-50 usuarios
    Acceso: Solo lectura
    Responsabilidades:
      - Consulta de inventario
      - Visualización de reportes
      - Seguimiento de operaciones
      - Dashboard informativo
    
  Usuario VMS (Vendor Management):
    Cantidad Estimada: 10-30 usuarios por proveedor
    Acceso: Módulo VMS específico de su proveedor
    Responsabilidades:
      - Carga de pre-alertas y pre-ruteos
      - Escaneo y verificación de paquetes
      - Generación de reportes de envíos
      - Consulta de historial de operaciones
```

### Alcance Funcional

```
┌─────────────────────────────────────────────────────────────┐
│                  NETWORK MANAGEMENT ARGENTINA                │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
    ┌───────▼──────┐ ┌─────▼─────┐ ┌──────▼──────┐
    │     TMS      │ │    WMS    │ │     VMS     │
    │  Transport   │ │ Warehouse │ │   Vendor    │
    │ Management   │ │Management │ │ Management  │
    └──────┬───────┘ └─────┬─────┘ └──────┬──────┘
           │               │               │
    ┌──────▼───────────────▼───────────────▼──────┐
    │         ANALYTICS & REPORTING ENGINE        │
    └──────┬───────────────┬───────────────┬──────┘
           │               │               │
    ┌──────▼──────┐ ┌─────▼─────┐ ┌──────▼──────┐
    │     GIS     │ │   Users   │ │    Notify   │
    │  Geographic │ │ Management│ │   System    │
    └─────────────┘ └───────────┘ └─────────────┘
```

---

## 📊 MÓDULO DE DASHBOARD Y ANALYTICS

### 1.1 Dashboard Principal (Administradores)

**Ruta**: `/dashboard`  
**Rol Requerido**: Admin, User  
**Actualización**: Tiempo real (server-side rendering)

#### Métricas en Tiempo Real

```yaml
Tarjetas de Estadísticas (8 KPIs principales):
  
  1. Total de Proveedores:
     - Contador de proveedores activos
     - Link directo a gestión de proveedores
     - Ícono: Usuarios múltiples
     - Color: Azul
  
  2. Total de Camiones:
     - Contador de camiones registrados
     - Link a gestión de flota
     - Ícono: Camión
     - Color: Ámbar
  
  3. Total de Entradas:
     - Cantidad de registros de entrada
     - Filtrable por periodo
     - Ícono: Portapapeles
     - Color: Azul
  
  4. Total de Cargas:
     - Cantidad de cargas/salidas
     - Métricas de carga/descarga
     - Ícono: Paquete
     - Color: Púrpura
  
  5. Inventario Total:
     - Cantidad de paquetes en sistema
     - Desglose por estado
     - Ícono: Caja
     - Color: Esmeralda
  
  6. Almacenes Activos:
     - Número de almacenes configurados
     - Link a gestión de almacenes
     - Ícono: Edificio
     - Color: Índigo
  
  7. Ubicaciones de Almacenamiento:
     - Total de ubicaciones disponibles
     - Capacidad utilizada
     - Ícono: Pin de mapa
     - Color: Naranja
  
  8. Inventario Almacenado vs Enviado:
     - Ratio de distribución
     - Gráfico de barras comparativo
     - Ícono: Gráfico de barras
     - Color: Gris/Verde/Rojo
```

#### Visualizaciones Circulares (Donuts)

```yaml
1. Estado del Inventario:
   Tipo: Donut Chart
   Datos:
     - Porcentaje Enviado
     - Porcentaje Almacenado
   Colores:
     - Verde (enviado)
     - Naranja (almacenado)
   
2. Distribución de Almacenes:
   Tipo: Donut Chart
   Datos:
     - Porcentaje Ocupado
     - Porcentaje Disponible
   Colores:
     - Azul (ocupado)
     - Gris (disponible)
   
3. Capacidad por Ubicación:
   Tipo: Visualización radial
   Datos:
     - Ubicaciones totales
     - Almacenes activos
   Diseño: Circular con número central
```

#### Sección de Accesos Rápidos

```yaml
Quick Actions:
  1. Nuevo Proveedor:
     - Botón: Verde
     - Acción: Redirige a /providers/new
     - Ícono: Usuarios
  
  2. Nueva Entrada:
     - Botón: Azul
     - Acción: Redirige a /entries/new
     - Ícono: Entrada
  
  3. Nuevo Camión:
     - Botón: Ámbar
     - Acción: Redirige a /trucks
     - Ícono: Camión
  
  4. Ver Reportes:
     - Botón: Gris
     - Acción: Redirige a /reports
     - Ícono: Gráfico de barras
```

#### Actividad Reciente

```yaml
Listado de Últimas Acciones:
  Elementos Mostrados: Últimas 10 acciones
  Información por Item:
    - Tipo de acción (Entrada, Carga, Inventario)
    - Proveedor asociado
    - Timestamp (formato relativo: "hace 2 horas")
    - Ícono descriptivo
    - Link a detalle
  
  Tipos de Actividad:
    - Nueva Entrada de Camión
    - Nueva Carga
    - Movimiento de Inventario
    - Creación de Proveedor
    - Asignación de Zona
  
  Actualización: Al cargar página (SSR)
  Paginación: No (solo últimas 10)
```

### 1.2 Dashboard VMS (Proveedores)

**Ruta**: `/vms`  
**Rol Requerido**: VMS, Admin  
**Características Especiales**: Multi-tenant (cada proveedor ve solo sus datos)

#### Información del Proveedor

```yaml
Header Personalizado:
  Elementos:
    - Logo/Nombre del proveedor
    - Estado operativo (badge verde "Operativo")
    - Información de contacto
    - Fecha de último envío
  
  Datos Mostrados:
    - Nombre de razón social
    - Código de proveedor
    - Email de contacto
    - Responsable asignado
```

#### KPIs del Proveedor

```yaml
Métricas Específicas (4 tarjetas):
  
  1. Total de Envíos:
     Valor: Cantidad total de shipments
     Desglose: Activos vs Finalizados
     Tendencia: Comparación con mes anterior
  
  2. Envíos en Proceso:
     Valor: Shipments en estado VERIFICACION o PRE_RUTEO
     Estado: Amarillo (alerta)
     Acción: Link a escaneo activo
  
  3. Envíos Completados:
     Valor: Shipments FINALIZADOS
     Estado: Verde (éxito)
     Porcentaje: Del total
  
  4. Tasa de Incidencias:
     Cálculo: (Sobrantes + Fuera Cobertura) / Total Escaneados
     Estado: Rojo si >5%, Amarillo si 2-5%, Verde si <2%
     Detalle: Desglose por tipo
```

#### Tabla de Envíos Recientes

```yaml
Columnas:
  - ID de Envío (truncado)
  - Fecha de Creación
  - Estado (badge con color)
  - Pre-Alertas cargadas
  - Pre-Ruteos cargados
  - Paquetes Escaneados
  - Progreso (barra)
  - Acciones (Ver reporte, Continuar escaneo)

Estados Visuales:
  - PRE_ALERTA: Azul claro
  - PRE_RUTEO: Azul
  - VERIFICACION: Amarillo
  - FINALIZADO: Verde

Filtros Disponibles:
  - Por estado
  - Por fecha
  - Por búsqueda de ID

Paginación: 10 items por página
```

#### Acciones Principales

```yaml
Botones de Acción:
  
  1. Nuevo Envío:
     Tipo: Primary button (verde)
     Acción: Inicia wizard de 4 pasos
     Ruta: /vms/shipments/new
     Prominencia: Alta
  
  2. Ver Todos los Envíos:
     Tipo: Secondary button
     Acción: Lista completa con filtros avanzados
     Ruta: /vms/shipments
  
  3. Exportar Reportes:
     Tipo: Dropdown menu
     Opciones:
       - Reporte del día
       - Reporte semanal
       - Reporte mensual
       - Personalizado
```

---

## 🚛 MÓDULO TMS - TRANSPORT MANAGEMENT

### 2.1 Gestión de Camiones

**Ruta**: `/trucks`  
**Propósito**: Control maestro de la flota de vehículos

#### Funcionalidades de Listado

```yaml
Vista Principal:
  Diseño: Tabla responsiva con cards en móvil
  
  Información por Camión:
    - Patente (identificador único)
    - Fecha de registro
    - Total de entradas registradas
    - Total de cargas registradas
    - Última actividad
    - Estado (Activo/Inactivo)
  
  Búsqueda:
    Campo: Patente
    Tipo: Búsqueda en tiempo real (debounced)
    Sensibilidad: Case-insensitive
  
  Ordenamiento:
    Criterios disponibles:
      - Por patente (A-Z)
      - Por fecha de registro (más reciente primero)
      - Por cantidad de operaciones
    
  Acciones por Fila:
    - Ver Historial (modal o página)
    - Editar Información
    - Eliminar (con confirmación)
    - Ver Estadísticas
```

#### Registro de Nuevo Camión

```yaml
Formulario de Creación:
  Campos:
    - Patente*:
        Tipo: Text input
        Validación: 
          - Único en sistema
          - Formato argentino (AAA000 o AA000AA)
          - Mayúsculas automáticas
        Mensajes de Error:
          - "La patente ya existe"
          - "Formato inválido"
    
    - Marca:
        Tipo: Text input
        Opcional: Sí
        Ejemplos: Mercedes-Benz, Scania, Volvo
    
    - Modelo:
        Tipo: Text input
        Opcional: Sí
    
    - Año:
        Tipo: Number input
        Rango: 1980 - 2025
        Opcional: Sí
    
    - Capacidad de Carga:
        Tipo: Number input
        Unidad: Kilogramos o m³
        Opcional: Sí
    
    - Observaciones:
        Tipo: Textarea
        Opcional: Sí
        Max caracteres: 500

  Validación:
    - Frontend: Validación en tiempo real
    - Backend: Validación adicional en API
    - Duplicados: Verificación antes de guardar
  
  Respuesta:
    - Éxito: Redirección a listado con toast
    - Error: Mensaje de error específico
    - Toast: "Camión registrado exitosamente"
```

#### Historial de Operaciones

```yaml
Vista de Detalle del Camión:
  
  Información General:
    - Patente (destacada)
    - Datos del vehículo
    - Fecha de registro
    - Total de operaciones
  
  Tabs de Información:
    
    1. Entradas:
       Tabla con:
         - Fecha y hora de entrada
         - Proveedor
         - Duración de estadía
         - Estado (Completado/En curso)
         - Link a detalle
       
       Métricas:
         - Tiempo promedio de estadía
         - Total de entradas
         - Entradas este mes
    
    2. Cargas:
       Tabla con:
         - Fecha y hora de carga
         - Proveedor
         - Cantidad/Contenedor
         - Duración
         - Link a detalle
       
       Métricas:
         - Total de cargas
         - Cargas este mes
         - Promedio de carga
    
    3. Estadísticas:
       Gráficos:
         - Línea de tiempo de uso
         - Distribución por proveedor
         - Horas pico de operación
         - Tendencia mensual
```

### 2.2 Gestión de Entradas

**Ruta**: `/entries`  
**Propósito**: Registro y control de ingreso de camiones al depósito

#### Listado de Entradas

```yaml
Vista Principal:
  
  Filtros Avanzados:
    - Por Proveedor (dropdown)
    - Por Camión (búsqueda)
    - Por Semana (selector)
    - Por Mes (selector)
    - Por Estado (Activo/Completado)
    - Rango de Fechas (date picker)
  
  Tabla de Datos:
    Columnas:
      1. ID de Entrada:
         - Formato: #ENTRY-XXXXX
         - Link: Detalle de entrada
      
      2. Proveedor:
         - Nombre completo
         - Badge con color del proveedor
         - Link: Perfil del proveedor
      
      3. Camión:
         - Patente destacada
         - Link: Detalle del camión
      
      4. Hora de Entrada:
         - Formato: DD/MM/YYYY HH:mm
         - Relativo: "hace 2 horas"
      
      5. Hora de Salida:
         - Formato: DD/MM/YYYY HH:mm
         - Estado: "En curso" si no hay salida
         - Badge: Verde (salió) / Amarillo (en curso)
      
      6. Duración:
         - Cálculo automático
         - Formato: "2h 30m"
         - Color: Verde <2h, Amarillo 2-4h, Rojo >4h
      
      7. Semana/Mes:
         - Número de semana ISO
         - Mes del año
         - Para reportes
      
      8. Acciones:
         - Ver Detalle
         - Editar (solo admins)
         - Registrar Salida
         - Asociar Inventario
         - Eliminar
  
  Paginación:
    Items por página: 20
    Navegación: Anterior / Siguiente
    Saltar a página específica
  
  Exportación:
    Formatos: Excel, CSV
    Filtros: Se mantienen en export
    Columnas: Seleccionables
```

#### Registro de Nueva Entrada

```yaml
Formulario de Entrada:
  
  Paso 1 - Información Básica:
    
    Proveedor*:
      Tipo: Dropdown autocomplete
      Fuente: API /api/providers
      Búsqueda: En tiempo real
      Muestra: Nombre y código
      Acción: "Crear nuevo" si no existe
    
    Camión*:
      Tipo: Dropdown autocomplete
      Fuente: API /api/trucks
      Búsqueda: Por patente
      Muestra: Patente y modelo
      Acción: "Registrar nuevo" si no existe
      Filtro: Opcional por proveedor
    
    Hora de Entrada*:
      Tipo: DateTime picker
      Default: Fecha y hora actual
      Formato: DD/MM/YYYY HH:mm
      Validación: No puede ser futura
      Precisión: Minutos
    
    Observaciones:
      Tipo: Textarea
      Opcional: Sí
      Placeholder: "Ej: Descarga de mercadería frágil"
      Max caracteres: 500
  
  Paso 2 - Inventario (Opcional):
    
    ¿Registrar Inventario ahora?:
      Opción: Checkbox
      Si Sí:
        - Redirige a formulario de inventario
        - Pre-llena proveedor y entrada
      Si No:
        - Guarda solo entrada
        - Permite agregar inventario después
  
  Validaciones:
    - Proveedor debe existir
    - Camión debe estar registrado
    - No puede haber entrada activa del mismo camión
    - Hora de entrada coherente
  
  Cálculos Automáticos:
    - Semana ISO: Calculada automáticamente
    - Mes: Extraído de fecha
    - Duración: Si hay salida, calculada
  
  Respuesta:
    Éxito:
      - Toast: "Entrada registrada"
      - Redirección: Listado de entradas
      - Highlight: Nueva entrada destacada
    
    Error:
      - Mensaje específico
      - Campos marcados en rojo
      - Sugerencias de corrección
```

#### Registro de Salida

```yaml
Modal de Salida:
  
  Trigger: Botón "Registrar Salida" en fila de entrada activa
  
  Contenido:
    Información de la Entrada:
      - Proveedor
      - Camión (patente)
      - Hora de entrada
      - Duración transcurrida (actualizada en vivo)
    
    Campo de Salida:
      - Hora de Salida*:
          Tipo: DateTime picker
          Default: Ahora
          Validación: Debe ser > hora de entrada
          Formato: DD/MM/YYYY HH:mm
    
    Resumen:
      - Duración Total: Calculada automáticamente
      - Estadía: Clasificación (Normal/Prolongada)
      - Alerta: Si >4 horas, mostrar warning
  
  Acciones:
    - Confirmar Salida (primary)
    - Cancelar (secondary)
  
  Efecto:
    - Actualiza registro de entrada
    - Calcula y guarda duración
    - Libera "slot" del camión
    - Actualiza estadísticas en dashboard
    - Notifica si hay suscriptores
```

### 2.3 Gestión de Cargas

**Ruta**: `/loads`  
**Propósito**: Control de salida de mercadería

#### Características Principales

```yaml
Similitudes con Entradas:
  - Estructura de tabla idéntica
  - Filtros equivalentes
  - Sistema de búsqueda similar
  - Exportación a Excel/CSV

Diferencias Clave:
  
  Campos Adicionales:
    - Cantidad:
        Tipo: Text/Number
        Descripción: "Ej: 150 cajas, 20 pallets"
        Validación: Alfanumérico
    
    - Contenedor:
        Tipo: Text
        Descripción: "Ej: CONT-001, Camión C-12"
        Opcional: Sí
  
  Flujo:
    - Orientado a SALIDA de mercadería
    - Puede o no estar asociado a una entrada previa
    - Tracking de distribución
  
  Reportes:
    - Carga por mes
    - Distribución por proveedor
    - Volumen transportado
    - Eficiencia de carga/descarga
```

---

## 📦 MÓDULO WMS - WAREHOUSE MANAGEMENT

### 3.1 Gestión de Almacenes

**Ruta**: `/stocks` (tab: Almacenes)  
**Propósito**: Control de depósitos y centros de distribución

#### Estructura Jerárquica

```yaml
Modelo de Datos:
  Almacén (Warehouse):
    ├── Nombre
    ├── Dirección
    ├── Descripción
    └── Ubicaciones (1 a N)
          ├── Ubicación 1 (Location)
          ├── Ubicación 2
          └── Ubicación N

Ejemplo Real:
  "Depósito Central Buenos Aires":
    ├── Dirección: "Av. Libertador 1234, CABA"
    └── Ubicaciones:
          ├── "Estantería A - Piso 1"
          ├── "Estantería A - Piso 2"
          ├── "Zona de Cuarentena"
          ├── "Muelle de Carga 1"
          └── "Almacén Temporal"
```

#### Funcionalidades de Almacenes

```yaml
Listado de Almacenes:
  
  Tarjetas de Almacén:
    Diseño: Grid responsivo (1-3 columnas)
    
    Información Mostrada:
      - Nombre del almacén (destacado)
      - Dirección completa
      - Descripción breve
      - Cantidad de ubicaciones
      - Cantidad de paquetes almacenados
      - Porcentaje de ocupación
      - Estado (Activo/Inactivo)
    
    Indicadores Visuales:
      - Barra de capacidad:
          Verde: <70% ocupado
          Amarillo: 70-90% ocupado
          Rojo: >90% ocupado
      
      - Badge de estado:
          Verde: Operativo
          Rojo: Mantenimiento
          Gris: Inactivo
    
    Acciones:
      - Ver Ubicaciones (expandir)
      - Editar Almacén
      - Ver Inventario
      - Generar Reporte
      - Eliminar (si está vacío)
  
  Crear Nuevo Almacén:
    
    Formulario:
      - Nombre*:
          Validación: Único en sistema
          Ejemplo: "CD Norte - Rosario"
      
      - Dirección*:
          Tipo: Text area
          Ejemplo: "Ruta 9 Km 234, Rosario"
          Opción: Geocoding automático (futuro)
      
      - Descripción:
          Tipo: Textarea
          Max: 500 caracteres
          Ejemplo: "Centro de distribución para zona norte"
      
      - Capacidad Estimada:
          Tipo: Number
          Unidad: m² o cantidad de paquetes
          Opcional: Sí
    
    Acción Post-Creación:
      - Crear ubicaciones iniciales
      - Asignar responsable (opcional)
      - Configurar alertas de capacidad
```

### 3.2 Gestión de Ubicaciones

**Ruta**: `/stocks` (tab: Ubicaciones)  
**Propósito**: Control granular de espacios de almacenamiento

#### Vista de Ubicaciones

```yaml
Tabla de Ubicaciones:
  
  Columnas:
    1. Código/Nombre:
       - Identificador único
       - Formato sugerido: "ALM-01-EST-A-P1"
       - Jerárquico y descriptivo
    
    2. Almacén:
       - Nombre del warehouse padre
       - Link: Ver todos en mismo almacén
       - Badge con color
    
    3. Descripción:
       - Texto libre
       - Ejemplos:
           "Estantería A, Piso 1, Zona Electrónicos"
           "Muelle de carga 3"
           "Zona de cuarentena - COVID"
    
    4. Paquetes Almacenados:
       - Cantidad actual
       - Link: Ver inventario en esa ubicación
       - Color: Según ocupación
    
    5. Estado:
       - Disponible (verde)
       - Llena (rojo)
       - En mantenimiento (amarillo)
       - Bloqueada (gris)
    
    6. Última Actividad:
       - Timestamp del último movimiento
       - Formato relativo: "hace 2 horas"
    
    7. Acciones:
       - Ver Inventario
       - Mover Paquetes
       - Editar
       - Bloquear/Desbloquear
       - Eliminar (si está vacía)
  
  Filtros:
    - Por Almacén (dropdown)
    - Por Estado (multi-select)
    - Por Ocupación (slider 0-100%)
    - Búsqueda por nombre/código
  
  Ordenamiento:
    - Por almacén
    - Por ocupación (ascendente/descendente)
    - Por última actividad
    - Alfabético
```

#### Creación de Ubicaciones

```yaml
Formulario de Nueva Ubicación:
  
  Campos:
    - Almacén Padre*:
        Tipo: Dropdown
        Fuente: Lista de almacenes activos
        Obligatorio: Sí
    
    - Nombre/Código*:
        Tipo: Text input
        Validación: Único dentro del almacén
        Sugerencia: Usar nomenclatura estandarizada
        Ejemplo: "EST-A-P1-S01"
    
    - Descripción*:
        Tipo: Textarea
        Requerido: Sí
        Ejemplo: "Estantería A, Piso 1, Sección 01"
        Max: 200 caracteres
    
    - Tipo de Ubicación:
        Tipo: Select
        Opciones:
          - Estantería
          - Pallet
          - Contenedor
          - Zona de piso
          - Muelle
          - Cuarentena
          - Otro
        Opcional: Sí
    
    - Capacidad Máxima:
        Tipo: Number
        Unidad: Cantidad de paquetes o m³
        Opcional: Sí
        Uso: Para alertas de capacidad
  
  Opciones Avanzadas:
    - Permitir sobrecarga: Checkbox
    - Requiere autorización para uso: Checkbox
    - Zona de alta rotación: Checkbox
  
  Validación:
    - Nombre único dentro del almacén
    - Almacén debe existir y estar activo
    - Capacidad coherente
  
  Creación Masiva:
    Opción: Checkbox "Crear múltiples ubicaciones"
    Configuración:
      - Prefijo base: "EST-A-P1-S"
      - Cantidad: 20
      - Numeración: 01 a 20
      - Resultado: EST-A-P1-S01, EST-A-P1-S02, ...EST-A-P1-S20
```

### 3.3 Gestión de Inventario

**Ruta**: `/stocks` (tab: Inventario)  
**Propósito**: Control agregado de stock por ubicación

#### Vista de Inventario

```yaml
Tabla de Inventario Agregado:
  
  Concepto:
    - Un registro de inventario agrupa múltiples paquetes
    - Asociado a una entrada de camión (opcional)
    - Ubicado en una location específica
    - Puede contener 1 a N paquetes
  
  Columnas:
    1. ID de Inventario:
       - Formato: #INV-XXXXX
       - Link: Detalle completo
    
    2. Entrada Asociada:
       - ID de entrada de camión
       - Link: Ver entrada
       - Puede ser null (inventario manual)
    
    3. Proveedor:
       - Nombre del proveedor
       - Badge con color
       - Link: Perfil
    
    4. Ubicación:
       - Almacén > Ubicación
       - Formato: "CD Central > EST-A-P1"
       - Link: Ver ubicación
    
    5. Cantidad:
       - Número de paquetes
       - Tipo: Integer
       - Color: Verde si <100, Amarillo si >100
    
    6. Estado:
       - Almacenado (default)
       - En tránsito
       - Enviado
       - Dañado
       - En cuarentena
       Badge con colores distintivos
    
    7. Tracking Numbers:
       - Lista de tracking (truncada)
       - Ejemplo: "MLAR001, MLAR002, +18 más"
       - Link: Ver todos
    
    8. Fecha de Ingreso:
       - Timestamp de creación
       - Formato: DD/MM/YYYY
    
    9. Acciones:
       - Ver Paquetes
       - Generar Etiquetas
       - Mover a Otra Ubicación
       - Marcar como Enviado
       - Editar
       - Eliminar
  
  Filtros Avanzados:
    - Por Proveedor
    - Por Almacén
    - Por Ubicación
    - Por Estado
    - Por Rango de Fechas
    - Por Cantidad (min-max)
    - Por Tracking Number
  
  Búsqueda:
    - Por ID de inventario
    - Por tracking number
    - Por proveedor
  
  Acciones Masivas:
    - Seleccionar múltiples inventarios
    - Mover en bloque
    - Cambiar estado en bloque
    - Exportar seleccionados
    - Generar reporte consolidado
```

#### Registro de Nuevo Inventario

```yaml
Formulario de Creación:
  
  Origen del Inventario:
    Opción 1: Desde Entrada de Camión
      - Selector de entrada activa
      - Pre-llena proveedor automáticamente
      - Asocia con entry_id
    
    Opción 2: Registro Manual
      - Selección manual de proveedor
      - Entry_id queda null
      - Usar para inventario sin entrada registrada
  
  Campos del Formulario:
    
    - Proveedor*:
        Tipo: Dropdown autocomplete
        Prellenado: Si viene de entrada
        Obligatorio: Sí
    
    - Ubicación de Almacenamiento*:
        Tipo: Cascading dropdown
        Nivel 1: Seleccionar Almacén
        Nivel 2: Seleccionar Ubicación dentro del almacén
        Validación: Ubicación debe estar disponible
        Alerta: Si ubicación está >90% llena
    
    - Cantidad de Paquetes*:
        Tipo: Number input
        Min: 1
        Validación: Integer positivo
        Uso: Crear N paquetes individuales
    
    - Tracking Numbers:
        Tipo: Textarea con parsing especial
        Formatos aceptados:
          - Lista separada por comas
          - Lista separada por saltos de línea
          - Rango: "MLAR001-MLAR050" (genera 50 trackings)
        Validación:
          - Opcional: Si se omite, genera automáticamente
          - Si se provee, debe coincidir con cantidad
          - Cada tracking debe ser único en sistema
        Ejemplo:
          ```
          MLAR00001
          MLAR00002
          MLAR00003
          ```
        o
          ```
          MLAR00001, MLAR00002, MLAR00003
          ```
    
    - Estado Inicial:
        Tipo: Select
        Default: "almacenado"
        Opciones:
          - ingresado
          - almacenado
          - en_traspaso
        
    - Observaciones:
        Tipo: Textarea
        Opcional: Sí
        Max: 500 caracteres
  
  Procesamiento:
    1. Validar datos
    2. Crear registro de Inventario
    3. Generar/Validar tracking numbers
    4. Crear N registros de Package individuales
    5. Asociar packages con inventory
    6. Actualizar contadores de ubicación
    7. Registrar movimiento inicial (ingreso)
    8. Enviar notificación si corresponde
  
  Respuesta:
    Éxito:
      - Toast: "Inventario registrado: X paquetes"
      - Redirección: Vista de inventario
      - Opción: Imprimir etiquetas
    
    Error:
      - Mensaje específico por tipo de error
      - Sugerencias de corrección
```

### 3.4 Gestión de Paquetes Individuales

**Ruta**: `/stocks` (tab: Paquetes)  
**Propósito**: Trazabilidad unitaria de cada paquete

#### Modelo de Paquete

```yaml
Package (Paquete Individual):
  Atributos:
    - ID único (UUID)
    - Tracking Number (único en sistema)
    - Inventario padre (reference)
    - Proveedor actual
    - Ubicación actual
    - Estado (enum)
    - Fecha de creación
    - Fecha de última actualización
  
  Estados Posibles:
    - ingresado: Recién recibido, pendiente almacenamiento
    - almacenado: En ubicación definitiva
    - en_traspaso: Movimiento entre ubicaciones/proveedores
    - entregado: Enviado al destinatario final
  
  Relaciones:
    - Pertenece a: Inventory (1 package → 1 inventory)
    - Ubicado en: Location (1 package → 1 location)
    - Proveedor actual: Provider (nullable)
    - Historial: PackageMovement[] (array de movimientos)
```

#### Vista de Paquetes

```yaml
Tabla de Paquetes:
  
  Diseño:
    - Alta performance para miles de registros
    - Virtualización de scroll (infinite scroll)
    - Carga lazy de datos
  
  Columnas:
    1. Tracking Number:
       - Destacado y copyable
       - Link: Ver historial completo
       - Ícono: Copiar al portapapeles
       - Formato: Monoespaciado
    
    2. Inventario:
       - ID del inventory padre
       - Link: Ver todo el lote
       - Badge: Cantidad total en lote
    
    3. Proveedor Actual:
       - Puede ser diferente al proveedor de origen
       - Actualizado con cada traspaso
       - Color badge distintivo
    
    4. Ubicación Actual:
       - Almacén > Ubicación
       - Formato jerárquico
       - Link: Ver ubicación
       - Alerta: Si ha estado >30 días
    
    5. Estado:
       - Badge con color
       - Ícono descriptivo
       - Tooltip con detalle
       Colores:
         - Azul: ingresado
         - Verde: almacenado
         - Amarillo: en_traspaso
         - Gris: entregado
    
    6. Fecha de Ingreso:
       - Timestamp de creación
       - Formato: DD/MM/YYYY HH:mm
       - Tooltip: Días en sistema
    
    7. Última Actividad:
       - Último movimiento
       - Formato relativo: "hace 3 días"
       - Ícono: Tipo de movimiento
    
    8. Acciones:
       - Ver Historial Completo
       - Mover a Ubicación
       - Traspasar a Proveedor
       - Marcar como Entregado
       - Imprimir Etiqueta
       - Generar Código QR
  
  Búsqueda Poderosa:
    Input: Tracking number
    Features:
      - Búsqueda en tiempo real (debounced 300ms)
      - Búsqueda parcial (wildcard automático)
      - Búsqueda por rangos: "MLAR001-MLAR050"
      - Case insensitive
      - Resaltado de resultados
    
    Resultados:
      - Highlight del tracking encontrado
      - Scroll automático al resultado
      - Cantidad de coincidencias
  
  Filtros:
    - Por Inventario (multi-select)
    - Por Proveedor (multi-select)
    - Por Ubicación (cascading)
    - Por Estado (checkboxes)
    - Por Rango de Fechas
    - Por Almacén
    - Solo con Movimientos Recientes
  
  Exportación:
    Formatos: Excel, CSV
    Opciones:
      - Solo visibles (con filtros)
      - Todos los paquetes
      - Incluir historial completo
      - Solo resumen
```

#### Trazabilidad: Historial de Movimientos

```yaml
Package Movement (Movimiento de Paquete):
  
  Concepto:
    - Registro inmutable de cada acción sobre un paquete
    - Auditoría completa de la vida útil
    - Compliance y trazabilidad total
  
  Tipos de Movimiento:
    1. Ingreso (initial):
       - Primer registro en sistema
       - Asociado a entrada de camión o manual
       - From: null
       - To: Ubicación inicial
    
    2. Traspaso entre ubicaciones:
       - Movimiento dentro del mismo almacén
       - Movimiento entre almacenes
       - From: Ubicación A
       - To: Ubicación B
    
    3. Traspaso entre proveedores:
       - Cambio de proveedor responsable
       - From Provider: Proveedor A
       - To Provider: Proveedor B
       - Común en operaciones de last-mile
    
    4. Salida (entrega):
       - Paquete sale del sistema
       - Entregado al destinatario
       - To: null (fuera del almacén)
  
  Atributos del Movimiento:
    - ID único
    - Package ID (referencia)
    - From Provider ID (nullable)
    - To Provider ID (nullable)
    - From Location ID (nullable)
    - To Location ID (nullable)
    - Action (enum: ingreso|traspaso|salida)
    - Timestamp (fecha y hora exacta)
    - User ID (quién realizó el movimiento)
    - Notes (observaciones opcionales)
  
  Vista de Historial:
    Diseño: Timeline vertical
    
    Por cada movimiento:
      - Timestamp destacado
      - Tipo de acción (ícono + texto)
      - Usuario responsable
      - Origen → Destino (visual con flecha)
      - Notas (si existen)
      - Duración en origen (calculada)
    
    Ejemplo Visual:
      ```
      ┌─ hace 2 días (23/10/2025 14:30)
      │  📦 INGRESO
      │  Usuario: Juan Pérez
      │  → Ubicación: CD Central > EST-A-P1
      │
      ├─ hace 1 día (24/10/2025 09:15)  [Duración: 18h 45m]
      │  🔄 TRASPASO
      │  Usuario: María González
      │  CD Central > EST-A-P1 → CD Central > Muelle-1
      │  Notas: "Preparación para envío"
      │
      └─ hace 3 horas (25/10/2025 11:00)  [Duración: 1d 1h 45m]
         ✈️ SALIDA
         Usuario: Carlos Díaz
         CD Central > Muelle-1 → Entregado
         Notas: "Enviado a destino final"
      ```
    
    Métricas Calculadas:
      - Tiempo total en sistema
      - Tiempo en cada ubicación
      - Cantidad de movimientos
      - Tiempo promedio entre movimientos
      - Alertas de demora
```

#### Operaciones sobre Paquetes

```yaml
1. Mover Paquete a Nueva Ubicación:
   
   Modal de Movimiento:
     Información del Paquete:
       - Tracking number
       - Ubicación actual
       - Estado actual
       - Tiempo en ubicación actual
     
     Campos:
       - Nueva Ubicación*:
           Tipo: Cascading dropdown
           Opciones: Solo ubicaciones disponibles
           Validación: Capacidad disponible
       
       - Motivo del Movimiento:
           Tipo: Select
           Opciones:
             - Reorganización
             - Preparación para envío
             - Cambio de zona
             - Mantenimiento de ubicación
             - Otro
       
       - Notas:
           Tipo: Textarea
           Opcional: Sí
           Max: 200 caracteres
     
     Proceso:
       1. Validar disponibilidad de nueva ubicación
       2. Crear registro de PackageMovement
       3. Actualizar package.currentLocationId
       4. Actualizar contadores de ambas ubicaciones
       5. Log de auditoría
       6. Notificación (si configurada)
     
     Efecto:
       - Paquete cambia de ubicación
       - Historial se actualiza
       - Dashboard refleja cambio
       - Alerta si ubicación destino >90% llena

2. Traspasar a Otro Proveedor:
   
   Modal de Traspaso:
     Información:
       - Tracking number
       - Proveedor actual
       - Ubicación actual
     
     Campos:
       - Nuevo Proveedor*:
           Tipo: Dropdown
           Fuente: Proveedores activos
           Validación: No puede ser el mismo
       
       - ¿Cambiar ubicación también?:
           Tipo: Checkbox
           Si Sí: Mostrar selector de ubicación
       
       - Motivo:
           Tipo: Select predefinido
       
       - Notas:
           Tipo: Textarea
     
     Proceso:
       1. Validar nuevo proveedor
       2. Crear PackageMovement (tipo: traspaso)
       3. Actualizar package.currentProviderId
       4. Si cambia ubicación, actualizar también
       5. Notificar a ambos proveedores
     
     Uso típico:
       - Subcontratación de last-mile
       - Redistribución de carga
       - Cambio de responsable logístico

3. Marcar como Entregado:
   
   Confirmación:
     Advertencia: "Esta acción es irreversible"
     
     Información a confirmar:
       - Tracking number
       - Destinatario (si disponible)
       - Fecha de entrega: DateTime picker
       - Comprobante de entrega: File upload (opcional)
       - Firma digital: Canvas signature (opcional)
       - Notas finales: Textarea
     
     Proceso:
       1. Validar que no esté ya entregado
       2. Crear PackageMovement (action: salida)
       3. Actualizar package.status = 'entregado'
       4. package.currentLocationId = null
       5. Archivar en histórico
       6. Actualizar estadísticas del proveedor
       7. Notificar finalización
     
     Efecto:
       - Paquete sale del inventario activo
       - Aparece en reportes de "entregados"
       - Libera espacio en ubicación
       - Actualiza KPIs

4. Operaciones Masivas:
   
   Selección Múltiple:
     - Checkbox en cada fila
     - Select All (todos en página actual)
     - Select All (todos con filtros aplicados)
     - Contador de seleccionados
   
   Acciones Disponibles:
     
     - Mover Seleccionados:
         Destino: Una sola ubicación para todos
         Validación: Capacidad suficiente
         Proceso: Batch operation optimizada
         Progreso: Barra de progreso
     
     - Traspasar Seleccionados:
         Proveedor destino: Uno para todos
         Confirmación: Resumen antes de ejecutar
     
     - Marcar como Entregados:
         Fecha de entrega: Una para todos
         Confirmación múltiple requerida
     
     - Exportar Seleccionados:
         Formato: Excel o CSV
         Incluye: Tracking + Estado + Ubicación + Historial
     
     - Generar Etiquetas:
         Formato: PDF con código de barras
         Layout: Personalizable (Zebra, A4, etc.)
         Cantidad: Una por paquete seleccionado
     
     - Imprimir Remitos:
         Agrupado por: Proveedor o Ubicación
         Formato: PDF
         Incluye: Lista de trackings + resumen
```

---

_[Continuará en siguiente parte con Módulo VMS detallado]_
