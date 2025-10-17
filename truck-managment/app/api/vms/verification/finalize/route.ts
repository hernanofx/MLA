import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getVMSProviderId, verifyProviderAccess } from '@/lib/vms-auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener providerId del usuario
    const providerId = await getVMSProviderId(session)

    const { shipmentId } = await request.json()
    
    if (!shipmentId) {
      return NextResponse.json({ error: 'Falta shipmentId' }, { status: 400 })
    }

    // Verificar que el shipment pertenece al proveedor
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      select: { providerId: true }
    })

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment no encontrado' }, { status: 404 })
    }

    // Verificar acceso al shipment
    verifyProviderAccess(shipment.providerId, providerId)

    // Actualizar el estado del shipment
    await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status: 'FINALIZADO',
        finalizedAt: new Date()
      }
    })

    return NextResponse.json({
      message: 'Verificación finalizada exitosamente',
      shipmentId
    })

  } catch (error: any) {
    console.error('Error finalizing verification:', error)
    return NextResponse.json(
      { error: error.message || 'Error al finalizar la verificación' },
      { status: 500 }
    )
  }
}
