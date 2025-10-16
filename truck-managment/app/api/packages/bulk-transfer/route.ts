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

    const { packageIds, toProviderId, toLocationId, notes } = await request.json();

    if (!packageIds || !Array.isArray(packageIds) || packageIds.length === 0) {
      return NextResponse.json({ error: 'Se requiere un array de IDs de paquetes' }, { status: 400 });
    }

    if (!toProviderId || !toLocationId) {
      return NextResponse.json({ error: 'Se requiere proveedor y ubicación de destino' }, { status: 400 });
    }

    // Realizar el traspaso masivo en una transacción
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
          currentProviderId: true,
          currentLocationId: true
        }
      });

      if (packages.length === 0) {
        throw new Error('No se encontraron paquetes para traspasar');
      }

      // Actualizar todos los paquetes
      const updateResult = await tx.package.updateMany({
        where: {
          id: {
            in: packageIds
          }
        },
        data: {
          currentProviderId: toProviderId,
          currentLocationId: toLocationId,
          status: 'en_traspaso' as any,
          updatedAt: new Date()
        }
      });

      // Crear movimientos para cada paquete
      const movements = packages.map((pkg) => ({
        packageId: pkg.id,
        action: 'traspaso' as any,
        fromProviderId: pkg.currentProviderId,
        fromLocationId: pkg.currentLocationId,
        toProviderId: toProviderId,
        toLocationId: toLocationId,
        notes: notes || `Traspaso masivo de ${packages.length} paquetes`,
      }));

      await tx.packageMovement.createMany({
        data: movements
      });

      return { transferred: updateResult.count, movements: movements.length };
    });

    return NextResponse.json({
      message: `${result.transferred} paquete${result.transferred > 1 ? 's' : ''} traspasado${result.transferred > 1 ? 's' : ''}`,
      ...result
    });
  } catch (error: any) {
    console.error('Error transferring packages in bulk:', error);
    return NextResponse.json(
      { error: error.message || 'Error al traspasar los paquetes' },
      { status: 500 }
    );
  }
}
