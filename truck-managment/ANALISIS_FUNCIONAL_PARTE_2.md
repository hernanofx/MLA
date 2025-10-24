# 📋 ANÁLISIS FUNCIONAL DETALLADO - PARTE 2
## Network Management Argentina (NMA)

_Continuación del Análisis Funcional_

---

## 📱 MÓDULO VMS - VENDOR MANAGEMENT SYSTEM

### 4.1 Arquitectura Multi-Tenant del VMS

**Concepto Clave**: Cada proveedor opera en su propio "espacio" aislado

```yaml
Modelo Multi-Tenant:
  
  Principio de Aislamiento:
    - Un usuario VMS solo ve datos de SU proveedor
    - Los datos están físicamente en la misma BD
    - El aislamiento se logra por filtrado automático
  
  Ejemplo:
    Usuario: operador@urbano.com
    Rol: vms
    ProviderId: provider-urbano-001
    
    Queries automáticas:
      SELECT * FROM Shipment 
      WHERE providerId = 'provider-urbano-001'
    
    Resultado:
      - Ve solo envíos de Urbano
      - No puede acceder a datos de Ocasa
      - Dashboard personalizado con logo de Urbano
  
  Ventajas:
    ✅ Un solo sistema para todos los proveedores
    ✅ Mantenimiento centralizado
    ✅ Costos reducidos (no hay múltiples instancias)
    ✅ Datos aislados pero compartiendo infraestructura
    ✅ Fácil onboarding de nuevos proveedores
  
  Seguridad:
    - Validación en cada API call
    - Middleware de autorización
    - Logs de auditoría por proveedor
    - Imposibilidad de cross-provider access
```

### 4.2 Wizard de Nuevo Envío (4 Pasos)

**Ruta**: `/vms/shipments/new`  
**Propósito**: Proceso guiado de verificación de paquetes

#### Navegación del Wizard

```yaml
Estructura:
  ┌────────────────────────────────────────────────┐
  │  ① Pre-Alerta  →  ② Pre-Ruteo  →  ③ Verificación  →  ④ Reporte  │
  └────────────────────────────────────────────────┘

Indicadores Visuales:
  - Paso actual: Destacado en azul
  - Pasos completados: Check verde
  - Pasos pendientes: Gris
  - Progreso: Barra de avance 0-100%

Navegación:
  - Forward: Solo si paso actual está completo
  - Backward: Permitido en cualquier momento
  - Saltar pasos: No permitido
  - Guardar progreso: Automático al completar cada paso
  - Abandonar: Confirmación requerida

Persistencia:
  - URL refleja paso actual: /vms/shipments/new?step=2
  - Refresh: Mantiene estado
  - Session storage: Datos temporales
  - Database: Datos confirmados

Estado del Shipment:
  - Paso 1 completado: status = 'PRE_ALERTA'
  - Paso 2 completado: status = 'PRE_RUTEO'
  - Paso 3 activo: status = 'VERIFICACION'
  - Paso 4 completado: status = 'FINALIZADO'
```

#### PASO 1: Pre-Alerta

**Objetivo**: Cargar archivo Excel con paquetes esperados de MercadoLibre

```yaml
Interface del Paso:
  
  Header:
    - Título: "Paso 1: Pre-Alerta"
    - Descripción: "Carga el archivo Excel con las pre-alertas de paquetes"
    - Ícono: Upload (nube con flecha arriba)
  
  Zona de Upload:
    Diseño: Drag & Drop area
    Tamaño: 400px x 200px
    Estados:
      - Idle: "Arrastra tu archivo aquí o haz click para seleccionar"
      - Hover: Borde azul pulsante
      - Processing: Spinner con "Procesando..."
      - Success: Check verde con preview
      - Error: X rojo con mensaje de error
    
    Validaciones Previas:
      - Tipo de archivo: Solo .xlsx, .xls
      - Tamaño máximo: 10 MB
      - Extensión correcta
      - Archivo no corrupto
  
  Formato Esperado del Excel:
    
    Hoja: Primera hoja del workbook
    Headers: Primera fila
    
    Columnas Obligatorias (16):
      1. Client
      2. Country
      3. Tracking Number (identificador único)
      4. Weight (en gramos)
      5. Value (valor declarado)
      6. Buyer Normalized ID
      7. Buyer (nombre del comprador)
      8. Buyer Address1 (calle)
      9. Buyer Address1 Number (número)
      10. Buyer Address2 (piso/depto - opcional en data)
      11. Buyer City
      12. Buyer State (provincia)
      13. Buyer Location (barrio/localidad)
      14. Buyer ZIP (código postal)
      15. Buyer Phone
      16. Buyer Email
    
    Validaciones de Datos:
      - Tracking Number: No vacío, único en el archivo
      - Weight: Numérico positivo
      - Value: Numérico positivo
      - Buyer City: No vacío
      - Buyer ZIP: Formato de CP argentino
      - Todas las columnas deben existir
      - Al menos 1 fila de datos
    
    Ejemplo de Fila:
      ```
      MLA | AR | MLAR00012345 | 500 | 15000 | 123456789 | 
      Juan Pérez | Av. Corrientes | 1234 | Piso 5 Dto A | 
      CABA | Buenos Aires | Balvanera | 1414 | 
      +54 11 1234-5678 | juan.perez@email.com
      ```
  
  Vista Previa:
    Trigger: Archivo cargado y validado
    
    Contenido:
      - Tabla con primeras 5 filas
      - Todas las 16 columnas visibles (scroll horizontal)
      - Coloreado de columnas para fácil lectura
      - Resumen:
          Total de filas: N
          Trackings únicos: N
          Peso total: X kg
          Valor total: $X
      
      - Alertas:
          ⚠️ Duplicados encontrados: X trackings
          ⚠️ Datos faltantes: X filas incompletas
          ⚠️ Formatos incorrectos: X errores
    
    Acciones:
      - ✅ Confirmar y Continuar (si no hay errores)
      - 🔄 Subir Otro Archivo
      - ❌ Cancelar
  
  Procesamiento Backend:
    
    API: POST /api/vms/pre-alerta/upload
    
    Flujo:
      1. Recibir archivo multipart/form-data
      2. Parsear Excel con librería xlsx
      3. Validar estructura (16 columnas)
      4. Validar datos fila por fila
      5. Detectar duplicados
      6. Crear Shipment record (si es nuevo)
      7. Insertar registros en tabla PreAlerta
      8. Vincular con shipmentId
      9. Retornar resumen + shipmentId
    
    Respuesta Exitosa:
      ```json
      {
        "success": true,
        "shipmentId": "ship-abc-123",
        "summary": {
          "totalRows": 150,
          "uniqueTrackings": 150,
          "totalWeight": 75000,
          "totalValue": 2250000,
          "duplicates": 0,
          "errors": []
        }
      }
      ```
    
    Respuesta con Errores:
      ```json
      {
        "success": false,
        "errors": [
          {
            "row": 15,
            "column": "Tracking Number",
            "error": "Valor vacío"
          },
          {
            "row": 23,
            "column": "Weight",
            "error": "Debe ser un número"
          }
        ]
      }
      ```
  
  Datos Guardados en BD:
    Tabla: PreAlerta
    Por cada fila del Excel:
      - shipmentId (FK)
      - client
      - country
      - trackingNumber (indexed, unique per shipment)
      - weight (float)
      - value (float)
      - buyerNormalizedId
      - buyer (nombre completo)
      - buyerAddress1
      - buyerAddress1Number
      - buyerAddress2 (nullable)
      - buyerCity
      - buyerState
      - buyerLocation
      - buyerZip
      - buyerPhone
      - buyerEmail
      - verified (boolean, default false)
      - verificationStatus (nullable)
      - createdAt (timestamp)
    
    Índices:
      - (shipmentId, trackingNumber) UNIQUE
      - trackingNumber
      - shipmentId
  
  Transición al Paso 2:
    Condición: Archivo procesado exitosamente
    Acción: 
      - Guardar shipmentId en contexto del wizard
      - Cambiar status del shipment a 'PRE_ALERTA'
      - Navegar a paso 2
      - Mostrar toast: "Pre-alerta cargada: 150 paquetes"
```

#### PASO 2: Pre-Ruteo

**Objetivo**: Cargar archivo Excel con el ruteo planificado

```yaml
Interface del Paso:
  
  Similar al Paso 1:
    - Zona de drag & drop
    - Validación de archivo
    - Vista previa
    - Confirmación
  
  Diferencias Clave:
    - Requiere que Paso 1 esté completo
    - Asociado al mismo shipmentId
    - Diferentes columnas esperadas
    - Permite cruce de datos con Pre-Alerta
  
  Formato Esperado del Excel:
    
    Columnas Obligatorias (16):
      1. Código cliente
      2. Razón social
      3. Domicilio
      4. Tipo de Cliente
      5. Fecha de Reparto (fecha)
      6. Codigo Reparto
      7. Máquina (opcional)
      8. Chofer (nombre del chofer)
      9. Fecha De Pedido (fecha)
      10. Codigo de Pedido (= Tracking Number)
      11. Ventana Horaria (ej: "09:00-12:00")
      12. Arribo (datetime, opcional)
      13. Partida (datetime, opcional)
      14. Peso (kg) (numérico)
      15. Volumen (m3) (numérico, opcional)
      16. Dinero ($) (numérico, opcional)
      17. Ruta (ej: "R01", "RUTA-A") ⭐ IMPORTANTE
    
    Validaciones:
      - Codigo de Pedido: Debe coincidir con Tracking Numbers
      - Fecha de Reparto: Fecha válida
      - Peso: Numérico positivo
      - Chofer: No vacío
      - Al menos 1 fila
    
    Procesamiento de Fechas:
      Problema: Excel guarda fechas como números seriales
      Ejemplo: 45287 = 24/10/2024
      
      Solución:
        - Detectar tipo de celda
        - Si es número > 40000, convertir de serial Excel
        - Si es string, parsear con date-fns
        - Validar rango razonable
    
    Ejemplo de Fila:
      ```
      CLI001 | Juan Pérez | Av. Corrientes 1234 | Particular |
      24/10/2024 | REP001 | MAQ-01 | Carlos Gómez |
      23/10/2024 | MLAR00012345 | 09:00-12:00 |
      24/10/2024 09:30 | 24/10/2024 10:15 | 0.5 | 0.01 | 15000 |
      R01
      ```
  
  Vista Previa Mejorada:
    
    Tabla de Preview:
      - Primeras 5 filas
      - Highlight de Codigo de Pedido (tracking)
      - Indicador de match con Pre-Alerta
    
    Análisis de Cruce:
      Automático al cargar:
        - Trackings en ambos archivos: ✅ OK
        - Trackings solo en Pre-Alerta: ⚠️ Fuera de Cobertura
        - Trackings solo en Pre-Ruteo: ℹ️ Previo (paquete anterior)
      
      Resumen:
        ```
        📊 Análisis de Coincidencias:
        
        ✅ En ambos archivos: 145 (96.7%)
        ⚠️ Solo en Pre-Alerta: 5 (3.3%)
        ℹ️ Solo en Pre-Ruteo: 3 (2.0%)
        
        Total Pre-Alerta: 150
        Total Pre-Ruteo: 148
        ```
    
    Alertas:
      - Si >10% solo en Pre-Alerta:
          "⚠️ Alta cantidad de paquetes fuera de cobertura"
      
      - Si hay trackings en Pre-Ruteo no en Pre-Alerta:
          "ℹ️ Hay X paquetes que parecen ser de envíos anteriores"
  
  Procesamiento Backend:
    
    API: POST /api/vms/pre-ruteo/upload
    
    Flujo:
      1. Validar que shipmentId existe
      2. Validar que pertenece al proveedor del usuario
      3. Parsear Excel
      4. Convertir fechas de formato Excel a ISO
      5. Validar estructura
      6. Insertar en tabla PreRuteo
      7. Realizar análisis de cruce
      8. Actualizar shipment.status = 'PRE_RUTEO'
      9. Retornar resumen con análisis
    
    Respuesta:
      ```json
      {
        "success": true,
        "summary": {
          "totalRows": 148,
          "matchedWithPreAlerta": 145,
          "onlyInPreAlerta": 5,
          "onlyInPreRuteo": 3
        },
        "analysis": {
          "okPercentage": 96.7,
          "fueraCoberturaPercentage": 3.3,
          "previoPercentage": 2.0
        }
      }
      ```
  
  Datos Guardados en BD:
    Tabla: PreRuteo
    Por cada fila:
      - shipmentId (FK)
      - codigoCliente
      - razonSocial
      - domicilio
      - tipoCliente
      - fechaReparto (date)
      - codigoReparto
      - maquina (nullable)
      - chofer
      - fechaPedido (date)
      - codigoPedido (= tracking, indexed)
      - ventanaHoraria
      - arribo (datetime, nullable)
      - partida (datetime, nullable)
      - pesoKg (float)
      - volumenM3 (float, nullable)
      - dinero (float, nullable)
      - ruta (string) ⭐
      - verified (boolean)
      - verificationStatus (nullable)
      - createdAt
    
    Índices:
      - (shipmentId, codigoPedido) UNIQUE
      - codigoPedido
      - shipmentId
  
  Transición al Paso 3:
    Condición: Pre-Ruteo cargado exitosamente
    Acción:
      - Actualizar shipment.status = 'PRE_RUTEO'
      - Navegar a paso 3 (Verificación)
      - Mostrar resumen de análisis
```

#### PASO 3: Verificación (Escaneo)

**Objetivo**: Escanear paquetes físicos y verificar contra los dos archivos

```yaml
Interface del Paso:
  
  Diseño: Full screen scanning experience
  Optimizado para: Tablets con pistolas escáner
  
  Layout:
    ┌────────────────────────────────────────┐
    │  Header: Estadísticas en Tiempo Real   │
    ├────────────────────────────────────────┤
    │                                        │
    │   [Flash Screen de Resultado]          │ ← Aparece 2seg
    │                                        │
    ├────────────────────────────────────────┤
    │  Input de Escaneo (siempre enfocado)   │
    ├────────────────────────────────────────┤
    │  Historial de Escaneos Recientes       │
    │  (últimos 10)                          │
    ├────────────────────────────────────────┤
    │  [Botón Finalizar Escaneo]             │
    └────────────────────────────────────────┘
  
  Header con Estadísticas en Vivo:
    
    4 Contadores Grandes:
      
      1. ✅ OK (Verde):
         Número: Cantidad de paquetes OK
         Porcentaje: Del total de Pre-Alerta
         Animación: +1 con efecto bounce
      
      2. 🔴 SOBRANTE (Rojo):
         Número: Paquetes no en ningún archivo
         Porcentaje: Del total escaneado
         Alerta: Si >5%
      
      3. 🟡 FUERA COBERTURA (Amarillo):
         Número: En Pre-Alerta, NO en Pre-Ruteo
         Porcentaje: Del total de Pre-Alerta
         Info: No se pueden entregar
      
      4. 🔵 PREVIO (Azul):
         Número: En Pre-Ruteo, NO en Pre-Alerta
         Porcentaje: Del total escaneado
         Info: Paquetes de envíos anteriores
    
    Progreso General:
      Barra: Escaneados / Total Pre-Alerta
      Ejemplo: "145/150 (96.7%)"
      Color: Verde si >95%, Amarillo si >80%, Rojo si <80%
  
  Input de Escaneo:
    
    Características:
      - Siempre con foco automático
      - Tipo: text (no number para soportar letras)
      - Autocomplete: off
      - Autofocus: true
      - Font: Monospace, grande (24px)
      - Border: Grueso, azul brillante
      - Placeholder: "Escanea o escribe tracking..."
    
    Comportamiento:
      1. Pistola escánea código de barras
      2. Input recibe string (ej: "MLAR00012345")
      3. Usuario presiona ENTER (o escanéo envía enter automático)
      4. Se dispara evento handleScan()
      5. Input se limpia automáticamente
      6. Foco vuelve al input
    
    Validaciones Previas:
      - No vacío
      - Trim de espacios
      - Uppercase automático
      - Validar prefijos: MLAR, SEKA, RR
      - Si no tiene prefijo válido: Error "Paquete no de MLA"
    
    Manejo de Duplicados:
      - Verificar si ya fue escaneado en este shipment
      - Si Sí: Flash rojo "YA ESCANEADO"
      - Si No: Procesar normalmente
  
  Flash Screen de Resultado:
    
    Concepto: Feedback visual instantáneo a pantalla completa
    Duración: 2 segundos
    Overlay: Semi-transparente sobre toda la pantalla
    
    Estados Posibles:
      
      1. ✅ OK (Fondo Verde):
         Diseño:
           - Ícono: ✓ gigante (200px)
           - Texto: "OK" en font 80px
           - Tracking: En font 40px
           - Detalles:
               "📦 Pre-Alerta: Juan Pérez • CABA • 0.5kg"
               "🚚 Pre-Ruteo: Ruta R01 • Chofer: Carlos"
         Sonido: Beep de éxito
      
      2. 🔴 SOBRANTE (Fondo Rojo):
         Diseño:
           - Ícono: ✗ gigante
           - Texto: "SOBRANTE"
           - Tracking: Destacado
           - Mensaje: "No está en ningún archivo"
         Sonido: Beep de error (doble)
      
      3. 🟡 FUERA COBERTURA (Fondo Amarillo):
         Diseño:
           - Ícono: ⚠ gigante
           - Texto: "FUERA DE COBERTURA"
           - Tracking: Destacado
           - Mensaje: "Está en Pre-Alerta pero NO en Pre-Ruteo"
           - Detalle: Dirección del comprador
         Sonido: Beep de advertencia
      
      4. 🔵 PREVIO (Fondo Azul):
         Diseño:
           - Ícono: 🕐 gigante
           - Texto: "PREVIO"
           - Tracking: Destacado
           - Mensaje: "En Pre-Ruteo pero NO en Pre-Alerta"
           - Detalle: Info del Pre-Ruteo
         Sonido: Beep neutral
      
      5. 🟠 YA ESCANEADO (Fondo Naranja):
         Diseño:
           - Ícono: 🔁
           - Texto: "PAQUETE YA ESCANEADO"
           - Tracking: Destacado
           - Timestamp: "Escaneado hace 5 minutos por ti"
         Sonido: Doble beep
      
      6. 🟣 NO MLA (Fondo Púrpura):
         Diseño:
           - Ícono: 🚫
           - Texto: "PAQUETE NO DE MLA"
           - Tracking: El que se escaneó
           - Mensaje: "Solo se aceptan MLAR, SEKA o RR"
         Sonido: Beep de rechazo
    
    Animación:
      - Fade in: 200ms
      - Permanencia: 2 segundos
      - Fade out: 300ms
      - Durante el flash: Input bloqueado
      - Después del flash: Vuelve el foco al input
  
  Lógica de Verificación (Backend):
    
    API: POST /api/vms/verification/scan
    Body: { shipmentId, trackingNumber }
    
    Algoritmo:
      ```typescript
      1. Validar tracking (prefijo MLAR/SEKA/RR)
      2. Buscar en tabla ScannedPackage:
         - WHERE shipmentId = X AND trackingNumber = Y
         - Si existe: Return { status: 'YA_ESCANEADO' }
      
      3. Buscar en paralelo:
         const preAlerta = await findPreAlerta(shipmentId, tracking)
         const preRuteo = await findPreRuteo(shipmentId, tracking)
      
      4. Determinar status:
         if (preAlerta && preRuteo) {
           status = 'OK'
         } else if (!preAlerta && !preRuteo) {
           status = 'SOBRANTE'
         } else if (preAlerta && !preRuteo) {
           status = 'FUERA_COBERTURA'
         } else if (!preAlerta && preRuteo) {
           status = 'PREVIO'
         }
      
      5. Crear registro ScannedPackage:
         await prisma.scannedPackage.create({
           shipmentId,
           trackingNumber,
           scannedBy: session.user.id,
           status,
           preAlertaId: preAlerta?.id || null,
           preRuteoId: preRuteo?.id || null,
           scanTimestamp: new Date()
         })
      
      6. Actualizar verified flags:
         if (preAlerta) {
           await updatePreAlerta(preAlerta.id, { 
             verified: true, 
             verificationStatus: status 
           })
         }
         if (preRuteo) {
           await updatePreRuteo(preRuteo.id, { 
             verified: true, 
             verificationStatus: status 
           })
         }
      
      7. Return:
         {
           success: true,
           status: 'OK',
           details: {
             preAlerta: { buyer, city, weight },
             preRuteo: { chofer, ruta }
           }
         }
      ```
    
    Respuesta:
      ```json
      {
        "success": true,
        "status": "OK",
        "trackingNumber": "MLAR00012345",
        "details": {
          "preAlerta": {
            "buyer": "Juan Pérez",
            "city": "CABA",
            "weight": 500
          },
          "preRuteo": {
            "chofer": "Carlos Gómez",
            "ruta": "R01"
          }
        },
        "timestamp": "2025-10-24T14:30:00Z"
      }
      ```
  
  Historial de Escaneos Recientes:
    
    Diseño: Lista vertical, últimos 10 escaneos
    
    Cada Item:
      - Tracking number (monospace)
      - Status (badge con color)
      - Timestamp relativo ("hace 30 seg")
      - Ícono según status
      - Detalles resumidos
      - Opción: Ver detalle completo (modal)
    
    Ejemplo:
      ```
      ┌─────────────────────────────────────────────┐
      │ ✅ MLAR00012345          hace 10 seg        │
      │    OK • Ruta R01 • Carlos Gómez            │
      ├─────────────────────────────────────────────┤
      │ 🟡 SEKA00098765          hace 1 min         │
      │    FUERA COBERTURA • Juan Pérez - CABA     │
      ├─────────────────────────────────────────────┤
      │ ✅ MLAR00012346          hace 2 min         │
      │    OK • Ruta R01 • Carlos Gómez            │
      └─────────────────────────────────────────────┘
      ```
    
    Funcionalidades:
      - Auto-scroll: Último escaneo siempre visible
      - Clear All: Botón para limpiar historial visual
      - Export: Exportar historial a Excel
  
  Botón Finalizar Escaneo:
    
    Ubicación: Fijo en bottom de pantalla
    Diseño: Grande, verde, prominente
    Texto: "Finalizar Escaneo y Ver Reporte"
    
    Confirmación:
      Modal:
        Título: "¿Finalizar verificación?"
        Mensaje:
          "Se han escaneado X de Y paquetes (Z%)"
          
          Resumen:
          - ✅ OK: 145
          - 🔴 Sobrante: 2
          - 🟡 Fuera Cobertura: 5
          - 🔵 Previo: 3
          
          "¿Confirmar finalización?"
        
        Acciones:
          - Confirmar (primary)
          - Continuar Escaneando (secondary)
    
    Proceso al Finalizar:
      1. API: POST /api/vms/verification/finalize
      2. Actualizar shipment.status = 'FINALIZADO'
      3. Registrar shipment.finalizedAt = now()
      4. Generar reporte preliminar
      5. Redirigir a Paso 4 (Reporte)
```

#### PASO 4: Reporte Final

**Objetivo**: Visualizar resultados y descargar reporte Excel completo

```yaml
Interface del Paso:
  
  Header:
    - Título: "Reporte de Verificación"
    - Shipment ID: Destacado
    - Fecha: Formato completo
    - Proveedor: Logo + nombre
    - Estado: Badge "FINALIZADO" verde
  
  Sección 1: Resumen Ejecutivo
    
    Tarjetas de KPIs (4):
      
      1. Total Escaneado:
         Número grande: 155
         Porcentaje: 103% del Pre-Alerta
         Tendencia: Flecha verde si >90%
      
      2. Paquetes OK:
         Número: 145
         Porcentaje: 93.5%
         Color: Verde
         Gráfico: Donut chart
      
      3. Incidencias:
         Número: 10
         Porcentaje: 6.5%
         Color: Amarillo/Rojo según severity
         Desglose:
           - Sobrantes: 2
           - Fuera Cobertura: 5
           - Previos: 3
      
      4. Paquetes Sin Escanear:
         Número: 5 (de 150 en Pre-Alerta)
         Porcentaje: 3.3%
         Estado: Faltantes
         Color: Naranja
         Acción: Ver lista
  
  Sección 2: Gráficos de Distribución
    
    Gráfico 1: Pie Chart de Estados
      Datos:
        - OK: 145 (93.5%) - Verde
        - Sobrante: 2 (1.3%) - Rojo
        - Fuera Cobertura: 5 (3.2%) - Amarillo
        - Previo: 3 (1.9%) - Azul
      
      Interactive: Hover muestra cantidad y porcentaje
      Click: Filtra tabla de detalle
    
    Gráfico 2: Barra de Progreso
      Visual:
        [████████████████░░] 145/150 (96.7%)
      Colores:
        - Verde: Escaneados
        - Gris: Pendientes
      Labels: Números grandes
  
  Sección 3: Tabla de Detalle
    
    Tabs:
      1. ✅ Paquetes OK
      2. 🔴 Sobrantes
      3. 🟡 Fuera de Cobertura
      4. 🔵 Previos
      5. ❓ Faltantes (sin escanear)
    
    Tab "Paquetes OK":
      Columnas:
        - Tracking Number
        - Cliente (de Pre-Alerta)
        - Ciudad
        - Ruta (de Pre-Ruteo)
        - Chofer
        - Hora de Escaneo
        - Escaneado Por
      
      Datos:
        - 145 filas
        - Ordenable por cualquier columna
        - Búsqueda en tiempo real
        - Export a Excel
    
    Tab "Sobrantes":
      Columnas:
        - Tracking Number
        - Hora de Escaneo
        - Escaneado Por
        - Acciones Recomendadas
      
      Mensaje:
        "⚠️ Estos paquetes NO estaban en Pre-Alerta ni en Pre-Ruteo"
      
      Acción:
        - Investigar origen
        - Reportar a ML
        - Devolver a remitente
    
    Tab "Fuera de Cobertura":
      Columnas:
        - Tracking Number
        - Cliente
        - Dirección
        - Ciudad
        - CP
        - Hora de Escaneo
      
      Mensaje:
        "📍 Estos paquetes están en Pre-Alerta pero NO en Pre-Ruteo
         (no se pueden entregar, fuera de zona de cobertura)"
      
      Datos de Pre-Alerta: Completos
      Acción:
        - Coordinar con otra logística
        - Informar a ML
        - Reasignar a otro proveedor
    
    Tab "Previos":
      Columnas:
        - Tracking Number
        - Ruta
        - Chofer
        - Fecha de Reparto Planificada
        - Hora de Escaneo
      
      Mensaje:
        "🕐 Estos paquetes están en Pre-Ruteo pero NO en Pre-Alerta
         (probablemente son de envíos anteriores que quedaron pendientes)"
      
      Datos de Pre-Ruteo: Completos
      Acción:
        - Verificar si son devoluciones
        - Chequear estado en ML
        - Incluir en próximo envío
    
    Tab "Faltantes":
      Columnas:
        - Tracking Number (de Pre-Alerta)
        - Cliente
        - Ciudad
        - Dirección
        - Estado
      
      Mensaje:
        "❓ Estos paquetes estaban en Pre-Alerta pero NO fueron escaneados
         (pueden faltar físicamente o no haber llegado)"
      
      Datos: Solo de Pre-Alerta
      Acción:
        - Buscar físicamente
        - Verificar con ML
        - Reportar faltante
        - Investigar
  
  Sección 4: Acciones y Exportación
    
    Botones Principales:
      
      1. 📥 Descargar Reporte Completo (Excel):
         Acción: GET /api/vms/reports/export?shipmentId=X
         
         Archivo: shipment-[ID]-[FECHA].xlsx
         
         Hojas del Excel:
           
           Hoja 1: "Resumen"
             - Información del shipment
             - Proveedor
             - Fecha
             - Total Pre-Alerta
             - Total Pre-Ruteo
             - Total Escaneado
             - Distribución por estado
             - Gráfico embebido (opcional)
           
           Hoja 2: "Todos los Paquetes"
             Columnas combinadas:
               - Tracking Number
               - Estado de Verificación
               - Cliente (Pre-Alerta)
               - Ciudad (Pre-Alerta)
               - Dirección (Pre-Alerta)
               - CP (Pre-Alerta)
               - Peso (Pre-Alerta)
               - Ruta (Pre-Ruteo)
               - Chofer (Pre-Ruteo)
               - Fecha Reparto (Pre-Ruteo)
               - Escaneado (Sí/No)
               - Hora de Escaneo
               - Escaneado Por
             
             Filas: TODOS los trackings únicos
               - De Pre-Alerta
               - De Pre-Ruteo
               - Escaneados que no estaban
             
             Coloreado:
               - Verde: OK
               - Rojo: Sobrante
               - Amarillo: Fuera Cobertura
               - Azul: Previo
               - Gris: Faltante
           
           Hoja 3: "Paquetes OK"
             - Solo los 145 OK
             - Datos completos
           
           Hoja 4: "Incidencias"
             - Sobrantes
             - Fuera de Cobertura
             - Previos
             - Faltantes
             - Con detalles y acciones recomendadas
      
      2. 🖨️ Imprimir Reporte (PDF):
         Acción: Abrir vista de impresión
         Formato: A4, orientación horizontal
         Contenido:
           - Resumen ejecutivo
           - Gráficos
           - Tabla de incidencias
      
      3. 📧 Enviar por Email:
         Modal:
           - Destinatarios (multi-input)
           - Asunto (pre-llenado)
           - Mensaje (opcional)
           - Adjuntar Excel
         Acción: Enviar email con reporte adjunto
      
      4. 🔄 Nuevo Envío:
         Acción: Redirige al Paso 1 del wizard
         Limpia contexto actual
         Inicia proceso nuevo
      
      5. 📋 Ver Todos los Envíos:
         Acción: Redirige a /vms/shipments
         Lista completa de histórico
  
  Notas de Implementación:
    
    Generación del Excel:
      - Librería: xlsx (SheetJS)
      - Server-side rendering
      - Procesamiento en background para grandes volúmenes
      - Caché de 5 minutos
    
    Performance:
      - Cargar datos paginados en frontend
      - Índices optimizados en queries
      - Uso de selects específicos (no SELECT *)
    
    Auditoría:
      - Log de cada descarga de reporte
      - Registro de usuario que descarga
      - Timestamp de generación
```

### 4.3 Listado de Envíos (Historial)

**Ruta**: `/vms/shipments`  
**Propósito**: Ver historial completo de envíos del proveedor

```yaml
Vista de Lista:
  
  Filtros:
    - Por Estado (dropdown multi-select)
    - Por Rango de Fechas (date range picker)
    - Por ID de Envío (búsqueda)
    - Ordenamiento: Más recientes primero
  
  Tabla de Envíos:
    Columnas:
      1. ID de Envío
      2. Fecha de Creación
      3. Estado (badge)
      4. Pre-Alertas Cargadas
      5. Pre-Ruteos Cargados
      6. Paquetes Escaneados
      7. Porcentaje de Completitud
      8. Incidencias
      9. Acciones
    
    Por Fila:
      - Click: Ver detalle completo
      - Hover: Highlight
      - Acciones:
          • Ver Reporte (si finalizado)
          • Continuar Escaneo (si en verificación)
          • Descargar Excel
          • Eliminar (solo admins)
  
  Paginación: 20 por página
  
  Métricas Agregadas (Top):
    - Total de Envíos
    - Envíos Este Mes
    - Promedio de Paquetes por Envío
    - Tasa de Incidencias Promedio
```

---

_[El documento continúa con GIS, Sistema de Usuarios, Notificaciones, etc. - Parte 3]_
