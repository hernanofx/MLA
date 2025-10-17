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

    // Preparar datos para el Excel
    const excelData = scannedPackages.map(pkg => ({
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
    }))

    // Crear workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Verificación')

    // Agregar hoja de resumen
    const stats = {
      'Total Escaneados': scannedPackages.length,
      'OK': scannedPackages.filter(p => p.status === 'OK').length,
      'Sobrantes': scannedPackages.filter(p => p.status === 'SOBRANTE').length,
      'Fuera de Cobertura': scannedPackages.filter(p => p.status === 'FUERA_COBERTURA').length,
      'Previos': scannedPackages.filter(p => p.status === 'PREVIO').length,
    }

    const statsData = Object.entries(stats).map(([key, value]) => ({
      'Métrica': key,
      'Cantidad': value,
      'Porcentaje': scannedPackages.length > 0 
        ? `${((value / scannedPackages.length) * 100).toFixed(2)}%` 
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
