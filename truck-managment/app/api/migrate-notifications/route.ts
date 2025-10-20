import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Solo admins pueden ejecutar migraciones
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    console.log('Starting notification migration...')

    // 1. Agregar NEW_SHIPMENT al enum NotificationType
    console.log('Adding NEW_SHIPMENT to NotificationType enum...')
    await prisma.$executeRaw`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum 
          WHERE enumlabel = 'NEW_SHIPMENT' 
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'NotificationType')
        ) THEN
          ALTER TYPE "NotificationType" ADD VALUE 'NEW_SHIPMENT';
        END IF;
      END $$;
    `

    // 2. Agregar columna newShipment si no existe
    console.log('Adding newShipment column to UserNotificationPreferences...')
    await prisma.$executeRaw`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'UserNotificationPreferences' 
          AND column_name = 'newShipment'
        ) THEN
          ALTER TABLE "UserNotificationPreferences" 
          ADD COLUMN "newShipment" BOOLEAN NOT NULL DEFAULT false;
        END IF;
      END $$;
    `

    // 3. Actualizar todas las preferencias existentes a false
    console.log('Updating existing preferences to false...')
    await prisma.$executeRaw`
      UPDATE "UserNotificationPreferences" SET 
        "newProvider" = false,
        "newTruck" = false,
        "newEntry" = false,
        "newLoad" = false,
        "newInventory" = false,
        "newZone" = false,
        "editZone" = false,
        "assignProvider" = false,
        "unassignProvider" = false,
        "newShipment" = false
      WHERE "userId" IS NOT NULL;
    `

    // 4. Verificar los cambios
    const preferencesCount = await prisma.userNotificationPreferences.count()

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully!',
      preferencesUpdated: preferencesCount
    })

  } catch (error: any) {
    console.error('Error during migration:', error)
    return NextResponse.json(
      { error: error.message || 'Error al ejecutar la migración' },
      { status: 500 }
    )
  }
}
