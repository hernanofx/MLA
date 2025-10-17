import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { shipmentId } = await request.json()
    
    if (!shipmentId) {
      return NextResponse.json({ error: 'Falta shipmentId' }, { status: 400 })
    }

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
