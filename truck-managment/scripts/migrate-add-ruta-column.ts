import { prisma } from '../lib/prisma'

async function main() {
  console.log('Starting migration: Add ruta column to PreRuteo...')

  try {
    // Agregar columna ruta si no existe
    console.log('Adding ruta column to PreRuteo table...')
    await prisma.$executeRaw`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'PreRuteo' 
          AND column_name = 'ruta'
        ) THEN
          ALTER TABLE "PreRuteo" 
          ADD COLUMN "ruta" TEXT;
        END IF;
      END $$;
    `
    console.log('✓ ruta column added to PreRuteo')

    console.log('\n✓ Migration completed successfully!')

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
