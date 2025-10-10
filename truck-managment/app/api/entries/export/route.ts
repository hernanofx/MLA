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

    // Filter parameters (same as main entries API)
    const providerId = searchParams.get('providerId')
    const truckId = searchParams.get('truckId')
    const week = searchParams.get('week')
    const month = searchParams.get('month')

    // Build where clause
    const where: any = {}
    if (providerId) where.providerId = providerId
    if (truckId) where.truckId = truckId
    if (week) where.week = parseInt(week)
    if (month) where.month = parseInt(month)

    const entries = await prisma.entry.findMany({
      where,
      include: {
        provider: true,
        truck: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Prepare data for Excel
    const excelData = entries.map(entry => ({
      'Proveedor': entry.provider.name,
      'Camión': entry.truck.licensePlate,
      'Llegada': entry.arrivalTime ? new Date(entry.arrivalTime).toLocaleString('es-ES') : 'No registrada',
      'Salida': entry.departureTime ? new Date(entry.departureTime).toLocaleString('es-ES') : 'No registrada',
      'Duración (min)': entry.durationMinutes || 'N/A',
      'Semana': entry.week,
      'Mes': entry.month,
      'Fecha de Creación': new Date(entry.createdAt).toLocaleString('es-ES')
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
      { wch: 8 },  // Semana
      { wch: 8 },  // Mes
      { wch: 20 }  // Fecha de Creación
    ]
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, 'Entradas')

    // Generate buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    // Return Excel file
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="entradas_${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}