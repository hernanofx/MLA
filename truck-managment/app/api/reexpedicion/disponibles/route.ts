import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Obtener movimientos de ingreso disponibles para egreso
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouseId') || undefined;
    const subtipoIngreso = searchParams.get('subtipoIngreso') || undefined;

    const where: any = {
      tipo: 'INGRESO',
      estado: {
        in: ['ACTIVO', 'EGRESADO_PARCIAL']
      }
    };

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (subtipoIngreso) {
      where.subtipoIngreso = subtipoIngreso;
    }

    const movimientos = await prisma.reexpedicionMovimiento.findMany({
      where,
      include: {
        warehouse: true,
        location: {
          include: {
            warehouse: true
          }
        },
        etiquetas: {
          where: {
            estado: 'ACTIVO'
          },
          orderBy: {
            escaneadoAt: 'asc'
          }
        },
        creadoPor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Filtrar solo los que tienen etiquetas activas
    const movimientosConEtiquetas = movimientos.filter(
      m => m.etiquetas.length > 0
    );

    return NextResponse.json(movimientosConEtiquetas);
  } catch (error) {
    console.error('Error fetching available movements:', error);
    return NextResponse.json(
      { error: 'Error al obtener los movimientos disponibles' },
      { status: 500 }
    );
  }
}
