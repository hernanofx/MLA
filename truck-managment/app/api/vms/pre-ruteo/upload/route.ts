import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getVMSProviderId, verifyProviderAccess } from '@/lib/vms-auth'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener providerId del usuario
    const providerId = await getVMSProviderId(session)

    const formData = await request.formData()
    const file = formData.get('file') as File
    const shipmentId = formData.get('shipmentId') as string
    
    if (!file || !shipmentId) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
    }

    // Verificar que el shipment existe y pertenece al proveedor
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId }
    })

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment no encontrado' }, { status: 404 })
    }

    // Verificar acceso al shipment
    verifyProviderAccess(shipment.providerId, providerId)

    // Leer el archivo Excel
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer)
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet)

    if (jsonData.length === 0) {
      return NextResponse.json({ error: 'El archivo está vacío' }, { status: 400 })
    }

    // Función para parsear fechas de Excel
    const parseExcelDate = (excelDate: any): Date => {
      if (excelDate instanceof Date) return excelDate
      if (typeof excelDate === 'number') {
        // Excel dates are stored as days since 1900-01-01
        const date = new Date((excelDate - 25569) * 86400 * 1000)
        return date
      }
      if (typeof excelDate === 'string') {
        return new Date(excelDate)
      }
      return new Date()
    }

    // Insertar los pre-ruteos
    const preRuteos = jsonData.map((row: any) => ({
      shipmentId: shipmentId,
      codigoCliente: String(row['Código cliente'] || ''),
      razonSocial: String(row['Razón social'] || ''),
      domicilio: String(row['Domicilio'] || ''),
      tipoCliente: String(row['Tipo de Cliente'] || ''),
      fechaReparto: parseExcelDate(row['Fecha de Reparto']),
      codigoReparto: String(row['Codigo Reparto'] || ''),
      maquina: row['Máquina'] ? String(row['Máquina']) : null,
      chofer: row['Chofer'] ? String(row['Chofer']) : null,
      fechaPedido: parseExcelDate(row['Fecha De Pedido']),
      codigoPedido: String(row['Codigo de Pedido'] || ''),
      ventanaHoraria: row['Ventana Horaria'] ? String(row['Ventana Horaria']) : null,
      arribo: row['Arribo'] ? parseExcelDate(row['Arribo']) : null,
      partida: row['Partida'] ? parseExcelDate(row['Partida']) : null,
      pesoKg: row['Peso (kg)'] ? parseFloat(row['Peso (kg)']) : null,
      volumenM3: row['Volumen (m3)'] ? parseFloat(row['Volumen (m3)']) : null,
      dinero: row['Dinero ($)'] ? parseFloat(row['Dinero ($)']) : null,
    }))

    await prisma.preRuteo.createMany({
      data: preRuteos,
      skipDuplicates: true,
    })

    // Actualizar el estado del shipment
    await prisma.shipment.update({
      where: { id: shipmentId },
      data: { status: 'PRE_RUTEO' }
    })

    return NextResponse.json({
      shipmentId: shipmentId,
      count: preRuteos.length,
      message: 'Pre-ruteo cargado exitosamente'
    })

  } catch (error: any) {
    console.error('Error uploading pre-ruteo:', error)
    return NextResponse.json(
      { error: error.message || 'Error al procesar el archivo' },
      { status: 500 }
    )
  }
}
