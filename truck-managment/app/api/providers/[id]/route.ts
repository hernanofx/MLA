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

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { name, responsibleId, street, number, locality } = await request.json()

    // Allow updating any field
    if (!name && responsibleId === undefined && street === undefined && number === undefined && locality === undefined) {
      return NextResponse.json({ error: 'At least one field is required' }, { status: 400 })
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (responsibleId !== undefined) updateData.responsibleId = responsibleId
    if (street !== undefined) updateData.street = street
    if (number !== undefined) updateData.number = number
    if (locality !== undefined) updateData.locality = locality

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

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if provider has associated entries
    const entriesCount = await prisma.entry.count({
      where: { providerId: id }
    })

    // Check if provider has associated loads
    const loadsCount = await prisma.load.count({
      where: { providerId: id }
    })

    if (entriesCount > 0 || loadsCount > 0) {
      return NextResponse.json({
        error: `No se puede eliminar el proveedor porque tiene ${entriesCount} entrada${entriesCount !== 1 ? 's' : ''} y ${loadsCount} carga${loadsCount !== 1 ? 's' : ''} asociada${loadsCount !== 1 ? 's' : ''}. Elimine primero las entradas y cargas relacionadas.`
      }, { status: 400 })
    }

    await prisma.provider.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Provider deleted' })
  } catch (error) {
    console.error('Error deleting provider:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}