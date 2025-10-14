import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.providerCoverage.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Coverage deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete coverage' }, { status: 500 });
  }
}