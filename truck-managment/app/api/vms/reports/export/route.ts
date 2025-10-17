import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const shipmentId = searchParams.get('shipmentId')

    if (!shipmentId) {
      return NextResponse.json({ error: 'Falta shipmentId' }, { status: 400 })
    }

    // Obtener todos los paquetes escaneados con sus detalles
    const scannedPackages = await prisma.scannedPackage.findMany({
      where: { shipmentId },
      include: {
        preAlerta: true,
        preRuteo: true,
        scannedByUser: {
          select: {
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        scanTimestamp: 'asc'
      }
    })

    // Obtener todas las Pre-Alertas y Pre-Ruteos del shipment con TODOS sus datos
    const preAlertas = await prisma.preAlerta.findMany({
      where: { shipmentId }
    })

    const preRuteos = await prisma.preRuteo.findMany({
      where: { shipmentId }
    })

    // Crear maps para acceso rápido
    const preAlertaMap = new Map(preAlertas.map(pa => [pa.trackingNumber, pa]))
    const preRuteoMap = new Map(preRuteos.map(pr => [pr.codigoPedido, pr]))

    // Crear sets para comparación
    const preAlertaTracking = new Set(preAlertas.map(pa => pa.trackingNumber))
    const preRuteoTracking = new Set(preRuteos.map(pr => pr.codigoPedido))

    // Crear set de trackings ya escaneados
    const scannedTrackings = new Set(scannedPackages.map(p => p.trackingNumber))

    // Preparar datos para el Excel - TODOS los paquetes
    const excelData: any[] = []

    // 1. Agregar paquetes ESCANEADOS
    scannedPackages.forEach(pkg => {
      excelData.push({
        'Tracking Number': pkg.trackingNumber,
        'Estado': pkg.status,
        'Fecha Escaneo': new Date(pkg.scanTimestamp).toLocaleString('es-AR'),
        'Escaneado Por': pkg.scannedByUser.name || pkg.scannedByUser.email,
        
        // Datos Pre-Alerta
        'PA - Cliente': pkg.preAlerta?.buyer || '',
        'PA - Ciudad': pkg.preAlerta?.buyerCity || '',
        'PA - Dirección': pkg.preAlerta?.buyerAddress1 || '',
        'PA - CP': pkg.preAlerta?.buyerZip || '',
        'PA - Peso': pkg.preAlerta?.weight || '',
        'PA - Valor': pkg.preAlerta?.value || '',
        
        // Datos Pre-Ruteo
        'PR - Razón Social': pkg.preRuteo?.razonSocial || '',
        'PR - Domicilio': pkg.preRuteo?.domicilio || '',
        'PR - Chofer': pkg.preRuteo?.chofer || '',
        'PR - Fecha Reparto': pkg.preRuteo?.fechaReparto ? new Date(pkg.preRuteo.fechaReparto).toLocaleDateString('es-AR') : '',
        'PR - Peso (kg)': pkg.preRuteo?.pesoKg || '',
      })
    })

    // 2. Agregar paquetes FALTANTES (en ambos pero no escaneados)
    preAlertas.forEach(pa => {
      if (preRuteoTracking.has(pa.trackingNumber) && !scannedTrackings.has(pa.trackingNumber)) {
        const pr = preRuteoMap.get(pa.trackingNumber)
        excelData.push({
          'Tracking Number': pa.trackingNumber,
          'Estado': 'FALTANTE',
          'Fecha Escaneo': '',
          'Escaneado Por': '',
          
          // Datos Pre-Alerta
          'PA - Cliente': pa.buyer || '',
          'PA - Ciudad': pa.buyerCity || '',
          'PA - Dirección': pa.buyerAddress1 || '',
          'PA - CP': pa.buyerZip || '',
          'PA - Peso': pa.weight || '',
          'PA - Valor': pa.value || '',
          
          // Datos Pre-Ruteo
          'PR - Razón Social': pr?.razonSocial || '',
          'PR - Domicilio': pr?.domicilio || '',
          'PR - Chofer': pr?.chofer || '',
          'PR - Fecha Reparto': pr?.fechaReparto ? new Date(pr.fechaReparto).toLocaleDateString('es-AR') : '',
          'PR - Peso (kg)': pr?.pesoKg || '',
        })
      }
    })

    // 3. Agregar paquetes FUERA DE COBERTURA (solo en Pre-Alerta)
    preAlertas.forEach(pa => {
      if (!preRuteoTracking.has(pa.trackingNumber)) {
        excelData.push({
          'Tracking Number': pa.trackingNumber,
          'Estado': 'FUERA_COBERTURA',
          'Fecha Escaneo': '',
          'Escaneado Por': '',
          
          // Datos Pre-Alerta
          'PA - Cliente': pa.buyer || '',
          'PA - Ciudad': pa.buyerCity || '',
          'PA - Dirección': pa.buyerAddress1 || '',
          'PA - CP': pa.buyerZip || '',
          'PA - Peso': pa.weight || '',
          'PA - Valor': pa.value || '',
          
          // Datos Pre-Ruteo
          'PR - Razón Social': '',
          'PR - Domicilio': '',
          'PR - Chofer': '',
          'PR - Fecha Reparto': '',
          'PR - Peso (kg)': '',
        })
      }
    })

    // 4. Agregar paquetes PREVIO (solo en Pre-Ruteo)
    preRuteos.forEach(pr => {
      if (!preAlertaTracking.has(pr.codigoPedido)) {
        excelData.push({
          'Tracking Number': pr.codigoPedido,
          'Estado': 'PREVIO',
          'Fecha Escaneo': '',
          'Escaneado Por': '',
          
          // Datos Pre-Alerta
          'PA - Cliente': '',
          'PA - Ciudad': '',
          'PA - Dirección': '',
          'PA - CP': '',
          'PA - Peso': '',
          'PA - Valor': '',
          
          // Datos Pre-Ruteo
          'PR - Razón Social': pr.razonSocial || '',
          'PR - Domicilio': pr.domicilio || '',
          'PR - Chofer': pr.chofer || '',
          'PR - Fecha Reparto': pr.fechaReparto ? new Date(pr.fechaReparto).toLocaleDateString('es-AR') : '',
          'PR - Peso (kg)': pr.pesoKg || '',
        })
      }
    })

    // Crear workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Verificación')

    // Calcular estadísticas correctas
    const ok = scannedPackages.filter(p => p.status === 'OK').length
    const trackingsEnAmbos = preAlertas.filter(pa => preRuteoTracking.has(pa.trackingNumber)).map(pa => pa.trackingNumber)
    const faltantes = trackingsEnAmbos.filter(tracking => !scannedTrackings.has(tracking)).length
    const sobrante = scannedPackages.filter(p => p.status === 'SOBRANTE').length
    const fueraCobertura = preAlertas.filter(pa => !preRuteoTracking.has(pa.trackingNumber)).length
    const previo = preRuteos.filter(pr => !preAlertaTracking.has(pr.codigoPedido)).length
    const totalPaquetes = ok + faltantes + sobrante + fueraCobertura + previo

    // Agregar hoja de resumen
    const stats = {
      'Total Escaneados': scannedPackages.length,
      'OK': ok,
      'Faltantes': faltantes,
      'Sobrantes': sobrante,
      'Fuera de Cobertura': fueraCobertura,
      'Previos': previo,
    }

    const statsData = Object.entries(stats).map(([key, value]) => ({
      'Métrica': key,
      'Cantidad': value,
      'Porcentaje': totalPaquetes > 0 
        ? `${((value / totalPaquetes) * 100).toFixed(2)}%` 
        : '0%'
    }))

    const statsWorksheet = XLSX.utils.json_to_sheet(statsData)
    XLSX.utils.book_append_sheet(workbook, statsWorksheet, 'Resumen')

    // Generar el buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Retornar el archivo
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="reporte-verificacion-${shipmentId}.xlsx"`
      }
    })

  } catch (error: any) {
    console.error('Error exporting report:', error)
    return NextResponse.json(
      { error: error.message || 'Error al exportar el reporte' },
      { status: 500 }
    )
  }
}
