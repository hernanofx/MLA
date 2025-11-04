import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['admin', 'user', 'operario'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const providerId = searchParams.get('providerId')
    const responsableId = searchParams.get('responsableId')
    const etapa = searchParams.get('etapa')
    const verificado = searchParams.get('verificado')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    const where: any = {}
    if (providerId) where.providerId = providerId
    if (responsableId) where.responsableId = responsableId
    if (etapa) where.etapa = etapa
    if (verificado !== null && verificado !== undefined) {
      where.verificado = verificado === 'true'
    }

    const [activaciones, total] = await Promise.all([
      prisma.activacion.findMany({
        where,
        include: {
          provider: { select: { name: true } },
          responsable: { select: { name: true } }
        },
        orderBy: {
          [sortBy]: sortOrder
        },
        skip,
        take: limit
      }),
      prisma.activacion.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      activaciones,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    })
  } catch (error) {
    console.error('Error fetching activaciones:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['admin', 'user', 'operario'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { trackingNumber, providerId, etapa, responsableId, notas, verificado } = body

    if (!trackingNumber || !providerId || !etapa || !responsableId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const activacion = await prisma.activacion.create({
      data: {
        trackingNumber,
        providerId,
        etapa,
        responsableId,
        notas,
        verificado: verificado || false
      },
      include: {
        provider: { select: { name: true } },
        responsable: { select: { name: true } }
      }
    })

    return NextResponse.json(activacion, { status: 201 })
  } catch (error) {
    console.error('Error creating activacion:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}