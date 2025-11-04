import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['admin', 'user', 'operario'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const activacion = await prisma.activacion.findUnique({
      where: { id },
      include: {
        provider: { select: { name: true } },
        responsable: { select: { name: true } }
      }
    })

    if (!activacion) {
      return NextResponse.json({ error: 'Activacion not found' }, { status: 404 })
    }

    return NextResponse.json(activacion)
  } catch (error) {
    console.error('Error fetching activacion:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['admin', 'user', 'operario'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { trackingNumber, providerId, etapa, responsableId, notas, verificado } = body

    if (!trackingNumber || !providerId || !etapa || !responsableId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const activacion = await prisma.activacion.update({
      where: { id },
      data: {
        trackingNumber,
        providerId,
        etapa,
        responsableId,
        notas,
        verificado
      },
      include: {
        provider: { select: { name: true } },
        responsable: { select: { name: true } }
      }
    })

    return NextResponse.json(activacion)
  } catch (error) {
    console.error('Error updating activacion:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['admin', 'user', 'operario'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    await prisma.activacion.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Activacion deleted successfully' })
  } catch (error) {
    console.error('Error deleting activacion:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}