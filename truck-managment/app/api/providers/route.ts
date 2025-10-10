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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const [providers, total] = await Promise.all([
      prisma.provider.findMany({
        orderBy: { name: 'asc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: { contacts: true }
          },
          responsible: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.provider.count()
    ])

    return NextResponse.json({
      providers,
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

    const { name, responsibleId } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const provider = await prisma.provider.create({
      data: { 
        name,
        responsibleId: responsibleId || null
      },
      include: {
        responsible: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Create notifications for subscribed users
    const subscribedUsers = await prisma.userNotificationPreferences.findMany({
      where: { newProvider: true },
      select: { userId: true }
    })

    if (subscribedUsers.length > 0) {
      await prisma.notification.createMany({
        data: subscribedUsers.map(user => ({
          type: 'NEW_PROVIDER',
          message: `Nuevo proveedor creado: ${provider.name}`,
          userId: user.userId
        }))
      })
    }

    return NextResponse.json(provider, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}