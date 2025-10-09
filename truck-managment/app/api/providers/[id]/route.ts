import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const provider = await prisma.provider.findUnique({
      where: { id },
      include: {
        responsible: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    return NextResponse.json(provider)
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, responsibleId } = await request.json()

    // Allow updating either name or responsibleId or both
    if (!name && responsibleId === undefined) {
      return NextResponse.json({ error: 'At least one field (name or responsibleId) is required' }, { status: 400 })
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (responsibleId !== undefined) updateData.responsibleId = responsibleId

    const provider = await prisma.provider.update({
      where: { id },
      data: updateData,
      include: {
        responsible: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(provider)
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.provider.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Provider deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}