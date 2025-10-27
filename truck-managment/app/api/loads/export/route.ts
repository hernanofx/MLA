import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    // Filter parameters (same as main loads API)
    const providerId = searchParams.get('providerId')
    const truckId = searchParams.get('truckId')
    const container = searchParams.get('container')
    const week = searchParams.get('week')
    const month = searchParams.get('month')

    // Build where clause
    const where: any = {}
    if (providerId) where.providerId = providerId
    if (truckId) where.truckId = truckId
    if (container) where.container = { contains: container, mode: 'insensitive' }
    if (week) where.week = parseInt(week)
    if (month) where.month = parseInt(month)

    const loads = await prisma.load.findMany({
      where,
      include: {
        provider: true,
        truck: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Prepare data for Excel
    const excelData = loads.map(load => ({
      'Proveedor': load.provider.name,
      'Camión': load.truck.licensePlate,
      'Llegada': load.arrivalTime ? new Date(load.arrivalTime).toLocaleString('es-ES') : 'No registrada',
      'Salida': load.departureTime ? new Date(load.departureTime).toLocaleString('es-ES') : 'No registrada',
      'Duración (min)': load.durationMinutes || 'N/A',
      'Cantidad': load.quantity || 'N/A',
      'Contenedora': load.container || 'N/A',
      'Semana': load.week,
      'Mes': load.month,
      'Fecha de Creación': new Date(load.createdAt).toLocaleString('es-ES')
    }))

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)

    // Auto-size columns
    const colWidths = [
      { wch: 20 }, // Proveedor
      { wch: 15 }, // Camión
      { wch: 20 }, // Llegada
      { wch: 20 }, // Salida
      { wch: 15 }, // Duración
      { wch: 12 }, // Cantidad
      { wch: 15 }, // Contenedora
      { wch: 8 },  // Semana
      { wch: 8 },  // Mes
      { wch: 20 }  // Fecha de Creación
    ]
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, 'Cargas')

    // Generate buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    // Return Excel file
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="cargas_${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}