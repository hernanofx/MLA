import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const revalidate = 300 // Revalidate every 5 minutes
export const dynamic = 'force-dynamic'

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
    const whereConditions: any = {}

    if (week) {
      whereConditions.week = parseInt(week)
    }

    if (month) {
      whereConditions.month = parseInt(month)
    }

    if (providerId) {
      whereConditions.providerId = providerId
    }

    // Entries by month (filtered)
    const entriesByMonth = await prisma.entry.groupBy({
      by: ['month'],
      where: whereConditions,
      _count: true,
      orderBy: { month: 'asc' }
    })

    // Loads by month (filtered)
    const loadsByMonth = await prisma.load.groupBy({
      by: ['month'],
      where: whereConditions,
      _count: true,
      orderBy: { month: 'asc' }
    })

    // Entries by provider (filtered)
    const entriesByProviderRaw = await prisma.entry.findMany({
      where: whereConditions,
      include: { provider: { select: { name: true } } }
    })
    const entriesByProviderMap = new Map<string, { provider: string; count: number }>()
    entriesByProviderRaw.forEach(entry => {
      const key = entry.provider.name
      if (entriesByProviderMap.has(key)) {
        entriesByProviderMap.get(key)!.count++
      } else {
        entriesByProviderMap.set(key, { provider: key, count: 1 })
      }
    })
    const entriesByProvider = Array.from(entriesByProviderMap.values()).sort((a, b) => b.count - a.count)

    // Loads by provider (filtered)
    const loadsByProviderRaw = await prisma.load.findMany({
      where: whereConditions,
      include: { provider: { select: { name: true } } }
    })
    const loadsByProviderMap = new Map<string, { provider: string; count: number }>()
    loadsByProviderRaw.forEach(load => {
      const key = load.provider.name
      if (loadsByProviderMap.has(key)) {
        loadsByProviderMap.get(key)!.count++
      } else {
        loadsByProviderMap.set(key, { provider: key, count: 1 })
      }
    })
    const loadsByProvider = Array.from(loadsByProviderMap.values()).sort((a, b) => b.count - a.count)

    // Trucks by month (filtered) - each entry represents one truck
    const trucksByMonth = await prisma.entry.groupBy({
      by: ['month'],
      where: whereConditions,
      _count: true,
      orderBy: { month: 'asc' }
    })

    // Trucks by month from loads
    const trucksByMonthLoads = await prisma.load.groupBy({
      by: ['month'],
      where: whereConditions,
      _count: true,
      orderBy: { month: 'asc' }
    })

    // Average duration (filtered)
    const avgDurationWhere: any = {}
    if (week) avgDurationWhere.week = parseInt(week)
    if (month) avgDurationWhere.month = parseInt(month)
    if (providerId) avgDurationWhere.providerId = providerId

    const avgDuration = await prisma.entry.aggregate({
      where: avgDurationWhere,
      _avg: { durationMinutes: true }
    })

    // Average duration for loads
    const avgDurationLoads = await prisma.load.aggregate({
      where: avgDurationWhere,
      _avg: { durationMinutes: true }
    })

    // Average duration by provider for loads (for new chart)
    const loadsByProviderWithDuration = await prisma.load.findMany({
      where: avgDurationWhere,
      select: {
        providerId: true,
        durationMinutes: true,
        provider: {
          select: {
            name: true
          }
        }
      }
    })

    // Calculate average duration per provider
    const providerDurationMap = new Map<string, { name: string; durations: number[] }>()
    loadsByProviderWithDuration.forEach(load => {
      if (load.durationMinutes) {
        const key = load.providerId
        if (!providerDurationMap.has(key)) {
          providerDurationMap.set(key, { name: load.provider.name, durations: [] })
        }
        providerDurationMap.get(key)!.durations.push(load.durationMinutes)
      }
    })

    const avgDurationByProvider = Array.from(providerDurationMap.entries())
      .map(([providerId, data]) => ({
        provider: data.name,
        avgDuration: data.durations.reduce((sum, d) => sum + d, 0) / data.durations.length
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)

    // Average duration trend by provider and month (for trend line)
    const loadsByProviderMonth = await prisma.load.findMany({
      where: {
        durationMinutes: { not: null },
        ...(providerId && { providerId })
      },
      select: {
        providerId: true,
        month: true,
        durationMinutes: true,
        provider: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        month: 'asc'
      }
    })

    // Group by provider and month
    const providerMonthMap = new Map<string, Map<number, number[]>>()
    loadsByProviderMonth.forEach(load => {
      if (load.durationMinutes) {
        const providerKey = `${load.providerId}:${load.provider.name}`
        if (!providerMonthMap.has(providerKey)) {
          providerMonthMap.set(providerKey, new Map())
        }
        const monthMap = providerMonthMap.get(providerKey)!
        if (!monthMap.has(load.month!)) {
          monthMap.set(load.month!, [])
        }
        monthMap.get(load.month!)!.push(load.durationMinutes)
      }
    })

    // Calculate averages per provider per month
    const avgDurationTrendByProvider = Array.from(providerMonthMap.entries()).map(([providerKey, monthMap]) => {
      const [providerId, providerName] = providerKey.split(':')
      const monthlyAvgs = Array.from(monthMap.entries()).map(([month, durations]) => ({
        month,
        avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length
      })).sort((a, b) => a.month - b.month)

      return {
        provider: providerName,
        monthlyData: monthlyAvgs
      }
    })

    return NextResponse.json({
      entriesByMonth: entriesByMonth.map(item => ({ month: item.month, count: item._count })),
      loadsByMonth: loadsByMonth.map(item => ({ month: item.month, count: item._count })),
      entriesByProvider: entriesByProvider.map(item => ({
        provider: item.provider,
        count: item.count
      })),
      loadsByProvider: loadsByProvider.map(item => ({
        provider: item.provider,
        count: item.count
      })),
      trucksByMonth: trucksByMonth.map(item => ({ month: item.month, count: item._count })),
      trucksByMonthLoads: trucksByMonthLoads.map(item => ({ month: item.month, count: item._count })),
      avgDuration: avgDuration._avg.durationMinutes,
      avgDurationLoads: avgDurationLoads._avg.durationMinutes,
      avgDurationByProvider,
      avgDurationTrendByProvider
    })
  } catch (error) {
    console.error('Error in stats API:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}