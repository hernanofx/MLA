import { PrismaClient } from '../app/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10)

  const user = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'admin'
    }
  })

  console.log('User created:', user)

  // Create sample warehouses
  const warehouse1 = await prisma.warehouse.upsert({
    where: { name: 'Almacén Central' },
    update: {},
    create: {
      name: 'Almacén Central',
      address: 'Calle Principal 123, Ciudad Central',
      description: 'Almacén principal para distribución nacional'
    }
  })

  const warehouse2 = await prisma.warehouse.upsert({
    where: { name: 'Almacén Norte' },
    update: {},
    create: {
      name: 'Almacén Norte',
      address: 'Avenida Norte 456, Zona Industrial',
      description: 'Almacén regional norte'
    }
  })

  console.log('Warehouses created:', { warehouse1, warehouse2 })

  // Create sample locations
  const location1 = await prisma.location.create({
    data: {
      warehouseId: warehouse1.id,
      name: 'Estante A1',
      description: 'Estante principal - Nivel 1'
    }
  })

  const location2 = await prisma.location.create({
    data: {
      warehouseId: warehouse1.id,
      name: 'Estante B2',
      description: 'Estante secundario - Nivel 2'
    }
  })

  const location3 = await prisma.location.create({
    data: {
      warehouseId: warehouse2.id,
      name: 'Zona Carga Norte',
      description: 'Área de carga y descarga'
    }
  })

  console.log('Locations created:', { location1, location2, location3 })

  // Create sample providers
  const provider1 = await prisma.provider.upsert({
    where: { name: 'Proveedor ABC' },
    update: {},
    create: {
      name: 'Proveedor ABC',
      responsibleId: user.id
    }
  })

  const provider2 = await prisma.provider.upsert({
    where: { name: 'Distribuidora XYZ' },
    update: {},
    create: {
      name: 'Distribuidora XYZ',
      responsibleId: user.id
    }
  })

  console.log('Providers created:', { provider1, provider2 })

  // Create sample trucks
  const truck1 = await prisma.truck.upsert({
    where: { licensePlate: 'ABC-123' },
    update: {},
    create: {
      licensePlate: 'ABC-123'
    }
  })

  const truck2 = await prisma.truck.upsert({
    where: { licensePlate: 'XYZ-456' },
    update: {},
    create: {
      licensePlate: 'XYZ-456'
    }
  })

  console.log('Trucks created:', { truck1, truck2 })

  // Create sample entries
  const entry1 = await prisma.entry.create({
    data: {
      providerId: provider1.id,
      truckId: truck1.id,
      arrivalTime: new Date('2025-10-10T08:00:00Z'),
      departureTime: new Date('2025-10-10T10:00:00Z'),
      week: 41,
      month: 10,
      durationMinutes: 120
    }
  })

  const entry2 = await prisma.entry.create({
    data: {
      providerId: provider2.id,
      truckId: truck2.id,
      arrivalTime: new Date('2025-10-10T14:00:00Z'),
      departureTime: new Date('2025-10-10T16:30:00Z'),
      week: 41,
      month: 10,
      durationMinutes: 150
    }
  })

  console.log('Entries created:', { entry1, entry2 })

  // Create sample inventory
  const inventory1 = await prisma.inventory.create({
    data: {
      entryId: entry1.id,
      locationId: location1.id,
      quantity: 50,
      status: 'stored'
    }
  })

  const inventory2 = await prisma.inventory.create({
    data: {
      entryId: entry2.id,
      locationId: location2.id,
      quantity: 75,
      status: 'stored'
    }
  })

  const inventory3 = await prisma.inventory.create({
    data: {
      entryId: entry1.id,
      locationId: location3.id,
      quantity: 25,
      status: 'shipped'
    }
  })

  console.log('Inventory created:', { inventory1, inventory2, inventory3 })

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })