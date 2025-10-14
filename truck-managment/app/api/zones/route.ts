import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  try {
    const zones = await prisma.zone.findMany({
      include: {
        coverages: {
          include: {
            provider: true,
          },
        },
      },
      orderBy: {
        locality: 'asc',
      },
    });

    return NextResponse.json(zones);
  } catch (error) {
    console.error('Error fetching zones:', error);
    return NextResponse.json({ error: 'Failed to fetch zones' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const zone = await prisma.zone.create({
      data: body,
    });
    return NextResponse.json(zone);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create zone' }, { status: 500 });
  }
}