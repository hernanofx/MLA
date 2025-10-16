import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try to find by id first, then by trackingNumber
    let pkg = await (prisma as any).package.findUnique({
      where: { id: params.id },
      include: {
        currentProvider: true,
        currentLocation: {
          include: {
            warehouse: true,
          },
        },
        inventory: {
          include: {
            provider: true,
          },
        },
        movements: {
          include: {
            fromProvider: true,
            toProvider: true,
            fromLocation: {
              include: {
                warehouse: true,
              },
            },
            toLocation: {
              include: {
                warehouse: true,
              },
            },
          },
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!pkg) {
      // Try by trackingNumber
      pkg = await (prisma as any).package.findUnique({
        where: { trackingNumber: params.id },
        include: {
          currentProvider: true,
          currentLocation: {
            include: {
              warehouse: true,
            },
          },
          inventory: {
            include: {
              provider: true,
            },
          },
          movements: {
            include: {
              fromProvider: true,
              toProvider: true,
              fromLocation: {
                include: {
                  warehouse: true,
                },
              },
              toLocation: {
                include: {
                  warehouse: true,
                },
              },
            },
            orderBy: { timestamp: 'desc' },
          },
        },
      });
    }

    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    return NextResponse.json(pkg);    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    return NextResponse.json(pkg);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch package' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json();
    const { status } = body;

    const pkg = await (prisma as any).package.update({
      where: { id: params.id },
      data: { status },
      include: {
        currentProvider: true,
        currentLocation: {
          include: {
            warehouse: true,
          },
        },
      },
    });

    return NextResponse.json(pkg);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update package' }, { status: 500 });
  }
}