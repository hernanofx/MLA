import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const zone = await prisma.zone.findUnique({
      where: { id: params.id },
      include: {
        coverages: {
          include: {
            provider: true,
          },
        },
      },
    });
    if (!zone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
    }
    return NextResponse.json(zone);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch zone' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const zone = await prisma.zone.update({
      where: { id: params.id },
      data: body,
    });
    return NextResponse.json(zone);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update zone' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.zone.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ message: 'Zone deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete zone' }, { status: 500 });
  }
}