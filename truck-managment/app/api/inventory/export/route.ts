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
    const locationId = searchParams.get('locationId')
    const entryId = searchParams.get('entryId')
    const providerId = searchParams.get('providerId')
    const warehouseId = searchParams.get('warehouseId')
    const status = searchParams.get('status')
    const trackingNumber = searchParams.get('trackingNumber')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {
      ...(locationId && { locationId }),
      ...(entryId && { entryId }),
      ...(status && { status }),
      ...(providerId && { OR: [ { entry: { provider: { id: providerId } } }, { provider: { id: providerId } } ] }),
      ...(warehouseId && { location: { warehouse: { id: warehouseId } } }),
      ...(trackingNumber && { trackingNumbers: { contains: trackingNumber, mode: 'insensitive' } }),
      ...(startDate || endDate) && {
        createdAt: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) }),
        },
      },
    }

    const inventories = await prisma.inventory.findMany({
      where,
      include: {
        entry: {
          include: {
            provider: true,
          },
        },
        provider: true,
        location: {
          include: {
            warehouse: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' }
    })

    // Prepare data for Excel
    const excelData = inventories.map(inv => ({
      'Fecha de Devolución': new Date(inv.createdAt).toLocaleString('es-ES'),
      'Proveedor': inv.entry?.provider?.name || inv.provider?.name || 'N/A',
      'Almacén': inv.location?.warehouse?.name || 'N/A',
      'Ubicación': inv.location?.name || 'N/A',
      'Cantidad': inv.quantity,
      'Tracking Numbers': inv.trackingNumbers || 'N/A',
      'Estado': inv.status === 'stored' ? 'Almacenado' : 'Enviado'
    }))

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)

    // Auto-size columns
    const colWidths = [
      { wch: 20 }, // Fecha de Devolución
      { wch: 20 }, // Proveedor
      { wch: 15 }, // Almacén
      { wch: 15 }, // Ubicación
      { wch: 10 }, // Cantidad
      { wch: 25 }, // Tracking Numbers
      { wch: 12 }  // Estado
    ]
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, 'Inventario')

    // Generate buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    // Return Excel file
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="inventario_${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}