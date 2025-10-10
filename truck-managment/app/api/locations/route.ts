import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouseId');

    const locations = await prisma.location.findMany({
      where: warehouseId ? { warehouseId } : {},
      include: {
        warehouse: true,
        inventories: true,
      },
    });
    return NextResponse.json(locations);
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