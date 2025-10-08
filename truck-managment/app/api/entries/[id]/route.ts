import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getISOWeek, getMonth } from 'date-fns'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const entry = await prisma.entry.findUnique({
      where: { id },
      include: {
        provider: true,
        truck: true
      }
    })

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    return NextResponse.json(entry)
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { providerId, truckId, arrivalTime, departureTime } = await request.json()
    const { id } = await params

    if (!providerId || !truckId) {
      return NextResponse.json({ error: 'Provider and truck are required' }, { status: 400 })
    }

    // Get the existing entry to calculate week/month if needed
    const existingEntry = await prisma.entry.findUnique({
      where: { id }
    })

    if (!existingEntry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
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

    const entry = await prisma.entry.update({
      where: { id },
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

    return NextResponse.json(entry)
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    await prisma.entry.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Entry deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}