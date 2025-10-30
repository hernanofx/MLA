import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getVMSProviderId, verifyProviderAccess } from '@/lib/vms-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener providerId del usuario (multi-tenant)
    const providerId = await getVMSProviderId(session)
    const clasificacionId = params.id

    // Verificar que la clasificación existe y el usuario tiene acceso
    const clasificacion = await prisma.clasificacionArchivo.findUnique({
      where: { id: clasificacionId },
      include: {
        paquetes: {
          select: {
            id: true,
            vehiculo: true,
            escaneado: true,
            ordenNumerico: true
          }
        }
      }
    })

    if (!clasificacion) {
      return NextResponse.json({ 
        error: 'Clasificación no encontrada' 
      }, { status: 404 })
    }

    // Verificar acceso multi-tenant
    verifyProviderAccess(clasificacion.providerId, providerId)

    // Calcular estadísticas
    const totalPaquetes = clasificacion.paquetes.length
    const escaneados = clasificacion.paquetes.filter(p => p.escaneado).length
    const pendientes = totalPaquetes - escaneados
    const porcentaje = totalPaquetes > 0 ? Math.round((escaneados / totalPaquetes) * 100) : 0

    // Estadísticas por vehículo
    const vehiculos = new Set(clasificacion.paquetes.map(p => p.vehiculo))
    const estatsPorVehiculo = Array.from(vehiculos).map(vehiculo => {
      const paquetesVehiculo = clasificacion.paquetes.filter(p => p.vehiculo === vehiculo)
      const escaneadosVehiculo = paquetesVehiculo.filter(p => p.escaneado).length
      
      return {
        vehiculo,
        total: paquetesVehiculo.length,
        escaneados: escaneadosVehiculo,
        pendientes: paquetesVehiculo.length - escaneadosVehiculo,
        porcentaje: paquetesVehiculo.length > 0 
          ? Math.round((escaneadosVehiculo / paquetesVehiculo.length) * 100) 
          : 0
      }
    }).sort((a, b) => a.vehiculo.localeCompare(b.vehiculo))

    return NextResponse.json({
      clasificacionId,
      uploadedAt: clasificacion.uploadedAt,
      uploadedBy: clasificacion.uploadedBy,
      stats: {
        total: totalPaquetes,
        escaneados,
        pendientes,
        porcentaje
      },
      vehiculos: estatsPorVehiculo,
      totalVehiculos: vehiculos.size
    })

  } catch (error: any) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ 
      error: 'Error al obtener estadísticas',
      details: error.message 
    }, { status: 500 })
  }
}
