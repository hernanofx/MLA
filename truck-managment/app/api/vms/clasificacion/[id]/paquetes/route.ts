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

    // Retornar los paquetes
    return NextResponse.json({
      paquetes: clasificacion.paquetes
    })

  } catch (error: any) {
    console.error('Error obteniendo paquetes de clasificación:', error)
    return NextResponse.json({ 
      error: 'Error al obtener paquetes',
      details: error.message 
    }, { status: 500 })
  }
}