import { PrismaClient } from '../app/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createVMSUser() {
  const email = process.argv[2]
  const password = process.argv[3]
  const name = process.argv[4]
  const providerName = process.argv[5]

  if (!email || !password || !name || !providerName) {
    console.error('❌ Error: Faltan argumentos')
    console.log('\nUso:')
    console.log('  npx tsx scripts/create-vms-user.ts <email> <password> <name> <providerName>')
    console.log('\nEjemplo:')
    console.log('  npx tsx scripts/create-vms-user.ts usuario@proveedor.com password123 "Juan Pérez" "Proveedor ABC"')
    process.exit(1)
  }

  try {
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

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      console.log(`⚠️  Usuario ya existe: ${email}`)
      console.log('Actualizando rol y proveedor...')
      
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          role: 'vms',
          providerId: provider.id
        }
      })

      console.log('✅ Usuario actualizado exitosamente:')
      console.log(`   Email: ${updatedUser.email}`)
      console.log(`   Rol: ${updatedUser.role}`)
      console.log(`   Proveedor: ${providerName}`)
    } else {
      // Hashear password
      const hashedPassword = await bcrypt.hash(password, 10)

      // Crear usuario
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: 'vms',
          providerId: provider.id
        }
      })

      console.log('✅ Usuario VMS creado exitosamente:')
      console.log(`   Email: ${user.email}`)
      console.log(`   Nombre: ${user.name}`)
      console.log(`   Rol: ${user.role}`)
      console.log(`   Proveedor: ${providerName}`)
      console.log('\n🔐 Credenciales:')
      console.log(`   Email: ${email}`)
      console.log(`   Password: ${password}`)
      console.log('\n📝 Acceso:')
      console.log(`   URL: /vms`)
    }

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createVMSUser()
