import { prisma } from '../lib/prisma'

async function main() {
  console.log('Starting notification migration...')

  try {
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
    console.log('✓ NEW_SHIPMENT added to enum')

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
    console.log('✓ newShipment column added')

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
    console.log('✓ Preferences updated')

    // 4. Verificar los cambios
    const preferencesCount = await prisma.userNotificationPreferences.count()
    console.log(`\n✓ Migration completed successfully!`)
    console.log(`  - Total user preferences updated: ${preferencesCount}`)

  } catch (error) {
    console.error('Error during migration:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .then(() => {
    console.log('\n✅ All done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  })
