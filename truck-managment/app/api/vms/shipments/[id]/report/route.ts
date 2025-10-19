import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getVMSProviderId, verifyProviderAccess } from '@/lib/vms-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener providerId del usuario
    const providerId = await getVMSProviderId(session)

    const { id } = await params
    const shipmentId = id

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

    // Obtener todos los paquetes escaneados
    const scannedPackages = await prisma.scannedPackage.findMany({
      where: { shipmentId },
      include: {
        preAlerta: true,
        preRuteo: true,
      }
    })

    // Obtener todas las Pre-Alertas y Pre-Ruteos del shipment
    const preAlertas = await prisma.preAlerta.findMany({
      where: { shipmentId },
      select: { trackingNumber: true }
    })

    const preRuteos = await prisma.preRuteo.findMany({
      where: { shipmentId },
      select: { codigoPedido: true }
    })

    // Crear sets para comparación rápida
    const preAlertaTracking = new Set(preAlertas.map(pa => pa.trackingNumber))
    const preRuteoTracking = new Set(preRuteos.map(pr => pr.codigoPedido))

    // Identificar trackings que están en AMBOS archivos
    const trackingsEnAmbos = preAlertas
      .filter(pa => preRuteoTracking.has(pa.trackingNumber))
      .map(pa => pa.trackingNumber)

    // Crear set de trackings ya escaneados
    const scannedTrackings = new Set(scannedPackages.map(p => p.trackingNumber))

    // Contar paquetes OK (escaneados que están en ambos archivos)
    const ok = scannedPackages.filter(p => p.status === 'OK').length

    // Contar FALTANTES (en ambos archivos pero NO escaneados)
    const faltantes = trackingsEnAmbos.filter(tracking => 
      !scannedTrackings.has(tracking)
    ).length

    // Contar paquetes SOBRANTE (escaneados que NO están en ningún archivo)
    const sobrante = scannedPackages.filter(p => p.status === 'SOBRANTE').length

    // Contar FUERA DE COBERTURA (en Pre-Alerta pero NO en Pre-Ruteo)
    const fueraCobertura = preAlertas.filter(pa => 
      !preRuteoTracking.has(pa.trackingNumber)
    ).length

    // Contar PREVIO (en Pre-Ruteo pero NO en Pre-Alerta)
    const previo = preRuteos.filter(pr => 
      !preAlertaTracking.has(pr.codigoPedido)
    ).length

    // Obtener datos detallados de Pre-Alertas y Pre-Ruteos
    const preAlertasWithData = await prisma.preAlerta.findMany({
      where: { shipmentId },
      select: {
        trackingNumber: true,
        buyer: true,
        buyerCity: true,
        weight: true,
        scannedPackage: true
      }
    })

    const preRuteosWithData = await prisma.preRuteo.findMany({
      where: { shipmentId },
      select: {
        codigoPedido: true,
        chofer: true,
        razonSocial: true,
        fechaReparto: true,
        scannedPackage: true
      }
    })

    // Crear estructuras de datos para las diferentes categorías
    const faltantesData = trackingsEnAmbos
      .filter(tracking => !scannedTrackings.has(tracking))
      .map(tracking => {
        const preAlerta = preAlertasWithData.find(pa => pa.trackingNumber === tracking)
        return {
          trackingNumber: tracking,
          buyer: preAlerta?.buyer || '',
          city: preAlerta?.buyerCity || '',
          weight: preAlerta?.weight || 0
        }
      })

    const fueraCoberturaData = preAlertas
      .filter(pa => !preRuteoTracking.has(pa.trackingNumber))
      .map(pa => {
        const preAlerta = preAlertasWithData.find(p => p.trackingNumber === pa.trackingNumber)
        return {
          trackingNumber: pa.trackingNumber,
          buyer: preAlerta?.buyer || '',
          city: preAlerta?.buyerCity || '',
          weight: preAlerta?.weight || 0
        }
      })

    const previoData = preRuteos
      .filter(pr => !preAlertaTracking.has(pr.codigoPedido))
      .map(pr => {
        const preRuteo = preRuteosWithData.find(p => p.codigoPedido === pr.codigoPedido)
        return {
          trackingNumber: pr.codigoPedido,
          chofer: preRuteo?.chofer || '',
          razonSocial: preRuteo?.razonSocial || '',
          fechaReparto: preRuteo?.fechaReparto
        }
      })

    const sobranteData = scannedPackages
      .filter(p => p.status === 'SOBRANTE')
      .map(p => ({
        trackingNumber: p.trackingNumber
      }))

    const stats = {
      totalScanned: scannedPackages.length,
      ok,
      faltantes,
      sobrante,
      fueraCobertura,
      previo,
      details: scannedPackages,
      faltantesData,
      fueraCoberturaData,
      previoData,
      sobranteData
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
