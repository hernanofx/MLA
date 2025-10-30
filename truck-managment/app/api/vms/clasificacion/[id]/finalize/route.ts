import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getVMSProviderId, verifyProviderAccess } from '@/lib/vms-auth'

export async function POST(
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

    // Verificar que la clasificación existe y el usuario tiene acceso
    const clasificacion = await prisma.clasificacionArchivo.findUnique({
      where: { id: clasificacionId },
      select: { 
        providerId: true,
        finalizado: true
      }
    })

    if (!clasificacion) {
      return NextResponse.json({ 
        error: 'Clasificación no encontrada' 
      }, { status: 404 })
    }

    // Verificar acceso multi-tenant
    verifyProviderAccess(clasificacion.providerId, providerId)

    // Verificar que no esté ya finalizada
    if (clasificacion.finalizado) {
      return NextResponse.json({ 
        error: 'Esta clasificación ya fue finalizada' 
      }, { status: 400 })
    }

    // Marcar como finalizada
    const updated = await prisma.clasificacionArchivo.update({
      where: { id: clasificacionId },
      data: {
        finalizado: true,
        finalizadoAt: new Date(),
        finalizadoPor: session.user.email || session.user.name || 'unknown'
      },
      include: {
        paquetes: {
          select: {
            escaneado: true
          }
        }
      }
    })

    // Calcular estadísticas finales
    const totalPaquetes = updated.paquetes.length
    const escaneados = updated.paquetes.filter(p => p.escaneado).length
    const pendientes = totalPaquetes - escaneados

    return NextResponse.json({
      success: true,
      message: 'Clasificación finalizada correctamente',
      stats: {
        totalPaquetes,
        escaneados,
        pendientes,
        porcentaje: totalPaquetes > 0 ? Math.round((escaneados / totalPaquetes) * 100) : 0
      },
      finalizadoAt: updated.finalizadoAt
    })

  } catch (error: any) {
    console.error('Error finalizing clasificación:', error)
    return NextResponse.json({ 
      error: 'Error al finalizar clasificación',
      details: error.message 
    }, { status: 500 })
  }
}
