import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const week = searchParams.get('week')
    const month = searchParams.get('month')
    const providerId = searchParams.get('providerId')

    // Build where conditions for filtering
    let whereConditions = ''
    const params: any[] = []

    if (week) {
      whereConditions += ' AND week = $' + (params.length + 1)
      params.push(parseInt(week))
    }

    if (month) {
      whereConditions += ' AND month = $' + (params.length + 1)
      params.push(parseInt(month))
    }

    if (providerId) {
      whereConditions += ' AND "providerId" = $' + (params.length + 1)
      params.push(providerId)
    }

    // Entries by month (filtered)
    const entriesByMonthQuery = `
      SELECT month, COUNT(*) as count
      FROM "Entry"
      WHERE 1=1 ${whereConditions}
      GROUP BY month
      ORDER BY month
    `

    const entriesByMonth = await prisma.$queryRawUnsafe(
      entriesByMonthQuery,
      ...params
    ) as { month: number; count: bigint }[]

    // Entries by provider (filtered)
    const entriesByProviderQuery = `
      SELECT p.name as provider, COUNT(e.id) as count
      FROM "Entry" e
      JOIN "Provider" p ON e."providerId" = p.id
      WHERE 1=1 ${whereConditions}
      GROUP BY p.id, p.name
      ORDER BY count DESC
    `

    const entriesByProvider = await prisma.$queryRawUnsafe(
      entriesByProviderQuery,
      ...params
    ) as { provider: string; count: bigint }[]

    // Trucks by month (filtered) - each entry represents one truck
    const trucksByMonthQuery = `
      SELECT month, COUNT(*) as count
      FROM "Entry"
      WHERE 1=1 ${whereConditions}
      GROUP BY month
      ORDER BY month
    `

    const trucksByMonth = await prisma.$queryRawUnsafe(
      trucksByMonthQuery,
      ...params
    ) as { month: number; count: bigint }[]

    // Average duration (filtered)
    const avgDurationWhere: any = {}
    if (week) avgDurationWhere.week = parseInt(week)
    if (month) avgDurationWhere.month = parseInt(month)
    if (providerId) avgDurationWhere.providerId = providerId

    const avgDuration = await prisma.entry.aggregate({
      where: avgDurationWhere,
      _avg: { durationMinutes: true }
    })

    return NextResponse.json({
      entriesByMonth: entriesByMonth.map(item => ({ month: item.month, count: Number(item.count) })),
      entriesByProvider: entriesByProvider.map(item => ({
        provider: item.provider,
        count: Number(item.count)
      })),
      trucksByMonth: trucksByMonth.map(item => ({ month: item.month, count: Number(item.count) })),
      avgDuration: avgDuration._avg.durationMinutes
    })
  } catch (error) {
    console.error('Error in stats API:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}