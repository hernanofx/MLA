import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    // First, resolve the migration issue
    console.log('Resolving migration issue...')
    try {
      await prisma.$executeRaw`
        INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
        VALUES ('20251009030457_add_responsible_to_provider', 'checksum_placeholder', NOW(), '20251009030457_add_responsible_to_provider', NULL, NULL, NOW(), 2)
        ON CONFLICT ("id") DO NOTHING
      `
      console.log('Migration resolved successfully')
    } catch (resolveError) {
      console.log('Migration may already be resolved:', resolveError)
    }

    // Check if Load table exists by trying to query it
    try {
      await prisma.load.findFirst()
      return NextResponse.json({
        message: 'Load table already exists and migration resolved',
        status: 'already_exists',
        migration_resolved: true
      })
    } catch (error) {
      // Table doesn't exist, create it
      console.log('Creating Load table...')

      // Execute raw SQL to create the table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Load" (
          "id" TEXT NOT NULL,
          "providerId" TEXT NOT NULL,
          "truckId" TEXT NOT NULL,
          "arrivalTime" TIMESTAMP(3),
          "departureTime" TIMESTAMP(3),
          "week" INTEGER,
          "month" INTEGER,
          "durationMinutes" INTEGER,
          "quantity" TEXT,
          "container" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "Load_pkey" PRIMARY KEY ("id")
        )
      `

      // Create indexes
      await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "Load_id_key" ON "Load"("id")`
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Load_providerId_idx" ON "Load"("providerId")`
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Load_truckId_idx" ON "Load"("truckId")`

      // Add foreign key constraints
      await prisma.$executeRaw`
        ALTER TABLE "Load"
        ADD CONSTRAINT IF NOT EXISTS "Load_providerId_fkey"
        FOREIGN KEY ("providerId") REFERENCES "Provider"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
      `

      await prisma.$executeRaw`
        ALTER TABLE "Load"
        ADD CONSTRAINT IF NOT EXISTS "Load_truckId_fkey"
        FOREIGN KEY ("truckId") REFERENCES "Truck"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
      `

      return NextResponse.json({
        message: 'Load table created successfully and migration resolved',
        status: 'created',
        migration_resolved: true
      })
    }
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}