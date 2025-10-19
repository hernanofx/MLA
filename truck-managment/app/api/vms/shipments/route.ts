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

    // Obtener providerId del usuario (null = admin, ve todo)
    const providerId = await getVMSProviderId(session)

    // Filtrar shipments por proveedor
    const where = providerId ? { providerId } : {}

    const shipments = await prisma.shipment.findMany({
      where,
      include: {
        _count: {
          select: {
            preAlertas: true,
            preRuteos: true,
            scannedPackages: true,
          }
        },
        provider: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calcular estadísticas solo del proveedor
    const statsWhere = providerId ? { shipment: { providerId } } : {}
    
    const totalPackages = await prisma.scannedPackage.count({
      where: statsWhere
    })
    const okPackages = await prisma.scannedPackage.count({
      where: { 
        ...statsWhere,
        status: 'OK' 
      }
    })
    const issuesPackages = await prisma.scannedPackage.count({
      where: {
        ...statsWhere,
        status: {
          in: ['SOBRANTE', 'FUERA_COBERTURA', 'PREVIO']
        }
      }
    })

    return NextResponse.json({
      shipments,
      totalPackages,
      okPackages,
      issuesPackages
    })

  } catch (error: any) {
    console.error('Error fetching shipments:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener los lotes' },
      { status: 500 }
    )
  }
}
