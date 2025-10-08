import { PrismaClient } from './app/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  // Get the first user and update their role to admin
  const firstUser = await prisma.user.findFirst()

  if (firstUser) {
    await prisma.user.update({
      where: { id: firstUser.id },
      data: { role: 'admin' }
    })
    console.log(`Updated user ${firstUser.email} to admin role`)
  } else {
    console.log('No users found in database')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })