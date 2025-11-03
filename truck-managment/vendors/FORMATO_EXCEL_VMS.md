# Ejemplos de Archivos Excel para VMS

Este documento describe el formato exacto de los archivos Excel que deben cargarse en el sistema VMS.

## 📄 Pre-Alerta Excel

### Columnas Requeridas (en este orden exacto):

1. **Client** - Nombre del cliente
2. **Country** - País
3. **Tracking Number** - Número de seguimiento único
4. **Weight** - Peso del paquete
5. **FOB** - Valor del paquete
6. **Buyer ID** - ID del comprador
7. **Buyer** - Nombre del comprador
8. **Buyer Address1** - Dirección principal
9. **Buyer Address1 Number** - Número de dirección
10. **Buyer Address2** - Dirección secundaria (opcional)
11. **Buyer City** - Ciudad
12. **Buyer State** - Provincia/Estado
13. **Buyer Location** - Localidad
14. **Buyer ZIP** - Código postal
15. **Buyer Phone** - Teléfono
16. **Buyer Email** - Email

### Ejemplo de Datos:

```
Client          | Country | Tracking Number | Weight | FOB | Buyer ID | Buyer      | Buyer Address1 | Buyer Address1 Number | Buyer Address2 | Buyer City     | Buyer State      | Buyer Location | Buyer ZIP | Buyer Phone    | Buyer Email
----------------|---------|-----------------|--------|-------|---------------------|------------|----------------|----------------------|---------------|----------------|------------------|---------------|-----------|----------------|------------------
MercadoLibre    | AR      | ML123456789     | 2.5    | 1500  | 12345678           | Juan Perez | Av Corrientes  | 1234                 |               | Buenos Aires   | Ciudad Autonoma  | Palermo       | 1414      | 1145678901     | juan@email.com
MercadoLibre    | AR      | ML987654321     | 1.2    | 800   | 87654321           | Ana Garcia | Calle Falsa    | 567                  | Piso 2        | Cordoba        | Cordoba          | Centro        | 5000      | 3514567890     | ana@email.com
```

### Notas Importantes:
- La primera fila DEBE contener los nombres de las columnas exactamente como se muestran
- El **Tracking Number** debe ser único
- Los campos numéricos (Weight, Value) deben ser números válidos
- Campos opcionales pueden estar vacíos pero la columna debe existir

---

## 📄 Pre-Ruteo Excel

### Columnas Requeridas (en este orden exacto):

1. **Código cliente** - Código del cliente
2. **Razón social** - Razón social del cliente
3. **Domicilio** - Dirección de entrega
4. **Tipo de Cliente** - Tipo de cliente
5. **Fecha de Reparto** - Fecha programada de reparto
6. **Codigo Reparto** - Código de reparto
7. **Máquina** - Identificación de la máquina/vehículo
8. **Chofer** - Nombre del chofer
9. **Fecha De Pedido** - Fecha del pedido
10. **Codigo de Pedido** - **IMPORTANTE: Este es el Tracking Number**
11. **Ventana Horaria** - Ventana horaria de entrega
12. **Arribo** - Hora de arribo
13. **Partida** - Hora de partida
14. **Peso (kg)** - Peso en kilogramos
15. **Volumen (m3)** - Volumen en metros cúbicos
16. **Dinero ($)** - Valor monetario

### Ejemplo de Datos:

```
Código cliente | Razón social      | Domicilio           | Tipo de Cliente | Fecha de Reparto | Codigo Reparto | Máquina | Chofer          | Fecha De Pedido | Codigo de Pedido | Ventana Horaria | Arribo   | Partida  | Peso (kg) | Volumen (m3) | Dinero ($)
---------------|-------------------|---------------------|-----------------|------------------|----------------|---------|-----------------|-----------------|------------------|----------------|----------|----------|-----------|--------------|------------
CLI001         | Juan Perez        | Av Corrientes 1234  | Residencial     | 17/10/2025       | REP001         | CAM01   | Roberto Lopez   | 16/10/2025      | ML123456789      | 09:00-12:00    | 09:30    | 09:45    | 2.5       | 0.05         | 1500
CLI002         | Ana Garcia        | Calle Falsa 567     | Comercial       | 17/10/2025       | REP001         | CAM01   | Roberto Lopez   | 16/10/2025      | ML987654321      | 14:00-18:00    | 15:20    | 15:35    | 1.2       | 0.03         | 800
```

### Notas Importantes:
- La primera fila DEBE contener los nombres de las columnas exactamente como se muestran
- El **Codigo de Pedido** debe coincidir con el **Tracking Number** de Pre-Alerta
- Las fechas pueden estar en formato DD/MM/YYYY o como fecha de Excel
- Campos opcionales pueden estar vacíos pero la columna debe existir

---

## 🔍 Lógica de Verificación

Cuando se escanea un paquete, el sistema busca el tracking number en ambos archivos:

### Estados Posibles:

| Estado | Condición | Significado |
|--------|-----------|-------------|
| **OK** | Está en Pre-Alerta Y en Pre-Ruteo | ✅ Todo correcto, paquete verificado |
| **Sobrante** | NO está en Pre-Alerta Y NO está en Pre-Ruteo | ❌ Paquete extra, no esperado |
| **Fuera de Cobertura** | Está en Pre-Alerta pero NO en Pre-Ruteo | ⚠️ No se puede entregar, fuera de ruta |
| **Previo** | NO está en Pre-Alerta pero SÍ en Pre-Ruteo | 🔵 Paquete de envío anterior |

---

## 💡 Tips para Preparar los Archivos

### 1. Formato del Archivo
- Usar Excel (.xlsx o .xls)
- Evitar macros o fórmulas complejas
- Guardar con los datos en la primera hoja

### 2. Datos Limpios
- Sin espacios extra al inicio o final de los tracking numbers
- Fechas en formato consistente
- Números sin símbolos de moneda ni unidades

### 3. Validación Previa
- Verificar que todos los tracking numbers sean únicos
- Revisar que no haya filas vacías entre datos
- Confirmar que los encabezados coincidan exactamente

### 4. Tamaño
- No hay límite teórico de filas
- Probado con hasta 100,000+ paquetes
- Para archivos muy grandes (>50MB), considerar dividir en lotes

---

## 🚨 Errores Comunes

### Error: "Falta la columna requerida: X"
**Causa**: El nombre de la columna no coincide exactamente
**Solución**: Copiar y pegar los nombres de columna de este documento

### Error: "El archivo está vacío"
**Causa**: No hay datos después de la fila de encabezados
**Solución**: Verificar que haya al menos una fila de datos

### Error: "Tracking number duplicado"
**Causa**: El mismo tracking number aparece dos veces en el archivo
**Solución**: Eliminar duplicados antes de cargar

### Paquetes marcados como SOBRANTE incorrectamente
**Causa**: El tracking number tiene espacios o caracteres extra
**Solución**: Limpiar datos, asegurar coincidencia exacta entre archivos

---

## 📊 Plantillas de Excel

### Crear tu propia plantilla:

1. Abre Excel
2. En la primera fila, escribe los nombres de las columnas EXACTAMENTE como se muestran arriba
3. Llena los datos desde la fila 2 en adelante
4. Guarda como .xlsx

### Validar tu archivo:

1. Abre el archivo en Excel
2. Verifica que la primera fila tenga todos los encabezados
3. Revisa que no haya filas vacías entre los datos
4. Guarda y cierra el archivo antes de cargarlo en el sistema

---

## 🎯 Recomendaciones

### Para Pre-Alerta:
- Exportar directamente desde tu sistema de gestión
- Asegurar que todos los campos obligatorios tengan datos
- El Tracking Number es el campo más crítico

### Para Pre-Ruteo:
- El **Codigo de Pedido** DEBE coincidir con los Tracking Numbers de Pre-Alerta
- Las fechas deben ser válidas y estar en el futuro o presente
- Revisar que los choferes y máquinas estén correctamente asignados

### Para Escaneo:
- Escanear en un ambiente con buena iluminación
- Mantener la pistola estable al leer el código
- Verificar el resultado en pantalla antes del siguiente escaneo
- Si hay muchos paquetes, considerar múltiples estaciones de escaneo

---

## 📞 Soporte

Si tienes problemas con el formato de los archivos:

1. Descarga un archivo de ejemplo (si está disponible en el sistema)
2. Compara tu archivo con el ejemplo
3. Contacta al administrador del sistema con:
   - Screenshot de tu archivo Excel
   - Mensaje de error específico
   - Cantidad de filas aproximada

---

**Última actualización:** 17 de octubre de 2025
