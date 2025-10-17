# 🔧 Guía de APIs del Módulo VMS

Esta guía muestra cómo usar las APIs del módulo VMS mediante ejemplos con `curl` y JavaScript.

---

## 🔐 Autenticación

Todas las APIs requieren autenticación mediante NextAuth. El usuario debe tener rol `vms` o `admin`.

---

## 📋 APIs Disponibles

### 1. Upload Pre-Alerta

**Endpoint:** `POST /api/vms/pre-alerta/upload`

**Descripción:** Sube un archivo Excel con las pre-alertas de paquetes.

**Body:** FormData con el archivo

**Ejemplo con curl:**
```bash
curl -X POST http://localhost:3000/api/vms/pre-alerta/upload \
  -H "Cookie: next-auth.session-token=TU_TOKEN" \
  -F "file=@/path/to/prealerta.xlsx"
```

**Ejemplo con JavaScript:**
```javascript
const formData = new FormData()
formData.append('file', fileInput.files[0])

const response = await fetch('/api/vms/pre-alerta/upload', {
  method: 'POST',
  body: formData,
})

const result = await response.json()
console.log(result)
// {
//   shipmentId: "clx123abc",
//   count: 150,
//   message: "Pre-alerta cargada exitosamente"
// }
```

---

### 2. Upload Pre-Ruteo

**Endpoint:** `POST /api/vms/pre-ruteo/upload`

**Descripción:** Sube un archivo Excel con el pre-ruteo.

**Body:** FormData con el archivo y shipmentId

**Ejemplo con JavaScript:**
```javascript
const formData = new FormData()
formData.append('file', fileInput.files[0])
formData.append('shipmentId', 'clx123abc')

const response = await fetch('/api/vms/pre-ruteo/upload', {
  method: 'POST',
  body: formData,
})

const result = await response.json()
console.log(result)
// {
//   shipmentId: "clx123abc",
//   count: 145,
//   message: "Pre-ruteo cargado exitosamente"
// }
```

---

### 3. Escanear Paquete

**Endpoint:** `POST /api/vms/verification/scan`

**Descripción:** Escanea un paquete individual y determina su estado.

**Body:** JSON
```json
{
  "shipmentId": "clx123abc",
  "trackingNumber": "ML123456789"
}
```

**Ejemplo con JavaScript:**
```javascript
const response = await fetch('/api/vms/verification/scan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    shipmentId: 'clx123abc',
    trackingNumber: 'ML123456789'
  })
})

const result = await response.json()
console.log(result)
// {
//   status: "OK",
//   details: {
//     preAlerta: {
//       buyer: "Juan Perez",
//       city: "Buenos Aires",
//       weight: 2.5
//     },
//     preRuteo: {
//       razonSocial: "Juan Perez",
//       domicilio: "Av Corrientes 1234",
//       chofer: "Roberto Lopez"
//     }
//   },
//   scannedPackage: { ... }
// }
```

**Estados Posibles:**
- `OK` - Está en ambos archivos
- `SOBRANTE` - No está en ninguno
- `FUERA_COBERTURA` - Solo en Pre-Alerta
- `PREVIO` - Solo en Pre-Ruteo

---

### 4. Finalizar Verificación

**Endpoint:** `POST /api/vms/verification/finalize`

**Descripción:** Marca el shipment como finalizado.

**Body:** JSON
```json
{
  "shipmentId": "clx123abc"
}
```

**Ejemplo con JavaScript:**
```javascript
const response = await fetch('/api/vms/verification/finalize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    shipmentId: 'clx123abc'
  })
})

const result = await response.json()
console.log(result)
// {
//   message: "Verificación finalizada exitosamente",
//   shipmentId: "clx123abc"
// }
```

---

### 5. Listar Shipments

**Endpoint:** `GET /api/vms/shipments`

**Descripción:** Lista todos los shipments del proveedor.

**Ejemplo con curl:**
```bash
curl -X GET http://localhost:3000/api/vms/shipments \
  -H "Cookie: next-auth.session-token=TU_TOKEN"
```

**Ejemplo con JavaScript:**
```javascript
const response = await fetch('/api/vms/shipments')
const result = await response.json()
console.log(result)
// {
//   shipments: [
//     {
//       id: "clx123abc",
//       providerId: "clp456def",
//       status: "FINALIZADO",
//       shipmentDate: "2025-10-17T10:00:00.000Z",
//       _count: {
//         preAlertas: 150,
//         preRuteos: 145,
//         scannedPackages: 148
//       },
//       provider: {
//         id: "clp456def",
//         name: "Proveedor ABC"
//       }
//     },
//     ...
//   ],
//   totalPackages: 500,
//   okPackages: 450,
//   issuesPackages: 50
// }
```

---

### 6. Obtener Reporte de Shipment

**Endpoint:** `GET /api/vms/shipments/{id}/report`

**Descripción:** Obtiene el reporte detallado de un shipment.

**Ejemplo con JavaScript:**
```javascript
const shipmentId = 'clx123abc'
const response = await fetch(`/api/vms/shipments/${shipmentId}/report`)
const result = await response.json()
console.log(result)
// {
//   totalScanned: 148,
//   ok: 140,
//   sobrante: 3,
//   fueraCobertura: 5,
//   previo: 0,
//   details: [
//     {
//       id: "cls789xyz",
//       trackingNumber: "ML123456789",
//       status: "OK",
//       scanTimestamp: "2025-10-17T14:30:00.000Z",
//       preAlerta: { ... },
//       preRuteo: { ... }
//     },
//     ...
//   ]
// }
```

---

### 7. Exportar Reporte a Excel

**Endpoint:** `GET /api/vms/reports/export?shipmentId={id}`

**Descripción:** Genera y descarga un archivo Excel con el reporte completo.

**Ejemplo con curl:**
```bash
curl -X GET "http://localhost:3000/api/vms/reports/export?shipmentId=clx123abc" \
  -H "Cookie: next-auth.session-token=TU_TOKEN" \
  -o reporte.xlsx
```

**Ejemplo con JavaScript:**
```javascript
const shipmentId = 'clx123abc'
const response = await fetch(`/api/vms/reports/export?shipmentId=${shipmentId}`)
const blob = await response.blob()

// Descargar el archivo
const url = window.URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = `reporte-${shipmentId}.xlsx`
document.body.appendChild(a)
a.click()
window.URL.revokeObjectURL(url)
document.body.removeChild(a)
```

**El Excel contiene 2 hojas:**
1. **Verificación**: Todos los paquetes con detalles completos
2. **Resumen**: Estadísticas y porcentajes

---

## 🔄 Flujo Completo de Uso

### Ejemplo Completo con JavaScript

```javascript
// 1. Crear un nuevo shipment subiendo Pre-Alerta
const uploadPreAlerta = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  
  const res = await fetch('/api/vms/pre-alerta/upload', {
    method: 'POST',
    body: formData,
  })
  
  const data = await res.json()
  return data.shipmentId
}

// 2. Subir Pre-Ruteo
const uploadPreRuteo = async (shipmentId, file) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('shipmentId', shipmentId)
  
  await fetch('/api/vms/pre-ruteo/upload', {
    method: 'POST',
    body: formData,
  })
}

// 3. Escanear múltiples paquetes
const scanPackage = async (shipmentId, trackingNumber) => {
  const res = await fetch('/api/vms/verification/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shipmentId, trackingNumber })
  })
  
  const data = await res.json()
  return data.status // OK, SOBRANTE, FUERA_COBERTURA, PREVIO
}

// 4. Finalizar el proceso
const finalizeShipment = async (shipmentId) => {
  await fetch('/api/vms/verification/finalize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shipmentId })
  })
}

// 5. Obtener y descargar reporte
const downloadReport = async (shipmentId) => {
  const res = await fetch(`/api/vms/reports/export?shipmentId=${shipmentId}`)
  const blob = await res.blob()
  
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `reporte-${shipmentId}.xlsx`
  a.click()
}

// USO COMPLETO
async function procesarEnvio(preAlertaFile, preRuteoFile, trackingNumbers) {
  try {
    // 1. Upload Pre-Alerta
    console.log('Subiendo Pre-Alerta...')
    const shipmentId = await uploadPreAlerta(preAlertaFile)
    console.log('Shipment creado:', shipmentId)
    
    // 2. Upload Pre-Ruteo
    console.log('Subiendo Pre-Ruteo...')
    await uploadPreRuteo(shipmentId, preRuteoFile)
    console.log('Pre-Ruteo cargado')
    
    // 3. Escanear paquetes
    console.log('Escaneando paquetes...')
    const results = []
    for (const tn of trackingNumbers) {
      const status = await scanPackage(shipmentId, tn)
      results.push({ trackingNumber: tn, status })
      console.log(`${tn}: ${status}`)
    }
    
    // 4. Finalizar
    console.log('Finalizando...')
    await finalizeShipment(shipmentId)
    
    // 5. Descargar reporte
    console.log('Descargando reporte...')
    await downloadReport(shipmentId)
    
    console.log('✅ Proceso completado!')
    return { shipmentId, results }
    
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}
```

---

## 🎯 Testing con Postman

### Collection para Postman

```json
{
  "info": {
    "name": "VMS APIs",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Upload Pre-Alerta",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/vms/pre-alerta/upload",
        "body": {
          "mode": "formdata",
          "formdata": [
            {
              "key": "file",
              "type": "file",
              "src": "/path/to/prealerta.xlsx"
            }
          ]
        }
      }
    },
    {
      "name": "Upload Pre-Ruteo",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/vms/pre-ruteo/upload",
        "body": {
          "mode": "formdata",
          "formdata": [
            {
              "key": "file",
              "type": "file",
              "src": "/path/to/preruteo.xlsx"
            },
            {
              "key": "shipmentId",
              "value": "{{shipmentId}}",
              "type": "text"
            }
          ]
        }
      }
    },
    {
      "name": "Scan Package",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/vms/verification/scan",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"shipmentId\": \"{{shipmentId}}\",\n  \"trackingNumber\": \"ML123456789\"\n}"
        }
      }
    },
    {
      "name": "Finalize Verification",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/vms/verification/finalize",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"shipmentId\": \"{{shipmentId}}\"\n}"
        }
      }
    },
    {
      "name": "List Shipments",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/vms/shipments"
      }
    },
    {
      "name": "Get Report",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/vms/shipments/{{shipmentId}}/report"
      }
    },
    {
      "name": "Export Report",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/vms/reports/export?shipmentId={{shipmentId}}"
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    },
    {
      "key": "shipmentId",
      "value": ""
    }
  ]
}
```

---

## ⚠️ Manejo de Errores

Todas las APIs retornan errores en formato JSON:

```javascript
{
  "error": "Mensaje de error descriptivo"
}
```

**Códigos de Error Comunes:**
- `401` - No autorizado (no hay sesión)
- `403` - Sin permisos (rol incorrecto)
- `400` - Datos inválidos
- `404` - Recurso no encontrado
- `500` - Error interno del servidor

**Ejemplo de Manejo:**
```javascript
const response = await fetch('/api/vms/pre-alerta/upload', {
  method: 'POST',
  body: formData,
})

if (!response.ok) {
  const error = await response.json()
  console.error('Error:', error.error)
  throw new Error(error.error)
}

const result = await response.json()
```

---

## 🔒 Seguridad

### Headers Requeridos

La autenticación se maneja automáticamente mediante cookies de NextAuth. No necesitas enviar headers adicionales si estás usando el mismo navegador.

### CORS

Las APIs están configuradas para aceptar peticiones del mismo origen. Para llamadas desde otro dominio, necesitarás configurar CORS en `next.config.mjs`.

---

## 📊 Rate Limiting

Actualmente no hay rate limiting implementado, pero se recomienda:
- Máximo 100 scans por minuto
- No hacer uploads simultáneos del mismo proveedor
- Esperar respuesta antes de siguiente scan

---

## 🎯 Tips de Uso

### Para Upload de Excel
- Validar el archivo antes de enviarlo
- Mostrar loading durante el upload
- Manejar archivos grandes con chunks (futuro)

### Para Escaneo
- Auto-focus en input para scanner
- Debounce de 500ms entre scans
- Mostrar feedback visual inmediato
- Guardar estado en localStorage

### Para Reportes
- Generar en segundo plano para archivos grandes
- Cachear resultados del reporte
- Comprimir Excel antes de descargar

---

**¡Las APIs están listas para usar! 🚀**
