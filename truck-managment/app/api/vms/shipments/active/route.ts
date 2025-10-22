import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getVMSProviderId } from '@/lib/vms-auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const providerId = await getVMSProviderId(session)

    if (!providerId) {
      return NextResponse.json({ error: 'Usuario sin proveedor asignado' }, { status: 403 })
    }

    // Buscar lotes activos (últimas 48 horas, sin finalizar)
    const activeShipments = await prisma.shipment.findMany({
      where: {
        providerId,
        createdAt: {
          gte: new Date(Date.now() - 48 * 60 * 60 * 1000) // Últimas 48 horas
        },
        status: {
          not: 'FINALIZADO' // Solo lotes en proceso
        }
      },
      select: {
        id: true,
        shipmentDate: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            scannedPackages: true,
            preAlertas: true,
            preRuteos: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(activeShipments)

  } catch (error: any) {
    console.error('Error fetching active shipments:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener lotes activos' },
      { status: 500 }
    )
  }
}
