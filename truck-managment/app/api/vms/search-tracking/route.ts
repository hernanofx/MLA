import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getVMSProviderId, verifyProviderAccess } from '@/lib/vms-auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const trackingNumber = searchParams.get('tracking')

    if (!trackingNumber || trackingNumber.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Tracking number requerido' 
      }, { status: 400 })
    }

    const trimmedTracking = trackingNumber.trim().toUpperCase()

    // Obtener providerId del usuario (multi-tenant)
    const providerId = await getVMSProviderId(session)

    // Buscar en la tabla de clasificación de paquetes
    const paqueteClasificado = await prisma.paqueteClasificacion.findFirst({
      where: {
        trackingNumber: trimmedTracking,
        clasificacion: {
          providerId: providerId || undefined // Si es admin, buscar en todos
        }
      },
      include: {
        clasificacion: {
          include: {
            shipment: {
              include: {
                provider: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!paqueteClasificado) {
      return NextResponse.json({ 
        found: false,
        message: 'Tracking number no encontrado en clasificaciones'
      })
    }

    // Verificar acceso multi-tenant (excepto admin)
    if (providerId) {
      verifyProviderAccess(paqueteClasificado.clasificacion.providerId, providerId)
    }

    // Formatear respuesta con la información solicitada
    const result = {
      found: true,
      trackingNumber: paqueteClasificado.trackingNumber,
      lote: {
        id: paqueteClasificado.clasificacion.shipmentId,
        fecha: paqueteClasificado.clasificacion.shipment.shipmentDate,
        fechaFormateada: new Date(paqueteClasificado.clasificacion.shipment.shipmentDate).toLocaleDateString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      },
      transporte: {
        vehiculo: paqueteClasificado.vehiculo,
        orden: paqueteClasificado.ordenNumerico,
        ordenVisita: paqueteClasificado.ordenVisita
      },
      proveedor: paqueteClasificado.clasificacion.shipment.provider.name,
      clasificacion: {
        id: paqueteClasificado.clasificacionId,
        uploadedAt: paqueteClasificado.clasificacion.uploadedAt,
        finalizado: paqueteClasificado.clasificacion.finalizado
      },
      escaneo: {
        escaneado: paqueteClasificado.escaneado,
        escaneadoAt: paqueteClasificado.escaneadoAt,
        escaneadoPor: paqueteClasificado.escaneadoPor
      }
    }

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Error searching tracking:', error)
    
    if (error.message === 'Acceso denegado') {
      return NextResponse.json({ 
        error: 'No tienes acceso a este tracking' 
      }, { status: 403 })
    }
    
    return NextResponse.json({ 
      error: error.message || 'Error al buscar tracking number' 
    }, { status: 500 })
  }
}
