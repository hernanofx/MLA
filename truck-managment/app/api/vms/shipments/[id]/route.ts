import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getVMSProviderId, verifyProviderAccess } from '@/lib/vms-auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const shipmentId = id

    // Verificar que el shipment existe
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      select: { providerId: true, status: true }
    })

    if (!shipment) {
      return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 })
    }

    // Obtener providerId del usuario
    const providerId = await getVMSProviderId(session)

    // Verificar acceso al shipment
    verifyProviderAccess(shipment.providerId, providerId)

    // Eliminar el shipment y todos sus datos relacionados (cascade delete)
    await prisma.shipment.delete({
      where: { id: shipmentId }
    })

    return NextResponse.json({ message: 'Lote eliminado exitosamente' })

  } catch (error: any) {
    console.error('Error deleting shipment:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar el lote' },
      { status: 500 }
    )
  }
}