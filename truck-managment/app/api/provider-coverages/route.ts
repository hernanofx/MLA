import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  try {
    const coverages = await prisma.providerCoverage.findMany({
      include: {
        provider: true,
        zone: true,
      },
    });
    return NextResponse.json(coverages);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch coverages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const coverage = await prisma.providerCoverage.create({
      data: body,
    });
    return NextResponse.json(coverage);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create coverage' }, { status: 500 });
  }
}