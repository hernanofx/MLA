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

    // Obtener providerId del usuario (multi-tenant)
    const providerId = await getVMSProviderId(session)

    const { clasificacionId, trackingNumber } = await request.json()

    if (!clasificacionId || !trackingNumber) {
      return NextResponse.json({ 
        error: 'clasificacionId y trackingNumber requeridos' 
      }, { status: 400 })
    }

    const trimmedTracking = trackingNumber.trim()

    // Verificar que la clasificación existe y el usuario tiene acceso
    const clasificacion = await prisma.clasificacionArchivo.findUnique({
      where: { id: clasificacionId },
      select: { 
        providerId: true,
        shipmentId: true
      }
    })

    if (!clasificacion) {
      return NextResponse.json({ 
        error: 'Clasificación no encontrada' 
      }, { status: 404 })
    }

    // Verificar acceso multi-tenant
    verifyProviderAccess(clasificacion.providerId, providerId)

    // Buscar el paquete en la clasificación
    const paquete = await prisma.paqueteClasificacion.findUnique({
      where: {
        clasificacionId_trackingNumber: {
          clasificacionId,
          trackingNumber: trimmedTracking
        }
      }
    })

    if (!paquete) {
      return NextResponse.json({
        success: false,
        status: 'NO_ENCONTRADO',
        message: 'Paquete no está en la clasificación o no estaba OK en el lote'
      }, { status: 200 })
    }

    // Verificar si ya fue escaneado
    if (paquete.escaneado) {
      return NextResponse.json({
        success: false,
        status: 'YA_ESCANEADO',
        message: 'Este paquete ya fue clasificado',
        data: {
          trackingNumber: paquete.trackingNumber,
          vehiculo: paquete.vehiculo,
          ordenVisita: paquete.ordenVisita,
          ordenNumerico: paquete.ordenNumerico,
          escaneadoAt: paquete.escaneadoAt,
          escaneadoPor: paquete.escaneadoPor
        }
      }, { status: 200 })
    }

    // Actualizar como escaneado
    const updated = await prisma.paqueteClasificacion.update({
      where: { id: paquete.id },
      data: {
        escaneado: true,
        escaneadoAt: new Date(),
        escaneadoPor: session.user.email || session.user.name || 'unknown'
      }
    })

    return NextResponse.json({
      success: true,
      status: 'CLASIFICADO',
      message: 'Paquete clasificado correctamente',
      data: {
        trackingNumber: updated.trackingNumber,
        vehiculo: updated.vehiculo,
        ordenVisita: updated.ordenVisita,
        ordenNumerico: updated.ordenNumerico,
        escaneadoAt: updated.escaneadoAt
      }
    })

  } catch (error: any) {
    console.error('Error scanning clasificación:', error)
    return NextResponse.json({ 
      error: 'Error al escanear',
      details: error.message 
    }, { status: 500 })
  }
}
