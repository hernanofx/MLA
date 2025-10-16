import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

  const { id } = params;
    const { toProviderId, toLocationId, notes } = await request.json();

    // Find package by id or trackingNumber
    let pkg = await (prisma as any).package.findUnique({ where: { id } });
    if (!pkg) {
      pkg = await (prisma as any).package.findUnique({ where: { trackingNumber: id } });
    }

    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    if (pkg.status === 'entregado') {
      return NextResponse.json({ error: 'Cannot transfer delivered package' }, { status: 400 });
    }

    // Create movement
    await (prisma as any).packageMovement.create({
      data: {
        packageId: id,
        fromProviderId: pkg.currentProviderId,
        toProviderId,
        fromLocationId: pkg.currentLocationId,
        toLocationId,
        action: 'traspaso',
        notes,
      },
    });

    // Update package
    const updatedPkg = await (prisma as any).package.update({
      where: { id },
      data: {
        currentProviderId: toProviderId,
        currentLocationId: toLocationId,
        status: 'en_traspaso',
      },
      include: {
        currentProvider: true,
        currentLocation: {
          include: {
            warehouse: true,
          },
        },
      },
    });

    return NextResponse.json(updatedPkg);
  } catch (error: any) {
    console.error('POST /api/packages/[id]/transfer error:', error);
    const message = process.env.NODE_ENV === 'development' ? String(error?.message || error) : 'Failed to transfer package';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}