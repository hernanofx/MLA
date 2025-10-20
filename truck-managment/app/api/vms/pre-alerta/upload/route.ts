import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getVMSProviderId } from '@/lib/vms-auth'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener providerId del usuario (lanza error si no tiene permisos)
    const providerId = await getVMSProviderId(session)

    if (!providerId) {
      return NextResponse.json({ error: 'No hay proveedor asignado' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 })
    }

    // Leer el archivo Excel
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer)
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet)

    if (jsonData.length === 0) {
      return NextResponse.json({ error: 'El archivo está vacío' }, { status: 400 })
    }

    // Crear el Shipment vinculado al proveedor del usuario
    const shipment = await prisma.shipment.create({
      data: {
        providerId: providerId,
        createdById: session.user.id,
        status: 'PRE_ALERTA',
      }
    })

    // Insertar las pre-alertas
    const preAlertas = jsonData.map((row: any) => ({
      shipmentId: shipment.id,
      client: String(row['Client'] || ''),
      country: String(row['Country'] || ''),
      trackingNumber: String(row['Tracking Number'] || ''),
      weight: parseFloat(row['Weight']) || 0,
      value: parseFloat(row['Value']) || 0,
      buyerNormalizedId: row['Buyer Normalized ID'] ? String(row['Buyer Normalized ID']) : null,
      buyer: String(row['Buyer'] || ''),
      buyerAddress1: String(row['Buyer Address1'] || ''),
      buyerAddress1Number: row['Buyer Address1 Number'] ? String(row['Buyer Address1 Number']) : null,
      buyerAddress2: row['Buyer Address2'] ? String(row['Buyer Address2']) : null,
      buyerCity: String(row['Buyer City'] || ''),
      buyerState: String(row['Buyer State'] || ''),
      buyerLocation: row['Buyer Lcation'] ? String(row['Buyer Lcation']) : null,
      buyerZip: String(row['Buyer ZIP'] || ''),
      buyerPhone: row['Buyer Phone'] ? String(row['Buyer Phone']) : null,
      buyerEmail: row['Buyer Email'] ? String(row['Buyer Email']) : null,
    }))

    await prisma.preAlerta.createMany({
      data: preAlertas,
      skipDuplicates: true,
    })

    // Create notifications for subscribed users
    const subscribedUsers = await prisma.userNotificationPreferences.findMany({
      where: { newShipment: true },
      select: { userId: true }
    })

    if (subscribedUsers.length > 0) {
      const provider = await prisma.provider.findUnique({
        where: { id: providerId },
        select: { name: true }
      })
      
      await prisma.notification.createMany({
        data: subscribedUsers.map(user => ({
          type: 'NEW_SHIPMENT',
          message: `Nuevo lote cargado por ${provider?.name}: ${preAlertas.length} paquetes`,
          userId: user.userId
        }))
      })
    }

    // Actualizar el estado del shipment
    await prisma.shipment.update({
      where: { id: shipment.id },
      data: { status: 'PRE_ALERTA' }
    })

    return NextResponse.json({
      shipmentId: shipment.id,
      count: preAlertas.length,
      message: 'Pre-alerta cargada exitosamente'
    })

  } catch (error: any) {
    console.error('Error uploading pre-alerta:', error)
    return NextResponse.json(
      { error: error.message || 'Error al procesar el archivo' },
      { status: 500 }
    )
  }
}
