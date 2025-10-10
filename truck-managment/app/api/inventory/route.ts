import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    const entryId = searchParams.get('entryId');

    const inventories = await prisma.inventory.findMany({
      where: {
        ...(locationId && { locationId }),
        ...(entryId && { entryId }),
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
    return NextResponse.json(inventories);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entryId, locationId, quantity, status } = body;

    const inventory = await prisma.inventory.create({
      data: {
        entryId,
        locationId,
        quantity,
        status,
      },
    });
    return NextResponse.json(inventory, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create inventory' }, { status: 500 });
  }
}