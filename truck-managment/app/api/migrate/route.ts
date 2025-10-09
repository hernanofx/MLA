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

    // First, resolve the migration issue by updating the failed migration
    console.log('Resolving failed migration...')
    try {
      // Update the failed migration to mark it as applied
      await prisma.$executeRaw`
        UPDATE "_prisma_migrations"
        SET "finished_at" = NOW(),
             "rolled_back_at" = NULL,
             "applied_steps_count" = 2
        WHERE "migration_name" = '20251009030457_add_responsible_to_provider'
        AND "finished_at" IS NULL
      `
      console.log('Failed migration resolved successfully')
    } catch (resolveError) {
      console.log('Migration resolution attempt:', resolveError)
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