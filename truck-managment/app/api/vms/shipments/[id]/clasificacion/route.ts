import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getVMSProviderId, verifyProviderAccess } from '@/lib/vms-auth'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const providerId = await getVMSProviderId(session)
    const params = await context.params
    const shipmentId = params.id

    // Verificar que el shipment pertenece al proveedor
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      select: { providerId: true }
    })

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment no encontrado' }, { status: 404 })
    }

    verifyProviderAccess(shipment.providerId, providerId)

    // Buscar la clasificación más reciente del shipment
    const clasificacion = await prisma.clasificacionArchivo.findFirst({
      where: { shipmentId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        finalizado: true,
        finalizadoAt: true,
        uploadedAt: true,
        totalRows: true
      }
    })

    return NextResponse.json({
      clasificacion: clasificacion || null
    })

  } catch (error: any) {
    console.error('Error fetching clasificacion:', error)
    return NextResponse.json({ 
      error: 'Error al obtener clasificación',
      details: error.message 
    }, { status: 500 })
  }
}
