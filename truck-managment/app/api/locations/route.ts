import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouseId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const skip = (page - 1) * limit;

    const where = warehouseId ? { warehouseId } : {};

    const [locations, total] = await Promise.all([
      prisma.location.findMany({
        where,
        include: {
          warehouse: true,
          inventories: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.location.count({ where })
    ]);

    return NextResponse.json({
      locations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { warehouseId, name, description } = body;

    const location = await prisma.location.create({
      data: {
        warehouseId,
        name,
        description,
      },
    });
    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create location' }, { status: 500 });
  }
}