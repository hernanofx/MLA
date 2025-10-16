import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: any) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

  const { id } = params;
  const { notes } = await request.json();

    // Find package by id or trackingNumber
    let pkg = await prisma.package.findUnique({ where: { id } });
    if (!pkg) {
      pkg = await prisma.package.findUnique({ where: { trackingNumber: id } });
    }

    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    if (pkg.status === 'entregado') {
      return NextResponse.json({ error: 'Package already delivered' }, { status: 400 });
    }

    // Use the real package id (pkg.id) in movements/updates
    const packageId = pkg.id;

    // Create movement
    await prisma.packageMovement.create({
      data: {
        packageId,
        fromProviderId: pkg.currentProviderId,
        fromLocationId: pkg.currentLocationId,
        action: 'salida',
        notes,
      },
    });

    // Update package
    const updatedPkg = await prisma.package.update({
      where: { id: packageId },
      data: {
        status: 'entregado',
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
    console.error('POST /api/packages/[id]/deliver error:', error);
    const message = process.env.NODE_ENV === 'development' ? String(error?.message || error) : 'Failed to deliver package';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}