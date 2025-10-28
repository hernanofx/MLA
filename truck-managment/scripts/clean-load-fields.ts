import { PrismaClient } from '../app/generated/prisma'

const prisma = new PrismaClient()

async function cleanLoadFields() {
  console.log('🧹 Limpiando campos de Loads...\n')
  
  try {
    // Obtener todos los loads
    const loads = await prisma.load.findMany({
      select: {
        id: true,
        container: true,
        precinto: true
      }
    })
    
    console.log(`📊 Total de loads encontrados: ${loads.length}\n`)
    
    let updatedCount = 0
    
    for (const load of loads) {
      let needsUpdate = false
      const updates: any = {}
      
      // Limpiar contenedora
      if (load.container) {
        const cleaned = load.container.replace(/\s+/g, ' ').trim()
        if (cleaned !== load.container) {
          updates.container = cleaned
          needsUpdate = true
        }
      }
      
      // Limpiar precinto
      if (load.precinto) {
        const cleaned = load.precinto.replace(/\s+/g, ' ').trim()
        if (cleaned !== load.precinto) {
          updates.precinto = cleaned
          needsUpdate = true
        }
      }
      
      // Actualizar si es necesario
      if (needsUpdate) {
        await prisma.load.update({
          where: { id: load.id },
          data: updates
        })
        updatedCount++
        
        if (updatedCount % 50 === 0) {
          console.log(`✅ Procesados ${updatedCount} registros...`)
        }
      }
    }
    
    console.log('\n' + '='.repeat(80))
    console.log('📊 RESUMEN')
    console.log('='.repeat(80))
    console.log(`✅ Registros limpiados: ${updatedCount}`)
    console.log(`📋 Total procesados: ${loads.length}`)
    console.log(`⏭️  Sin cambios: ${loads.length - updatedCount}`)
    console.log('='.repeat(80))
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanLoadFields()
