import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener shipments del proveedor (o todos si es admin)
    const where = session.user.role === 'admin' 
      ? {}
      : { createdById: session.user.id }

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

    // Calcular estadísticas
    const totalPackages = await prisma.scannedPackage.count()
    const okPackages = await prisma.scannedPackage.count({
      where: { status: 'OK' }
    })
    const issuesPackages = await prisma.scannedPackage.count({
      where: {
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
      { error: error.message || 'Error al obtener los envíos' },
      { status: 500 }
    )
  }
}
