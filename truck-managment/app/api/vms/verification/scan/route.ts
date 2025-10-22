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

    // Obtener providerId del usuario
    const providerId = await getVMSProviderId(session)

    const { shipmentId, trackingNumber } = await request.json()
    
    if (!shipmentId || !trackingNumber) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
    }

    // Validar que el tracking number comience con los prefijos válidos
    const trimmedTracking = trackingNumber.trim().toUpperCase()
    const validPrefixes = ['MLAR', 'SEKA', 'RR']
    const hasValidPrefix = validPrefixes.some(prefix => trimmedTracking.startsWith(prefix))
    
    if (!hasValidPrefix) {
      return NextResponse.json({ 
        error: 'PAQUETE_NO_MLA',
        message: 'PAQUETE NO DE MLA' 
      }, { status: 400 })
    }

    // Verificar que el shipment pertenece al proveedor
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      select: { providerId: true }
    })

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment no encontrado' }, { status: 404 })
    }

    // Verificar acceso al shipment
    verifyProviderAccess(shipment.providerId, providerId)

    // Buscar en pre-alerta y pre-ruteo en paralelo
    const [preAlerta, preRuteo] = await Promise.all([
      prisma.preAlerta.findFirst({
        where: {
          shipmentId,
          trackingNumber: trimmedTracking
        }
      }),
      prisma.preRuteo.findFirst({
        where: {
          shipmentId,
          codigoPedido: trimmedTracking
        }
      })
    ])

    // Determinar el estado según la lógica de negocio
    let status: 'OK' | 'SOBRANTE' | 'FUERA_COBERTURA' | 'PREVIO'
    
    if (preAlerta && preRuteo) {
      status = 'OK' // Está en ambos archivos
    } else if (!preAlerta && !preRuteo) {
      status = 'SOBRANTE' // No está en ninguno
    } else if (preAlerta && !preRuteo) {
      status = 'FUERA_COBERTURA' // En pre-alerta pero no en pre-ruteo
    } else {
      status = 'PREVIO' // En pre-ruteo pero no en pre-alerta
    }

    // Intentar registrar el paquete escaneado
    // El constraint único en BD previene duplicados incluso en race conditions
    try {
      const scannedPackage = await prisma.scannedPackage.create({
        data: {
          shipmentId,
          trackingNumber: trimmedTracking,
          scannedBy: session.user.id,
          status,
          preAlertaId: preAlerta?.id || null,
          preRuteoId: preRuteo?.id || null,
        },
        include: {
          preAlerta: true,
          preRuteo: true,
        }
      })

      // Marcar como verificados en paralelo
      const updatePromises = []
      
      if (preAlerta) {
        updatePromises.push(
          prisma.preAlerta.update({
            where: { id: preAlerta.id },
            data: {
              verified: true,
              verificationStatus: status
            }
          })
        )
      }

      if (preRuteo) {
        updatePromises.push(
          prisma.preRuteo.update({
            where: { id: preRuteo.id },
            data: {
              verified: true,
              verificationStatus: status
            }
          })
        )
      }

      await Promise.all(updatePromises)

      return NextResponse.json({
        status,
        details: {
          preAlerta: preAlerta ? {
            buyer: preAlerta.buyer,
            city: preAlerta.buyerCity,
            weight: preAlerta.weight,
          } : null,
          preRuteo: preRuteo ? {
            ruta: preRuteo.ruta,
            razonSocial: preRuteo.razonSocial,
            domicilio: preRuteo.domicilio,
            chofer: preRuteo.chofer,
          } : null,
        },
        scannedPackage,
        scannedBy: session.user.name || session.user.email
      })

    } catch (dbError: any) {
      // Si es error de constraint único (código P2002 de Prisma)
      // Esto maneja race conditions cuando múltiples dispositivos escanean el mismo código
      if (dbError.code === 'P2002') {
        // Buscar quién lo escaneó primero para informar al usuario
        const existingScanned = await prisma.scannedPackage.findFirst({
          where: {
            shipmentId,
            trackingNumber: trimmedTracking
          },
          include: {
            scannedByUser: {
              select: { name: true, email: true }
            }
          }
        })

        return NextResponse.json({ 
          error: 'PAQUETE_YA_ESCANEADO',
          message: 'PAQUETE YA ESCANEADO',
          scannedAt: existingScanned?.scanTimestamp,
          scannedBy: existingScanned?.scannedByUser?.name || existingScanned?.scannedByUser?.email
        }, { status: 400 })
      }
      
      // Si es otro error de BD, re-lanzar para el catch general
      throw dbError
    }

  } catch (error: any) {
    console.error('Error scanning package:', error)
    return NextResponse.json(
      { error: error.message || 'Error al escanear el paquete' },
      { status: 500 }
    )
  }
}
