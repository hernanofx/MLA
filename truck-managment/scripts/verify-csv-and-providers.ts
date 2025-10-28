import { PrismaClient } from '../app/generated/prisma'
import * as fs from 'fs'

const prisma = new PrismaClient()

async function verifyData() {
  console.log('🔍 VERIFICANDO DATOS\n')
  console.log('='.repeat(80))
  
  // 1. Obtener todos los proveedores existentes
  console.log('📋 Proveedores en la base de datos:\n')
  const providers = await prisma.provider.findMany({
    select: {
      id: true,
      name: true
    },
    orderBy: { name: 'asc' }
  })
  
  providers.forEach((p, idx) => {
    console.log(`${idx + 1}. ${p.name} (ID: ${p.id})`)
  })
  
  console.log('\n' + '='.repeat(80))
  
  // 2. Leer el CSV y ver qué proveedores aparecen
  console.log('\n📊 Proveedores únicos en el CSV:\n')
  
  const csvContent = fs.readFileSync('import.csv', 'utf-8')
  const lines = csvContent.split('\n').slice(1).filter(line => line.trim())
  
  const providersInCSV = new Set<string>()
  
  lines.forEach(line => {
    // Parsear manualmente la primera columna (Proveedor)
    const firstComma = line.indexOf(',')
    if (firstComma > 0) {
      const proveedor = line.substring(0, firstComma).trim().replace(/^["']|["']$/g, '')
      if (proveedor) {
        providersInCSV.add(proveedor.toUpperCase())
      }
    }
  })
  
  const csvProvidersArray = Array.from(providersInCSV).sort()
  csvProvidersArray.forEach((p, idx) => {
    const existsInDB = providers.some(dbP => dbP.name.toUpperCase() === p)
    const status = existsInDB ? '✅' : '❌'
    console.log(`${idx + 1}. ${status} ${p}`)
  })
  
  console.log('\n' + '='.repeat(80))
  
  // 3. Verificar las primeras líneas del CSV
  console.log('\n📝 Primeras 5 líneas del CSV (para verificar formato):\n')
  
  const firstLines = csvContent.split('\n').slice(0, 6)
  firstLines.forEach((line, idx) => {
    console.log(`Línea ${idx}:`)
    const cols = line.split(',')
    cols.forEach((col, colIdx) => {
      const colName = ['Proveedor', 'Camion', 'Llegada', 'Salida', 'Cantidad', 'Contenedora', 'Precinto', 'Duration', 'Week', 'Month'][colIdx]
      console.log(`  [${colIdx}] ${colName}: "${col.substring(0, 50)}${col.length > 50 ? '...' : ''}"`)
    })
    console.log('')
  })
  
  console.log('='.repeat(80))
  
  await prisma.$disconnect()
}

verifyData().catch(console.error)
