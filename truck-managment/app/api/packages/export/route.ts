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
    const providerId = searchParams.get('providerId')
    const warehouseId = searchParams.get('warehouseId')
    const locationId = searchParams.get('locationId')
    const status = searchParams.get('status')
    const trackingNumber = searchParams.get('trackingNumber')
    const trackingNumbers = searchParams.get('trackingNumbers')

    const where: any = {
      ...(providerId && { currentProviderId: providerId }),
      ...(locationId && { currentLocationId: locationId }),
      ...(status && { status }),
      ...(warehouseId && { currentLocation: { warehouse: { id: warehouseId } } }),
      ...(trackingNumber && { trackingNumber: { contains: trackingNumber, mode: 'insensitive' } }),
      ...(trackingNumbers && {
        OR: trackingNumbers.split(/[, \n]+/).filter(t => t.trim()).map(t => ({
          trackingNumber: { equals: t.trim(), mode: 'insensitive' }
        }))
      }),
    }

    const packages = await prisma.package.findMany({
      where,
      include: {
        currentProvider: true,
        currentLocation: {
          include: {
            warehouse: true,
          },
        },
        inventory: {
          include: {
            provider: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' }
    })

    // Prepare data for Excel
    const excelData = packages.map(pkg => ({
      'Tracking Number': pkg.trackingNumber,
      'Proveedor Actual': pkg.currentProvider?.name || 'N/A',
      'Almacén': pkg.currentLocation?.warehouse?.name || 'N/A',
      'Ubicación Actual': pkg.currentLocation?.name || 'N/A',
      'Estado': pkg.status === 'ingresado' ? 'Ingresado' :
               pkg.status === 'almacenado' ? 'Almacenado' :
               pkg.status === 'en_traspaso' ? 'En Traspaso' :
               'Entregado',
      'Proveedor Original': pkg.inventory?.provider?.name || 'N/A',
      'Fecha de Creación': new Date(pkg.createdAt).toLocaleString('es-ES')
    }))

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)

    // Auto-size columns
    const colWidths = [
      { wch: 20 }, // Tracking Number
      { wch: 20 }, // Proveedor Actual
      { wch: 15 }, // Almacén
      { wch: 20 }, // Ubicación Actual
      { wch: 15 }, // Estado
      { wch: 20 }, // Proveedor Original
      { wch: 20 }  // Fecha de Creación
    ]
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, 'Paquetes')

    // Generate buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    // Return Excel file
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="paquetes_${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}