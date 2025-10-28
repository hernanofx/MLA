import { PrismaClient } from '../app/generated/prisma'
import fetch from 'node-fetch'

const prisma = new PrismaClient()

interface ParsedLoad {
  proveedor: string
  camion: string
  llegada: Date | null
  salida: Date | null
  cantidad: number | null
  contenedora: string | null
  precinto: string | null
  duration: number | null
  week: number
  month: number
}

// Parsear fecha en formato "dd/mm/yyyy hh:mm:ss"
function parseDateTime(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '' || dateStr === '0') return null
  
  try {
    const parts = dateStr.trim().split(' ')
    if (parts.length !== 2) return null
    
    const [datePart, timePart] = parts
    const [day, month, year] = datePart.split('/').map(Number)
    const [hours, minutes, seconds = 0] = timePart.split(':').map(Number)
    
    const date = new Date(year, month - 1, day, hours, minutes, seconds)
    
    // Validar que la fecha sea válida y no sea 1970
    if (isNaN(date.getTime()) || date.getFullYear() < 2000) return null
    
    return date
  } catch (error) {
    return null
  }
}

// Limpiar campos de texto multilinea
function cleanTextField(value: any): string | null {
  if (!value || value === '' || value === '-') return null
  
  // Convertir a string y limpiar
  const cleaned = String(value)
    .replace(/^["']|["']$/g, '') // Remover comillas al inicio y final
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  
  return cleaned || null
}

// Parsear una línea TSV (tab-separated)
function parseTSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"'
        i++ // Skip next quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === '\t' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current)
  return result
}

// Buscar o crear Provider
async function findOrCreateProvider(name: string): Promise<string> {
  if (!name || name.trim() === '') {
    throw new Error('Provider name is required')
  }
  
  const cleanName = name.trim().toUpperCase()
  
  let provider = await prisma.provider.findFirst({
    where: { 
      name: { 
        equals: cleanName, 
        mode: 'insensitive' 
      } 
    }
  })
  
  if (!provider) {
    console.log(`📝 Creando proveedor: ${cleanName}`)
    provider = await prisma.provider.create({
      data: { 
        name: cleanName
      }
    })
  }
  
  return provider.id
}

// Buscar o crear Truck
async function findOrCreateTruck(licensePlate: string, providerId: string): Promise<string> {
  // Si no hay patente, usar un identificador genérico
  if (!licensePlate || licensePlate.trim() === '') {
    const provider = await prisma.provider.findUnique({ where: { id: providerId } })
    const timestamp = Date.now()
    licensePlate = `SIN-PATENTE-${provider?.name || 'UNKNOWN'}-${timestamp}`
  }
  
  const cleanPlate = licensePlate.trim().toUpperCase()
  
  let truck = await prisma.truck.findFirst({
    where: { 
      licensePlate: { 
        equals: cleanPlate, 
        mode: 'insensitive' 
      } 
    }
  })
  
  if (!truck) {
    console.log(`🚚 Creando camión: ${cleanPlate}`)
    truck = await prisma.truck.create({
      data: { 
        licensePlate: cleanPlate
      }
    })
  }
  
  return truck.id
}

// Parsear una fila
function parseRow(row: string[]): ParsedLoad | null {
  // Skip empty rows
  if (!row || row.length === 0 || !row[0]) return null
  
  return {
    proveedor: String(row[0] || '').trim(),
    camion: String(row[1] || '').trim(),
    llegada: parseDateTime(row[2]),
    salida: parseDateTime(row[3]),
    cantidad: row[4] ? Number(row[4]) : null,
    contenedora: cleanTextField(row[5]),
    precinto: cleanTextField(row[6]),
    duration: row[7] ? Number(row[7]) : null,
    week: row[8] ? Number(row[8]) : 0,
    month: row[9] ? Number(row[9]) : 0
  }
}

// Importar un Load
async function importLoad(data: ParsedLoad): Promise<void> {
  // Validar datos mínimos
  if (!data.proveedor) {
    throw new Error('Proveedor es requerido')
  }
  
  // 1. Buscar o crear Provider
  const providerId = await findOrCreateProvider(data.proveedor)
  
  // 2. Buscar o crear Truck
  const truckId = await findOrCreateTruck(data.camion, providerId)
  
  // 3. Calcular duration si no viene
  let durationMinutes = data.duration
  if (!durationMinutes && data.llegada && data.salida) {
    durationMinutes = Math.round(
      (data.salida.getTime() - data.llegada.getTime()) / (1000 * 60)
    )
  }
  
  // 4. Crear el Load
  await prisma.load.create({
    data: {
      providerId,
      truckId,
      arrivalTime: data.llegada,
      departureTime: data.salida,
      durationMinutes,
      quantity: data.cantidad ? String(data.cantidad) : null,
      container: data.contenedora,
      precinto: data.precinto,
      week: data.week,
      month: data.month
    }
  })
  
  console.log(`✅ Load creado: ${data.proveedor} - ${data.camion || 'SIN-CAMION'} - ${data.llegada?.toLocaleString('es-AR') || 'Sin fecha'}`)
}

// Leer Google Sheet como TSV público
async function fetchGoogleSheetAsTSV(spreadsheetId: string, gid: string = '0'): Promise<string> {
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=tsv&gid=${gid}`
  
  console.log(`📊 Descargando datos desde Google Sheets...`)
  console.log(`🔗 URL: ${url}\n`)
  
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error(`Error descargando sheet: ${response.statusText}`)
  }
  
  return await response.text()
}

// Main function
async function main() {
  console.log('🚀 Iniciando importación desde Google Sheets\n')
  console.log('='.repeat(80))
  
  // URL y IDs del spreadsheet
  const spreadsheetId = '1B9FnUNsBqW4zLpw7iR39ziSoTAuWZ6VJWqUYWwxFGsQ'
  const gid = '0'
  
  console.log(`📄 Spreadsheet ID: ${spreadsheetId}`)
  console.log(`📋 GID: ${gid}\n`)
  
  try {
    // Descargar datos como TSV
    const tsvContent = await fetchGoogleSheetAsTSV(spreadsheetId, gid)
    
    const lines = tsvContent.split('\n').filter(line => line.trim())
    
    console.log(`📋 Total de líneas descargadas: ${lines.length}`)
    
    // La primera línea son los headers
    const headers = parseTSVLine(lines[0])
    console.log(`📌 Headers: ${headers.join(' | ')}\n`)
    
    // Las demás son datos
    const dataLines = lines.slice(1)
    
    console.log('🔄 Iniciando procesamiento de datos...\n')
    
    let successCount = 0
    let errorCount = 0
    let skippedCount = 0
    
    // Procesar cada fila
    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i]
      console.log(`\n[${i + 1}/${dataLines.length}] Procesando...`)
      
      try {
        const row = parseTSVLine(line)
        const parsedData = parseRow(row)
        
        if (!parsedData || !parsedData.proveedor) {
          console.log(`⏭️  Fila vacía o sin proveedor, saltando...`)
          skippedCount++
          continue
        }
        
        await importLoad(parsedData)
        successCount++
        
        // Pequeña pausa para no sobrecargar la DB
        await new Promise(resolve => setTimeout(resolve, 50))
        
      } catch (error) {
        console.error(`❌ Error en fila ${i + 1}:`, error instanceof Error ? error.message : error)
        console.error(`   Datos: ${line.substring(0, 100)}...`)
        errorCount++
        
        // Continuar con el siguiente
        continue
      }
    }
    
    console.log('\n' + '='.repeat(80))
    console.log('📊 RESUMEN DE IMPORTACIÓN')
    console.log('='.repeat(80))
    console.log(`✅ Exitosos: ${successCount}`)
    console.log(`❌ Errores: ${errorCount}`)
    console.log(`⏭️  Saltados: ${skippedCount}`)
    console.log(`📋 Total procesados: ${dataLines.length}`)
    console.log('='.repeat(80))
    
  } catch (error) {
    console.error('\n❌ Error fatal:', error)
    console.log('\n' + '='.repeat(80))
    console.log('💡 SOLUCIÓN')
    console.log('='.repeat(80))
    console.log('Asegúrate de que el Google Sheet sea público o "Cualquiera con el enlace"')
    console.log('1. Abre el Sheet')
    console.log('2. Click en "Compartir" (arriba derecha)')
    console.log('3. Cambia a "Cualquiera con el enlace puede ver"')
    console.log('4. Guarda y vuelve a ejecutar el script')
    console.log('='.repeat(80))
    
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch(console.error)
