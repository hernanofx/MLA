import { PrismaClient } from '../app/generated/prisma'

const prisma = new PrismaClient()

async function updateUserProvider() {
  const email = process.argv[2]
  const providerName = process.argv[3]

  if (!email || !providerName) {
    console.error('❌ Error: Faltan argumentos')
    console.log('\nUso:')
    console.log('  npx tsx scripts/update-user-provider.ts <email> <providerName>')
    console.log('\nEjemplo:')
    console.log('  npx tsx scripts/update-user-provider.ts usuario@vms.com "Proveedor Test"')
    process.exit(1)
  }

  try {
    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      console.error(`❌ Usuario no encontrado: ${email}`)
      process.exit(1)
    }

    // Buscar o crear el proveedor
    let provider = await prisma.provider.findFirst({
      where: { name: providerName }
    })

    if (!provider) {
      console.log(`📦 Creando proveedor: ${providerName}`)
      provider = await prisma.provider.create({
        data: {
          name: providerName
        }
      })
    } else {
      console.log(`✅ Proveedor encontrado: ${providerName}`)
    }

    // Actualizar usuario con providerId
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        providerId: provider.id,
        role: 'vms'
      }
    })

    console.log('\n✅ Usuario actualizado exitosamente:')
    console.log(`   Email: ${updatedUser.email}`)
    console.log(`   Nombre: ${updatedUser.name}`)
    console.log(`   Rol: ${updatedUser.role}`)
    console.log(`   ProviderId: ${updatedUser.providerId}`)
    console.log(`   Proveedor: ${providerName}`)

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

updateUserProvider()
