import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { shipmentId, trackingNumber } = await request.json()
    
    if (!shipmentId || !trackingNumber) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
    }

    // Buscar en pre-alerta
    const preAlerta = await prisma.preAlerta.findFirst({
      where: {
        shipmentId,
        trackingNumber: trackingNumber.trim()
      }
    })

    // Buscar en pre-ruteo (codigoPedido es el tracking number)
    const preRuteo = await prisma.preRuteo.findFirst({
      where: {
        shipmentId,
        codigoPedido: trackingNumber.trim()
      }
    })

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

    // Registrar el paquete escaneado
    const scannedPackage = await prisma.scannedPackage.create({
      data: {
        shipmentId,
        trackingNumber: trackingNumber.trim(),
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

    // Marcar como verificados
    if (preAlerta) {
      await prisma.preAlerta.update({
        where: { id: preAlerta.id },
        data: {
          verified: true,
          verificationStatus: status
        }
      })
    }

    if (preRuteo) {
      await prisma.preRuteo.update({
        where: { id: preRuteo.id },
        data: {
          verified: true,
          verificationStatus: status
        }
      })
    }

    return NextResponse.json({
      status,
      details: {
        preAlerta: preAlerta ? {
          buyer: preAlerta.buyer,
          city: preAlerta.buyerCity,
          weight: preAlerta.weight,
        } : null,
        preRuteo: preRuteo ? {
          razonSocial: preRuteo.razonSocial,
          domicilio: preRuteo.domicilio,
          chofer: preRuteo.chofer,
        } : null,
      },
      scannedPackage
    })

  } catch (error: any) {
    console.error('Error scanning package:', error)
    return NextResponse.json(
      { error: error.message || 'Error al escanear el paquete' },
      { status: 500 }
    )
  }
}
