import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener todas las clasificaciones con información del shipment
    const clasificaciones = await prisma.clasificacionArchivo.findMany({
      include: {
        shipment: {
          include: {
            provider: true
          }
        },
        _count: {
          select: {
            paquetes: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json({
      clasificaciones,
      total: clasificaciones.length
    })

  } catch (error) {
    console.error('Error fetching clasificaciones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}