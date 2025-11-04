import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['admin', 'user', 'operario'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const providerId = searchParams.get('providerId')
    const responsableId = searchParams.get('responsableId')
    const etapa = searchParams.get('etapa')
    const verificado = searchParams.get('verificado')

    const where: any = {}
    if (providerId) where.providerId = providerId
    if (responsableId) where.responsableId = responsableId
    if (etapa) where.etapa = etapa
    if (verificado !== null && verificado !== undefined) {
      where.verificado = verificado === 'true'
    }

    const activaciones = await prisma.activacion.findMany({
      where,
      include: {
        provider: { select: { name: true } },
        responsable: { select: { name: true } }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Prepare data for Excel
    const data = activaciones.map(activacion => ({
      'Tracking Number': activacion.trackingNumber,
      'Proveedor': activacion.provider.name,
      'Etapa': activacion.etapa,
      'Responsable': activacion.responsable.name,
      'Notas': activacion.notas || '',
      'Verificado': activacion.verificado ? 'Sí' : 'No',
      'Fecha de Creación': new Date(activacion.createdAt).toLocaleString('es-AR')
    }))

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(data)

    // Auto-size columns
    const colWidths = [
      { wch: 20 }, // Tracking Number
      { wch: 25 }, // Proveedor
      { wch: 15 }, // Etapa
      { wch: 20 }, // Responsable
      { wch: 30 }, // Notas
      { wch: 10 }, // Verificado
      { wch: 20 }  // Fecha de Creación
    ]
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, 'Activaciones')

    // Generate buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    // Return Excel file
    const response = new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=activaciones_${new Date().toISOString().split('T')[0]}.xlsx`
      }
    })

    return response
  } catch (error) {
    console.error('Error exporting activaciones:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}