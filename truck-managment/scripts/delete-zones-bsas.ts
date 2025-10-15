import { PrismaClient } from '../app/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('Eliminando registros de Zone con province "Buenos Aires"...')

  const deleted = await prisma.zone.deleteMany({
    where: {
      province: 'Buenos Aires'
    }
  })

  console.log(`Eliminados ${deleted.count} registros de Zone.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })