import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getVMSProviderId, verifyProviderAccess } from '@/lib/vms-auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener providerId del usuario (multi-tenant)
    const providerId = await getVMSProviderId(session)

    const formData = await request.formData()
    const file = formData.get('file') as File
    const shipmentId = formData.get('shipmentId') as string

    if (!file || !shipmentId) {
      return NextResponse.json({ 
        error: 'Archivo y shipmentId requeridos' 
      }, { status: 400 })
    }

    // Verificar que el shipment existe, está finalizado y pertenece al proveedor
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        scannedPackages: {
          where: { status: 'OK' },
          select: { trackingNumber: true }
        }
      }
    })

    if (!shipment) {
      return NextResponse.json({ 
        error: 'Lote no encontrado' 
      }, { status: 404 })
    }

    // Verificar acceso multi-tenant
    verifyProviderAccess(shipment.providerId, providerId)

    if (shipment.status !== 'FINALIZADO') {
      return NextResponse.json({ 
        error: 'El lote debe estar finalizado para iniciar clasificación' 
      }, { status: 400 })
    }

    // Parsear archivo Excel
    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

    // Validar estructura mínima
    if (data.length < 2) {
      return NextResponse.json({ 
        error: 'Archivo vacío o sin datos' 
      }, { status: 400 })
    }

    // Mapear columnas según orden.xls
    // A=0, B=1, C=2, ... F=5, ... AF=31
    const COL_TRACKING = 1  // Columna B: Tracking Number (entrega)
    const COL_VEHICULO = 5  // Columna F: Número de vehículo
    const COL_ORDEN = 31    // Columna AF: Orden de visita

    const paquetesClasificacion: any[] = []
    const trackingsOK = new Set(shipment.scannedPackages.map(p => p.trackingNumber))
    const vehiculosMap = new Map<string, number>() // Para tracking de orden por vehículo
    
    let totalProcessed = 0
    let skippedNotOK = 0
    let skippedInvalid = 0

    // Procesar cada fila (saltar header en índice 0)
    for (let i = 1; i < data.length; i++) {
      const row = data[i]
      
      if (!row || row.length === 0) continue

      const tracking = row[COL_TRACKING]?.toString().trim()
      const vehiculo = row[COL_VEHICULO]?.toString().trim()
      const ordenVisita = row[COL_ORDEN]?.toString().trim() || '-'

      // Validar datos mínimos
      if (!tracking || !vehiculo) {
        skippedInvalid++
        continue
      }

      // Solo incluir paquetes que están OK en el lote finalizado
      if (!trackingsOK.has(tracking)) {
        skippedNotOK++
        continue
      }

      // Calcular orden numérico por vehículo
      let ordenNumerico = 1
      
      if (ordenVisita === '-') {
        // Primera visita del vehículo
        ordenNumerico = 1
        vehiculosMap.set(vehiculo, 1)
      } else {
        // Incrementar contador del vehículo
        const currentOrden = vehiculosMap.get(vehiculo) || 0
        ordenNumerico = currentOrden + 1
        vehiculosMap.set(vehiculo, ordenNumerico)
      }

      paquetesClasificacion.push({
        trackingNumber: tracking,
        vehiculo,
        ordenVisita,
        ordenNumerico
      })

      totalProcessed++
    }

    if (paquetesClasificacion.length === 0) {
      return NextResponse.json({ 
        error: 'No se encontraron paquetes válidos para clasificar',
        details: {
          totalProcessed,
          skippedNotOK,
          skippedInvalid
        }
      }, { status: 400 })
    }

    // Crear registro de clasificación en una transacción
    const clasificacion = await prisma.clasificacionArchivo.create({
      data: {
        shipmentId,
        providerId: shipment.providerId,
        totalRows: paquetesClasificacion.length,
        uploadedBy: session.user.email || session.user.name || 'unknown',
        paquetes: {
          create: paquetesClasificacion
        }
      },
      include: {
        paquetes: {
          select: {
            vehiculo: true,
            ordenNumerico: true
          }
        }
      }
    })

    // Calcular estadísticas
    const vehiculos = new Set(clasificacion.paquetes.map(p => p.vehiculo))
    const paquetesPorVehiculo = Array.from(vehiculos).map(vehiculo => ({
      vehiculo,
      cantidad: clasificacion.paquetes.filter(p => p.vehiculo === vehiculo).length
    }))

    return NextResponse.json({
      success: true,
      clasificacionId: clasificacion.id,
      summary: {
        totalPaquetes: paquetesClasificacion.length,
        vehiculos: vehiculos.size,
        paquetesPorVehiculo,
        processingStats: {
          totalProcessed,
          skippedNotOK,
          skippedInvalid
        }
      }
    })

  } catch (error: any) {
    console.error('Error uploading clasificación:', error)
    return NextResponse.json({ 
      error: 'Error al procesar archivo',
      details: error.message 
    }, { status: 500 })
  }
}
