import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Función para generar código de barras único
function generateUniqueBarcode(): string {
  const timestamp = Date.now().toString().slice(-8)
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `LBL${timestamp}${random}`
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const providerName = searchParams.get('providerName') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
    
    const skip = (page - 1) * limit

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

    const [labels, total] = await Promise.all([
      prisma.label.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.label.count({ where }),
    ])

    // Obtener contadores por proveedor
    const countsByProvider = await prisma.label.groupBy({
      by: ['providerName'],
      _count: {
        id: true,
      },
      where,
    })

    return NextResponse.json({
      labels,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      countsByProvider: countsByProvider.map(item => ({
        providerName: item.providerName,
        count: item._count.id,
      })),
    })
  } catch (error) {
    console.error('Error fetching labels:', error)
    return NextResponse.json(
      { error: 'Error al obtener etiquetas' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { providerName, description } = await request.json()

    if (!providerName) {
      return NextResponse.json(
        { error: 'Nombre del proveedor es requerido' },
        { status: 400 }
      )
    }

    // Validar que el proveedor sea Urbano u Ocasa
    if (!['Urbano', 'Ocasa'].includes(providerName)) {
      return NextResponse.json(
        { error: 'Proveedor debe ser Urbano u Ocasa' },
        { status: 400 }
      )
    }

    // Generar código de barras único
    let barcode = generateUniqueBarcode()
    let exists = await prisma.label.findUnique({ where: { barcode } })
    
    // Si existe, intentar generar otro
    while (exists) {
      barcode = generateUniqueBarcode()
      exists = await prisma.label.findUnique({ where: { barcode } })
    }

    const label = await prisma.label.create({
      data: {
        barcode,
        providerName,
        description: description || '',
      },
    })

    return NextResponse.json(label, { status: 201 })
  } catch (error) {
    console.error('Error creating label:', error)
    return NextResponse.json(
      { error: 'Error al crear etiqueta' },
      { status: 500 }
    )
  }
}
