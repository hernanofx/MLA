import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Verificar que la etiqueta existe
    const label = await prisma.label.findUnique({
      where: { id },
    })

    if (!label) {
      return NextResponse.json(
        { error: 'Etiqueta no encontrada' },
        { status: 404 }
      )
    }

    // Eliminar la etiqueta
    await prisma.label.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Etiqueta eliminada correctamente' })
  } catch (error) {
    console.error('Error deleting label:', error)
    return NextResponse.json(
      { error: 'Error al eliminar etiqueta' },
      { status: 500 }
    )
  }
}
