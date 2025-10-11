import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const skip = (page - 1) * limit
    const locationId = searchParams.get('locationId');
    const entryId = searchParams.get('entryId');
    const providerId = searchParams.get('providerId');
    const warehouseId = searchParams.get('warehouseId');
    const status = searchParams.get('status');

    const where: any = {
      ...(locationId && { locationId }),
      ...(entryId && { entryId }),
      ...(status && { status }),
      ...(providerId && { entry: { providerId } }),
      ...(warehouseId && { location: { warehouseId } }),
    }

    const [inventories, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        include: {
          entry: {
            include: {
              provider: true,
            },
          },
          location: {
            include: {
              warehouse: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.inventory.count({ where })
    ]);

    return NextResponse.json({
      inventories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
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

    const body = await request.json();
    const { entryId, locationId, quantity, status } = body;

    const inventory = await prisma.inventory.create({
      data: {
        entryId,
        locationId,
        quantity,
        status,
      },
      include: {
        entry: {
          include: {
            provider: true,
          },
        },
        location: {
          include: {
            warehouse: true,
          },
        },
      },
    });

    // Create notifications for subscribed users
    const subscribedUsers = await prisma.userNotificationPreferences.findMany({
      where: { newInventory: true },
      select: { userId: true }
    })

    if (subscribedUsers.length > 0) {
      await prisma.notification.createMany({
        data: subscribedUsers.map(user => ({
          type: 'NEW_INVENTORY',
          message: `Nuevo registro de inventario: ${inventory.entry.provider.name} - ${inventory.location.warehouse.name}/${inventory.location.name}`,
          userId: user.userId
        }))
      })
    }

    return NextResponse.json(inventory, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create inventory' }, { status: 500 });
  }
}