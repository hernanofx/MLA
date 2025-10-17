import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
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

    // Obtener estadísticas del shipment
    const scannedPackages = await prisma.scannedPackage.findMany({
      where: { shipmentId },
      include: {
        preAlerta: true,
        preRuteo: true,
      }
    })

    const stats = {
      totalScanned: scannedPackages.length,
      ok: scannedPackages.filter(p => p.status === 'OK').length,
      sobrante: scannedPackages.filter(p => p.status === 'SOBRANTE').length,
      fueraCobertura: scannedPackages.filter(p => p.status === 'FUERA_COBERTURA').length,
      previo: scannedPackages.filter(p => p.status === 'PREVIO').length,
      details: scannedPackages,
    }

    return NextResponse.json(stats)

  } catch (error: any) {
    console.error('Error fetching report:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener el reporte' },
      { status: 500 }
    )
  }
}
