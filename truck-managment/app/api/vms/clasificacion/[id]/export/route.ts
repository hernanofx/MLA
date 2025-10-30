import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getVMSProviderId, verifyProviderAccess } from '@/lib/vms-auth'
import * as XLSX from 'xlsx'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener providerId del usuario (multi-tenant)
    const providerId = await getVMSProviderId(session)
    const params = await context.params
    const clasificacionId = params.id

    // Verificar que la clasificación existe y el usuario tiene acceso
    const clasificacion = await prisma.clasificacionArchivo.findUnique({
      where: { id: clasificacionId },
      include: {
        shipment: {
          select: {
            shipmentDate: true
          }
        },
        paquetes: {
          orderBy: [
            { vehiculo: 'asc' },
            { ordenNumerico: 'asc' }
          ]
        }
      }
    })

    if (!clasificacion) {
      return NextResponse.json({ 
        error: 'Clasificación no encontrada' 
      }, { status: 404 })
    }

    // Verificar acceso multi-tenant
    verifyProviderAccess(clasificacion.providerId, providerId)

    // Preparar datos para Excel
    const excelData = clasificacion.paquetes.map(paquete => ({
      'Vehículo': paquete.vehiculo,
      'Orden': paquete.ordenNumerico,
      'Orden Visita': paquete.ordenVisita,
      'Tracking Number': paquete.trackingNumber,
      'Escaneado': paquete.escaneado ? 'SÍ' : 'NO',
      'Fecha Escaneo': paquete.escaneadoAt 
        ? new Date(paquete.escaneadoAt).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })
        : '',
      'Escaneado Por': paquete.escaneadoPor || ''
    }))

    // Crear workbook y worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(excelData)

    // Ajustar ancho de columnas
    const columnWidths = [
      { wch: 15 }, // Vehículo
      { wch: 8 },  // Orden
      { wch: 12 }, // Orden Visita
      { wch: 20 }, // Tracking Number
      { wch: 10 }, // Escaneado
      { wch: 20 }, // Fecha Escaneo
      { wch: 25 }  // Escaneado Por
    ]
    worksheet['!cols'] = columnWidths

    // Agregar hoja al workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clasificación')

    // Crear hoja de resumen
    const vehiculos = new Set(clasificacion.paquetes.map(p => p.vehiculo))
    const resumenData = Array.from(vehiculos).map(vehiculo => {
      const paquetesVehiculo = clasificacion.paquetes.filter(p => p.vehiculo === vehiculo)
      const escaneados = paquetesVehiculo.filter(p => p.escaneado).length
      
      return {
        'Vehículo': vehiculo,
        'Total Paquetes': paquetesVehiculo.length,
        'Escaneados': escaneados,
        'Pendientes': paquetesVehiculo.length - escaneados,
        'Progreso %': paquetesVehiculo.length > 0
          ? Math.round((escaneados / paquetesVehiculo.length) * 100)
          : 0
      }
    }).sort((a, b) => a['Vehículo'].localeCompare(b['Vehículo']))

    const worksheetResumen = XLSX.utils.json_to_sheet(resumenData)
    worksheetResumen['!cols'] = [
      { wch: 15 }, // Vehículo
      { wch: 15 }, // Total Paquetes
      { wch: 12 }, // Escaneados
      { wch: 12 }, // Pendientes
      { wch: 12 }  // Progreso %
    ]
    XLSX.utils.book_append_sheet(workbook, worksheetResumen, 'Resumen')

    // Generar buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Preparar nombre de archivo
    const shipmentDate = new Date(clasificacion.shipment.shipmentDate)
    const dateStr = shipmentDate.toISOString().split('T')[0]
    const fileName = `clasificacion_${dateStr}_${clasificacionId.slice(0, 8)}.xlsx`

    // Retornar archivo
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })

  } catch (error: any) {
    console.error('Error exporting clasificación:', error)
    return NextResponse.json({ 
      error: 'Error al exportar clasificación',
      details: error.message 
    }, { status: 500 })
  }
}
