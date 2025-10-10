import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const warehouses = await prisma.warehouse.findMany({
      include: {
        locations: true,
      },
    });
    return NextResponse.json(warehouses);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch warehouses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, address, description } = body;

    const warehouse = await prisma.warehouse.create({
      data: {
        name,
        address,
        description,
      },
    });
    return NextResponse.json(warehouse, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create warehouse' }, { status: 500 });
  }
}