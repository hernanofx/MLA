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

    const etapas = await prisma.activacion.findMany({
      select: {
        etapa: true
      },
      distinct: ['etapa'],
      orderBy: {
        etapa: 'asc'
      }
    })

    const etapasList = etapas.map(e => e.etapa).filter(Boolean)

    return NextResponse.json({ etapas: etapasList })
  } catch (error) {
    console.error('Error fetching etapas:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}