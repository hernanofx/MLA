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
    const trackingNumber = searchParams.get('trackingNumber');

    const where: any = {
      ...(locationId && { locationId }),
      ...(entryId && { entryId }),
      ...(status && { status }),
      ...(providerId && { OR: [ { entry: { provider: { id: providerId } } }, { provider: { id: providerId } } ] }),
      ...(warehouseId && { location: { warehouse: { id: warehouseId } } }),
      ...(trackingNumber && { trackingNumbers: { contains: trackingNumber, mode: 'insensitive' } }),
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
          provider: true,
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

    // Permitir acceso a admin y operario
    if (session.user.role !== 'admin' && session.user.role !== 'operario') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json();
    const { entryId, providerId, locationId, quantity, status, trackingNumbers } = body;

    const inventory = await prisma.inventory.create({
      data: {
        entryId,
        providerId,
        locationId,
        quantity,
        status,
        trackingNumbers: trackingNumbers || null,
      },
      include: {
        entry: {
          include: {
            provider: true,
          },
        },
        provider: true,
        location: {
          include: {
            warehouse: true,
          },
        },
      },
    });

    // Create packages if tracking numbers are provided
    if (trackingNumbers) {
      const trackingList = trackingNumbers.split(',').map((t: string) => t.trim()).filter((t: string) => t);
      if (trackingList.length > 0) {
        // Map inventory status to initial package status
        const initialPackageStatus = status === 'stored' ? 'almacenado' : 'en_traspaso';
        await prisma.package.createMany({
          data: trackingList.map((tracking: string) => ({
            inventoryId: inventory.id,
            trackingNumber: tracking,
            currentProviderId: providerId,
            currentLocationId: locationId,
            status: initialPackageStatus,
          })),
        });

        // Create movement records for each package
        const packages = await prisma.package.findMany({
          where: { inventoryId: inventory.id },
        });
        await prisma.packageMovement.createMany({
          data: packages.map((pkg: any) => ({
            packageId: pkg.id,
            toProviderId: providerId,
            toLocationId: locationId,
            action: 'ingreso',
            notes: 'Ingreso inicial desde devolución',
          })),
        });
      }
    }

    // Create notifications for subscribed users
    const subscribedUsers = await prisma.userNotificationPreferences.findMany({
      where: { newInventory: true },
      select: { userId: true }
    })

    if (subscribedUsers.length > 0) {
      const providerName = inventory.entry?.provider?.name || inventory.provider?.name || 'Proveedor desconocido'
      await prisma.notification.createMany({
        data: subscribedUsers.map(user => ({
          type: 'NEW_INVENTORY',
          message: `Nuevo registro de inventario: ${providerName} - ${inventory.location.warehouse.name}/${inventory.location.name}`,
          userId: user.userId
        }))
      })
    }

    return NextResponse.json(inventory, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/inventory error:', error);
    const message = process.env.NODE_ENV === 'development' ? String(error?.message || error) : 'Failed to create inventory';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}