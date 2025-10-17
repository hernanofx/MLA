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

    // Debug logs
    console.log('📊 Report Stats Debug:', {
      totalPreAlertas: preAlertas.length,
      totalPreRuteos: preRuteos.length,
      trackingsEnAmbos: trackingsEnAmbos.length,
      totalScanned: scannedPackages.length,
      ok,
      faltantes,
      sobrante,
      fueraCobertura,
      previo,
      scannedDetails: scannedPackages.map(p => ({
        tracking: p.trackingNumber,
        status: p.status,
        hasPreAlerta: !!p.preAlertaId,
        hasPreRuteo: !!p.preRuteoId
      }))
    })

    const stats = {
      totalScanned: scannedPackages.length,
      ok,
      faltantes,
      sobrante,
      fueraCobertura,
      previo,
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
