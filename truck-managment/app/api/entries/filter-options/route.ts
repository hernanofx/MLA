import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get distinct weeks and months from entries
    const weeksResult = await prisma.entry.findMany({
      select: { week: true },
      distinct: ['week'],
      orderBy: { week: 'desc' }
    })

    const monthsResult = await prisma.entry.findMany({
      select: { month: true },
      distinct: ['month'],
      orderBy: { month: 'desc' }
    })

    const weeks = weeksResult.map(item => item.week)
    const months = monthsResult.map(item => item.month)

    return NextResponse.json({
      weeks,
      months
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}