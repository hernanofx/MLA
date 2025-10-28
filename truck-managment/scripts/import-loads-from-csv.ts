import { PrismaClient } from '../app/generated/prisma'
import * as fs from 'fs'
import * as path from 'path'

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
  if (!dateStr || dateStr.trim() === '') return null
  
  try {
    const parts = dateStr.trim().split(' ')
    if (parts.length !== 2) return null
    
    const [datePart, timePart] = parts
    const [day, month, year] = datePart.split('/').map(Number)
    const [hours, minutes, seconds = 0] = timePart.split(':').map(Number)
    
    const date = new Date(year, month - 1, day, hours, minutes, seconds)
    
    // Validar que la fecha sea válida
    if (isNaN(date.getTime())) return null
    
    return date
  } catch (error) {
    console.error('Error parsing date:', dateStr, error)
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

// Parsear CSV completo respetando comillas y saltos de línea dentro de campos
function parseCSV(content: string): string[][] {
  const rows: string[][] = []
  const lines = content.split('\n')
  
  let currentRow: string[] = []
  let currentField = ''
  let inQuotes = false
  let i = 0
  
  while (i < content.length) {
    const char = content[i]
    const nextChar = content[i + 1]
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      currentRow.push(currentField)
      currentField = ''
    } else if (char === '\n' && !inQuotes) {
      // End of row
      currentRow.push(currentField)
      if (currentRow.some(f => f.trim())) { // Only add non-empty rows
        rows.push(currentRow)
      }
      currentRow = []
      currentField = ''
    } else {
      currentField += char
    }
    
    i++
  }
  
  // Add last field and row if any
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField)
    if (currentRow.some(f => f.trim())) {
      rows.push(currentRow)
    }
  }
  
  return rows
}

// Buscar Provider (NO crear)
async function findProvider(name: string): Promise<string> {
  if (!name || name.trim() === '') {
    throw new Error('Provider name is required')
  }
  
  const cleanName = name.trim().toUpperCase()
  
  const provider = await prisma.provider.findFirst({
    where: { 
      name: { 
        equals: cleanName, 
        mode: 'insensitive' 
      } 
    }
  })
  
  if (!provider) {
    throw new Error(`Proveedor no encontrado: ${cleanName}. Debe existir en la base de datos.`)
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
  try {
  // Validar datos mínimos
  if (!data.proveedor) {
    throw new Error('Proveedor es requerido')
  }
  
  // 1. Buscar Provider (NO crear)
  const providerId = await findProvider(data.proveedor)
  
  // 2. Buscar o crear Truck
  const truckId = await findOrCreateTruck(data.camion, providerId)    // 3. Calcular duration si no viene
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
    
  } catch (error) {
    console.error(`❌ Error importando load:`, error)
    throw error
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2)
  const filePath = args[0]
  
  if (!filePath) {
    console.error('❌ Uso: npx ts-node scripts/import-loads-from-csv.ts <ruta-al-csv>')
    console.log('\nPara exportar desde Google Sheets:')
    console.log('1. Abre: https://docs.google.com/spreadsheets/d/1B9FnUNsBqW4zLpw7iR39ziSoTAuWZ6VJWqUYWwxFGsQ')
    console.log('2. Archivo > Descargar > Valores separados por comas (.csv, hoja actual)')
    console.log('3. Ejecuta: npx ts-node scripts/import-loads-from-csv.ts ~/Downloads/Hoja1.csv\n')
    process.exit(1)
  }
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ El archivo no existe: ${filePath}`)
    process.exit(1)
  }
  
  console.log('🚀 Iniciando importación desde CSV\n')
  console.log('='.repeat(80))
  console.log(`📂 Leyendo archivo: ${filePath}\n`)
  
  try {
    // Leer el archivo CSV
    const content = fs.readFileSync(filePath, 'utf-8')
    
    // Parsear CSV completo respetando comillas
    const rows = parseCSV(content)
    
    // La primera fila son los headers, saltarla
    const dataRows = rows.slice(1)
    
    console.log(`📋 Total de filas encontradas: ${dataRows.length}`)
    console.log('\n🔄 Iniciando procesamiento de datos...\n')
    
    let successCount = 0
    let errorCount = 0
    let skippedCount = 0
    
    // Procesar cada fila
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i]
      console.log(`\n[${i + 1}/${dataRows.length}] Procesando...`)
      
      try {
        const parsedData = parseRow(row)
        
        if (!parsedData) {
          console.log(`⏭️  Fila vacía, saltando...`)
          skippedCount++
          continue
        }
        
        await importLoad(parsedData)
        successCount++
        
        // Pequeña pausa para no sobrecargar la DB
        await new Promise(resolve => setTimeout(resolve, 50))
        
      } catch (error) {
        console.error(`❌ Error en fila ${i + 1}:`, error instanceof Error ? error.message : error)
        console.error(`   Proveedor: ${row[0]}, Camion: ${row[1]}`)
        errorCount++
      }
    }
    
    console.log('\n' + '='.repeat(80))
    console.log('📊 RESUMEN DE IMPORTACIÓN')
    console.log('='.repeat(80))
    console.log(`✅ Exitosos: ${successCount}`)
    console.log(`❌ Errores: ${errorCount}`)
    console.log(`⏭️  Saltados: ${skippedCount}`)
    console.log(`📋 Total procesados: ${dataRows.length}`)
    console.log('='.repeat(80))
    
  } catch (error) {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch(console.error)
