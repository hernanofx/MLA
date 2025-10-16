import { PrismaClient } from '../app/generated/prisma';

const prisma = new PrismaClient();

async function migratePackages() {
  console.log('Starting package migration...');

  const inventories = await prisma.inventory.findMany({
    where: {
      trackingNumbers: { not: null },
    },
    include: {
      location: true,
    },
  });

  for (const inventory of inventories) {
    if (!inventory.trackingNumbers) continue;

    const trackingList = inventory.trackingNumbers.split(',').map(t => t.trim()).filter(t => t);
    if (trackingList.length === 0) continue;

    console.log(`Migrating inventory ${inventory.id} with ${trackingList.length} packages`);

    for (const tracking of trackingList) {
      // Check if package already exists
      const existing = await prisma.package.findUnique({
        where: { trackingNumber: tracking },
      });

      if (!existing) {
        await prisma.package.create({
          data: {
            inventoryId: inventory.id,
            trackingNumber: tracking,
            currentProviderId: inventory.providerId,
            currentLocationId: inventory.locationId,
            status: 'almacenado',
          },
        });

        // Create initial movement
        const pkg = await prisma.package.findUnique({
          where: { trackingNumber: tracking },
        });

        if (pkg) {
          await prisma.packageMovement.create({
            data: {
              packageId: pkg.id,
              toProviderId: inventory.providerId,
              toLocationId: inventory.locationId,
              action: 'ingreso',
              notes: 'Migración desde inventario existente',
            },
          });
        }
      }
    }
  }

  console.log('Migration completed');
}

migratePackages()
  .catch(console.error)
  .finally(() => prisma.$disconnect());