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

    const load = await prisma.load.findUnique({
      where: { id },
      include: {
        provider: true,
        truck: true
      }
    })

    if (!load) {
      return NextResponse.json({ error: 'Load not found' }, { status: 404 })
    }

    return NextResponse.json(load)
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

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { providerId, truckId, arrivalTime, departureTime, quantity, container } = await request.json()
    const { id } = await params

    if (!providerId || !truckId) {
      return NextResponse.json({ error: 'Provider and truck are required' }, { status: 400 })
    }

    // Get the existing load to calculate week/month if needed
    const existingLoad = await prisma.load.findUnique({
      where: { id }
    })

    if (!existingLoad) {
      return NextResponse.json({ error: 'Load not found' }, { status: 404 })
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

    const load = await prisma.load.update({
      where: { id },
      data: {
        providerId,
        truckId,
        arrivalTime: arrivalTime ? new Date(arrivalTime) : null,
        departureTime: departureTime ? new Date(departureTime) : null,
        week,
        month,
        durationMinutes,
        quantity,
        container
      },
      include: {
        provider: true,
        truck: true
      }
    })

    return NextResponse.json(load)
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

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    await prisma.load.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Load deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}