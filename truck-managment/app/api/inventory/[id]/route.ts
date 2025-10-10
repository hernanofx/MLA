import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const inventory = await prisma.inventory.findUnique({
      where: { id },
      include: {
        entry: true,
        location: {
          include: {
            warehouse: true,
          },
        },
      },
    });
    if (!inventory) {
      return NextResponse.json({ error: 'Inventory not found' }, { status: 404 });
    }
    return NextResponse.json(inventory);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { entryId, locationId, quantity, status } = body;

    const inventory = await prisma.inventory.update({
      where: { id },
      data: {
        entryId,
        locationId,
        quantity,
        status,
      },
    });
    return NextResponse.json(inventory);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.inventory.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Inventory deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete inventory' }, { status: 500 });
  }
}