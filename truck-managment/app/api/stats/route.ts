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

    // Entries by month
    const entriesByMonth = await prisma.$queryRaw`
      SELECT month, COUNT(*) as count
      FROM Entry
      GROUP BY month
      ORDER BY month
    ` as { month: number; count: bigint }[]

    // Entries by provider
    const entriesByProvider = await prisma.$queryRaw`
      SELECT p.name as provider, COUNT(e.id) as count
      FROM Entry e
      JOIN Provider p ON e.providerId = p.id
      GROUP BY p.id, p.name
      ORDER BY count DESC
    ` as { provider: string; count: bigint }[]

    // Average duration
    const avgDuration = await prisma.entry.aggregate({
      _avg: { durationMinutes: true }
    })

    return NextResponse.json({
      entriesByMonth: entriesByMonth.map(item => ({ month: item.month, count: Number(item.count) })),
      entriesByProvider: entriesByProvider.map(item => ({
        provider: item.provider,
        count: Number(item.count)
      })),
      avgDuration: avgDuration._avg.durationMinutes
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}