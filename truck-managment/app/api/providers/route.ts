import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '1000')
    const skip = (page - 1) * limit

    const search = searchParams.get('search') || ''
    const responsibleId = searchParams.get('responsibleId') || null
    const hasResponsible = searchParams.get('hasResponsible')
    const orderBy = searchParams.get('orderBy') || 'name'
    const orderDirection = searchParams.get('orderDirection') || 'asc'

    // Build where clause
    const where: any = {}
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      }
    }
    if (responsibleId) {
      where.responsibleId = responsibleId
    }
    if (hasResponsible === 'true') {
      where.responsibleId = { not: null }
    } else if (hasResponsible === 'false') {
      where.responsibleId = null
    }

    // Build orderBy
    const orderByClause: any = {}
    if (orderBy === 'name') {
      orderByClause.name = orderDirection
    } else if (orderBy === 'createdAt') {
      orderByClause.createdAt = orderDirection
    }

    const [providers, total] = await Promise.all([
      prisma.provider.findMany({
        where,
        orderBy: orderByClause,
        skip,
        take: limit,
        include: {
          responsible: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              contacts: true
            }
          }
        }
      }),
      prisma.provider.count({ where })
    ])

    // Get statistics
    const [totalWithResponsible, totalWithoutResponsible] = await Promise.all([
      prisma.provider.count({ where: { responsibleId: { not: null } } }),
      prisma.provider.count({ where: { responsibleId: null } })
    ])

    return NextResponse.json({
      providers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        total: totalWithResponsible + totalWithoutResponsible,
        withResponsible: totalWithResponsible,
        withoutResponsible: totalWithoutResponsible
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

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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