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

    // Obtener providerId del usuario (multi-tenant)
    const providerId = await getVMSProviderId(session)
    const params = await context.params
    const clasificacionId = params.id

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const vehicleFilter = searchParams.get('vehicle') || ''
    const scannedFilter = searchParams.get('scanned') || ''

    // Verificar que la clasificación existe y el usuario tiene acceso
    const clasificacion = await prisma.clasificacionArchivo.findUnique({
      where: { id: clasificacionId },
      include: {
        paquetes: {
          orderBy: [
            { vehiculo: 'asc' },
            { ordenNumerico: 'asc' }
          ]
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

    let filteredPaquetes = clasificacion.paquetes

    // Aplicar filtros
    if (search) {
      filteredPaquetes = filteredPaquetes.filter(paquete =>
        paquete.trackingNumber.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (vehicleFilter) {
      filteredPaquetes = filteredPaquetes.filter(paquete =>
        paquete.vehiculo === vehicleFilter
      )
    }

    if (scannedFilter) {
      const isScanned = scannedFilter === 'true'
      filteredPaquetes = filteredPaquetes.filter(paquete =>
        paquete.escaneado === isScanned
      )
    }

    // Calcular estadísticas
    const totalPaquetes = filteredPaquetes.length
    const totalPages = Math.ceil(totalPaquetes / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit

    // Paginar resultados
    const paginatedPaquetes = filteredPaquetes.slice(startIndex, endIndex)

    // Calcular estadísticas por vehículo
    const vehiculosMap = new Map<string, { total: number; escaneados: number; pendientes: number }>()
    filteredPaquetes.forEach(paquete => {
      const existing = vehiculosMap.get(paquete.vehiculo) || { total: 0, escaneados: 0, pendientes: 0 }
      existing.total++
      if (paquete.escaneado) {
        existing.escaneados++
      } else {
        existing.pendientes++
      }
      vehiculosMap.set(paquete.vehiculo, existing)
    })

    const vehiculos = Array.from(vehiculosMap.entries()).map(([vehiculo, stats]) => ({
      vehiculo,
      total: stats.total,
      escaneados: stats.escaneados,
      pendientes: stats.pendientes,
      porcentaje: stats.total > 0 ? Math.round((stats.escaneados / stats.total) * 100) : 0
    }))

    // Estadísticas generales
    const paquetesEscaneados = filteredPaquetes.filter(p => p.escaneado).length
    const paquetesPendientes = totalPaquetes - paquetesEscaneados

    return NextResponse.json({
      paquetes: paginatedPaquetes,
      pagination: {
        page,
        limit,
        totalPages,
        totalItems: totalPaquetes,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      stats: {
        totalPaquetes,
        paquetesEscaneados,
        paquetesPendientes,
        vehiculos
      },
      filters: {
        search,
        vehicle: vehicleFilter,
        scanned: scannedFilter
      }
    })

  } catch (error: any) {
    console.error('Error obteniendo paquetes de clasificación:', error)
    return NextResponse.json({ 
      error: 'Error al obtener paquetes',
      details: error.message 
    }, { status: 500 })
  }
}