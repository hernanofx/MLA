import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get available weeks
    const availableWeeks = await prisma.$queryRaw`
      SELECT DISTINCT week
      FROM "Entry"
      WHERE week IS NOT NULL
      ORDER BY week
    ` as { week: number }[]

    // Get available months
    const availableMonths = await prisma.$queryRaw`
      SELECT DISTINCT month
      FROM "Entry"
      WHERE month IS NOT NULL
      ORDER BY month
    ` as { month: number }[]

    // Get available providers
    const availableProviders = await prisma.provider.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({
      weeks: availableWeeks.map(item => item.week),
      months: availableMonths.map(item => item.month),
      providers: availableProviders
    })
  } catch (error) {
    console.error('Error in stats filter options API:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}