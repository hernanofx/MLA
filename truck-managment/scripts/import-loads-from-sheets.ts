import { PrismaClient } from '../app/generated/prisma'
import { google } from 'googleapis'

const prisma = new PrismaClient()

interface SheetRow {
  Proveedor: string
  Camion: string
  Llegada: string
  Salida: string
  Cantidad: number
  Contenedora: string
  Precinto: string
  Duration: number
  Week: number
  Month: number
}

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
    .replace(/"/g, '')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  
  return cleaned || null
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
function parseRow(row: any[]): ParsedLoad | null {
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
    
  } catch (error) {
    console.error(`❌ Error importando load:`, error)
    throw error
  }
}

// Leer datos de Google Sheets
async function readGoogleSheet(spreadsheetId: string, range: string = 'Sheet1!A:J') {
  try {
    // Configurar autenticación (usa API key pública para lectura)
    const sheets = google.sheets({ version: 'v4' })
    
    console.log(`📊 Leyendo Google Sheet: ${spreadsheetId}`)
    console.log(`📍 Rango: ${range}`)
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
      key: process.env.GOOGLE_SHEETS_API_KEY || 'AIzaSyDummyKeyForPublicAccess', // Necesitarás una API key
    })
    
    const rows = response.data.values
    
    if (!rows || rows.length === 0) {
      throw new Error('No se encontraron datos en la hoja')
    }
    
    console.log(`📋 Total de filas encontradas: ${rows.length}`)
    
    return rows
  } catch (error: any) {
    console.error('❌ Error leyendo Google Sheet:', error.message)
    
    // Si falla la API, intentar con método alternativo
    console.log('\n💡 Intentando método alternativo (exportar como CSV)...')
    console.log('Por favor, sigue estos pasos:')
    console.log('1. Abre el Google Sheet')
    console.log('2. Ve a Archivo > Descargar > Valores separados por comas (.csv)')
    console.log('3. Guarda el archivo como loads.csv')
    console.log('4. Ejecuta: npx ts-node scripts/import-loads-from-csv.ts loads.csv\n')
    
    throw error
  }
}

// Main function
async function main() {
  console.log('🚀 Iniciando importación desde Google Sheets\n')
  console.log('='.repeat(80))
  
  // Extraer ID del spreadsheet de la URL
  const url = 'https://docs.google.com/spreadsheets/d/1B9FnUNsBqW4zLpw7iR39ziSoTAuWZ6VJWqUYWwxFGsQ/edit?gid=0#gid=0'
  const spreadsheetId = url.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1]
  
  if (!spreadsheetId) {
    throw new Error('No se pudo extraer el ID del spreadsheet de la URL')
  }
  
  console.log(`📄 Spreadsheet ID: ${spreadsheetId}\n`)
  
  try {
    // Leer datos de Google Sheets
    const rows = await readGoogleSheet(spreadsheetId)
    
    // La primera fila son los headers, saltarla
    const dataRows = rows.slice(1)
    
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
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.error(`❌ Error en fila ${i + 1}:`, error instanceof Error ? error.message : error)
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
    
    // Ofrecer alternativa
    console.log('\n' + '='.repeat(80))
    console.log('💡 MÉTODO ALTERNATIVO')
    console.log('='.repeat(80))
    console.log('Si tienes problemas con la API de Google Sheets:')
    console.log('1. Descarga el sheet como CSV')
    console.log('2. Ejecuta: npx ts-node scripts/import-loads-from-csv.ts archivo.csv')
    console.log('='.repeat(80))
    
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch(console.error)
