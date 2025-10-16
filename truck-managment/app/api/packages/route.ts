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
    const providerId = searchParams.get('providerId');
    const locationId = searchParams.get('locationId');
    const status = searchParams.get('status');

    const where: any = {
      ...(trackingNumber && { trackingNumber: { contains: trackingNumber, mode: 'insensitive' } }),
      ...(providerId && { currentProviderId: providerId }),
      ...(locationId && { currentLocationId: locationId }),
      ...(status && { status }),
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
    try { console.error('Request URL:', request.url); } catch (e) {}
    const message = process.env.NODE_ENV === 'development' ? String(error?.message || error) : 'Failed to fetch packages';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}