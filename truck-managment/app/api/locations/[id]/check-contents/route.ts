import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar inventario (devoluciones)
    const inventoryCount = await prisma.inventory.count({
      where: {
        locationId: id,
        status: 'stored' // Solo contar los almacenados
      }
    });

    // Verificar paquetes
    const packagesCount = await prisma.package.count({
      where: {
        currentLocationId: id,
        status: { in: ['ingresado', 'almacenado', 'en_traspaso'] } // Estados activos
      }
    });

    // Verificar movimientos de reexpedición activos
    const reexpedicionCount = await prisma.reexpedicionMovimiento.count({
      where: {
        locationId: id,
        tipo: 'INGRESO',
        estado: { in: ['ACTIVO', 'EGRESADO_PARCIAL'] } // Estados con contenido
      }
    });

    const hasContents = inventoryCount > 0 || packagesCount > 0 || reexpedicionCount > 0;

    return NextResponse.json({
      hasContents,
      details: {
        inventoryCount,
        packagesCount,
        reexpedicionCount,
        totalItems: inventoryCount + packagesCount + reexpedicionCount
      }
    });
  } catch (error) {
    console.error('Error checking location contents:', error);
    return NextResponse.json({ error: 'Failed to check location' }, { status: 500 });
  }
}
