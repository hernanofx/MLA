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
    const trackingNumber = searchParams.get('trackingNumber');
    const trackingNumbers = searchParams.get('trackingNumbers');
    const providerId = searchParams.get('providerId');
    const locationId = searchParams.get('locationId');
    const status = searchParams.get('status');

    // Build where clause
    const where: any = {
      ...(providerId && { currentProviderId: providerId }),
      ...(locationId && { currentLocationId: locationId }),
      ...(status && { status }),
    }

    // Handle single tracking number search
    if (trackingNumber && !trackingNumbers) {
      where.trackingNumber = { contains: trackingNumber, mode: 'insensitive' };
    }

    // Handle multiple tracking numbers search
    if (trackingNumbers && trackingNumbers.trim()) {
      // Split by comma, space, or newline and clean up
      const trackingNumbersList = trackingNumbers
        .split(/[\s,\n]+/)
        .map(tn => tn.trim())
        .filter(tn => tn.length > 0);
      
      if (trackingNumbersList.length > 0) {
        where.trackingNumber = {
          in: trackingNumbersList,
          mode: 'insensitive'
        };
      }
    }

    const [packages, total] = await Promise.all([
      prisma.package.findMany({
        where,
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
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.package.count({ where })
    ]);

    return NextResponse.json({
      packages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('GET /api/packages error:', error);
    const message = process.env.NODE_ENV === 'development' ? String(error?.message || error) : 'Failed to fetch packages';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}