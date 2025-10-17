import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const providerName = searchParams.get('providerName') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''

    const where: any = {}

    if (providerName) {
      where.providerName = providerName
    }

    if (startDate || endDate) {
      where.issueDate = {}
      if (startDate) {
        where.issueDate.gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.issueDate.lte = end
      }
    }

    const labels = await prisma.label.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    // Preparar datos para Excel
    const excelData = labels.map(label => ({
      'Código de Barras': label.barcode,
      'Proveedor': label.providerName,
      'Fecha de Emisión': new Date(label.issueDate).toLocaleDateString('es-ES'),
      'Descripción': label.description || '',
      'Fecha de Creación': new Date(label.createdAt).toLocaleString('es-ES')
    }))

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)

    // Auto-size columns
    const colWidths = [
      { wch: 20 }, // Código de Barras
      { wch: 15 }, // Proveedor
      { wch: 15 }, // Fecha de Emisión
      { wch: 40 }, // Descripción
      { wch: 20 }  // Fecha de Creación
    ]
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, 'Etiquetas')

    // Generate buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    // Return as file download
    return new NextResponse(buf, {
      headers: {
        'Content-Disposition': `attachment; filename="etiquetas_${new Date().toISOString().split('T')[0]}.xlsx"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    })
  } catch (error) {
    console.error('Error exporting labels:', error)
    return NextResponse.json(
      { error: 'Error al exportar etiquetas' },
      { status: 500 }
    )
  }
}
