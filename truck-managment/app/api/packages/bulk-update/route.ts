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

    const { packageIds, status } = await request.json();

    if (!packageIds || !Array.isArray(packageIds) || packageIds.length === 0) {
      return NextResponse.json({ error: 'Se requiere un array de IDs de paquetes' }, { status: 400 });
    }

    if (!status) {
      return NextResponse.json({ error: 'Se requiere un estado' }, { status: 400 });
    }

    // Validar que el estado sea válido
    const validStatuses = ['ingresado', 'almacenado', 'en_traspaso', 'entregado'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    }

    // Realizar la actualización masiva en una transacción
    const result = await prisma.$transaction(async (tx) => {
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
          status: true,
          currentProviderId: true,
          currentLocationId: true
        }
      });

      if (packages.length === 0) {
        throw new Error('No se encontraron paquetes para actualizar');
      }

      // Actualizar todos los paquetes
      const updateResult = await tx.package.updateMany({
        where: {
          id: {
            in: packageIds
          }
        },
        data: {
          status: status as any,
          updatedAt: new Date()
        }
      });

      // Crear movimientos para cada paquete si hay un cambio de estado
      const movements = packages
        .filter((pkg) => pkg.status !== status)
        .map((pkg) => ({
          packageId: pkg.id,
          action: (status === 'entregado' ? 'salida' : 'traspaso') as any,
          fromProviderId: pkg.currentProviderId,
          fromLocationId: pkg.currentLocationId,
          toProviderId: pkg.currentProviderId,
          toLocationId: pkg.currentLocationId,
          notes: `Cambio masivo de estado a ${status}`,
        }));

      if (movements.length > 0) {
        await tx.packageMovement.createMany({
          data: movements
        });
      }

      return { updated: updateResult.count, movements: movements.length };
    });

    return NextResponse.json({
      message: `${result.updated} paquete${result.updated > 1 ? 's' : ''} actualizado${result.updated > 1 ? 's' : ''}`,
      ...result
    });
  } catch (error: any) {
    console.error('Error updating packages in bulk:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar los paquetes' },
      { status: 500 }
    );
  }
}
