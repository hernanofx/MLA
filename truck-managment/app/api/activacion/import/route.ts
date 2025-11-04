import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['admin', 'user', 'operario'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Read file buffer
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'buffer' })

    // Get first worksheet
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet)

    if (data.length === 0) {
      return NextResponse.json({ error: 'No data found in Excel file' }, { status: 400 })
    }

    // Validate headers
    const firstRow = data[0] as any
    const requiredHeaders = ['Tracking Number', 'Proveedor', 'Etapa', 'Responsable', 'Notas', 'Verificado']
    const headers = Object.keys(firstRow)

    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header))
    if (missingHeaders.length > 0) {
      return NextResponse.json({
        error: `Missing required headers: ${missingHeaders.join(', ')}`
      }, { status: 400 })
    }

    // Process data
    const activaciones = []
    const errors = []

    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any
      const rowNumber = i + 2 // +2 because Excel is 1-indexed and we skip header

      try {
        const trackingNumber = row['Tracking Number']?.toString().trim()
        const providerName = row['Proveedor']?.toString().trim()
        const etapa = row['Etapa']?.toString().trim()
        const responsableName = row['Responsable']?.toString().trim()
        const notas = row['Notas']?.toString().trim() || null
        const verificadoStr = row['Verificado']?.toString().trim().toLowerCase()
        const verificado = verificadoStr === 'sí' || verificadoStr === 'si' || verificadoStr === 'true' || verificadoStr === '1'

        if (!trackingNumber || !providerName || !etapa || !responsableName) {
          errors.push(`Row ${rowNumber}: Missing required fields`)
          continue
        }

        // Find provider by name
        const provider = await prisma.provider.findFirst({
          where: { name: { equals: providerName, mode: 'insensitive' } }
        })

        if (!provider) {
          errors.push(`Row ${rowNumber}: Provider "${providerName}" not found`)
          continue
        }

        // Find responsable by name
        const responsable = await prisma.user.findFirst({
          where: { name: { equals: responsableName, mode: 'insensitive' } }
        })

        if (!responsable) {
          errors.push(`Row ${rowNumber}: User "${responsableName}" not found`)
          continue
        }

        // Check if activacion already exists
        const existing = await prisma.activacion.findFirst({
          where: { trackingNumber }
        })

        if (existing) {
          errors.push(`Row ${rowNumber}: Tracking Number "${trackingNumber}" already exists`)
          continue
        }

        activaciones.push({
          trackingNumber,
          providerId: provider.id,
          etapa,
          responsableId: responsable.id,
          notas,
          verificado
        })

      } catch (error) {
        errors.push(`Row ${rowNumber}: ${(error as Error).message}`)
      }
    }

    if (activaciones.length === 0) {
      return NextResponse.json({
        error: 'No valid activaciones to import',
        errors
      }, { status: 400 })
    }

    // Create activaciones
    const created = await prisma.activacion.createMany({
      data: activaciones,
      skipDuplicates: true
    })

    return NextResponse.json({
      message: `Successfully imported ${created.count} activaciones`,
      errors: errors.length > 0 ? errors : undefined,
      totalProcessed: data.length,
      totalImported: created.count,
      totalErrors: errors.length
    })

  } catch (error) {
    console.error('Error importing activaciones:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}