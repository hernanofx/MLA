import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No tienes permisos para realizar esta acción' }, { status: 403 });
    }

    const { packageIds } = await request.json();

    if (!packageIds || !Array.isArray(packageIds) || packageIds.length === 0) {
      return NextResponse.json({ error: 'Se requiere un array de IDs de paquetes' }, { status: 400 });
    }

    // Realizar la entrega masiva en una transacción
    const result = await (prisma as any).$transaction(async (tx: any) => {
      // Obtener los paquetes actuales
      const packages = await tx.package.findMany({
        where: {
          id: {
            in: packageIds
          }
        },
        select: {
          id: true,
          trackingNumber: true,
          currentProviderId: true,
          currentLocationId: true
        }
      });

      if (packages.length === 0) {
        throw new Error('No se encontraron paquetes para marcar como entregados');
      }

      // Actualizar todos los paquetes
      const updateResult = await tx.package.updateMany({
        where: {
          id: {
            in: packageIds
          }
        },
        data: {
          status: 'entregado',
          updatedAt: new Date()
        }
      });

      // Crear movimientos de salida para cada paquete
      const movements = packages.map((pkg: any) => ({
        packageId: pkg.id,
        action: 'salida',
        fromProviderId: pkg.currentProviderId,
        fromLocationId: pkg.currentLocationId,
        toProviderId: null,
        toLocationId: null,
        notes: `Entrega masiva de ${packages.length} paquetes`,
        performedBy: session.user.name || session.user.email
      }));

      await tx.packageMovement.createMany({
        data: movements
      });

      return { delivered: updateResult.count, movements: movements.length };
    });

    return NextResponse.json({
      message: `${result.delivered} paquete${result.delivered > 1 ? 's' : ''} marcado${result.delivered > 1 ? 's' : ''} como entregado${result.delivered > 1 ? 's' : ''}`,
      ...result
    });
  } catch (error: any) {
    console.error('Error delivering packages in bulk:', error);
    return NextResponse.json(
      { error: error.message || 'Error al marcar los paquetes como entregados' },
      { status: 500 }
    );
  }
}
