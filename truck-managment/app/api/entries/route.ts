import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getISOWeek, getMonth } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const [entries, total] = await Promise.all([
      prisma.entry.findMany({
        include: {
          provider: true,
          truck: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.entry.count()
    ])

    return NextResponse.json({
      entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { providerId, truckId, arrivalTime, departureTime } = await request.json()

    if (!providerId || !truckId) {
      return NextResponse.json({ error: 'Provider and truck are required' }, { status: 400 })
    }

    const now = new Date()
    const week = getISOWeek(now)
    const month = getMonth(now) + 1 // getMonth is 0-based

    let durationMinutes: number | null = null
    if (arrivalTime && departureTime) {
      const arrival = new Date(arrivalTime)
      const departure = new Date(departureTime)
      durationMinutes = Math.round((departure.getTime() - arrival.getTime()) / (1000 * 60))
    }

    const entry = await prisma.entry.create({
      data: {
        providerId,
        truckId,
        arrivalTime: arrivalTime ? new Date(arrivalTime) : null,
        departureTime: departureTime ? new Date(departureTime) : null,
        week,
        month,
        durationMinutes
      },
      include: {
        provider: true,
        truck: true
      }
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}