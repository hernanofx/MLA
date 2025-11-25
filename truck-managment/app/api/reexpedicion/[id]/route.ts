import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Obtener un movimiento específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const movimiento = await prisma.reexpedicionMovimiento.findUnique({
      where: { id },
      include: {
        warehouse: true,
        location: {
          include: {
            warehouse: true
          }
        },
        creadoPor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        etiquetas: {
          orderBy: {
            escaneadoAt: 'asc'
          }
        },
        movimientoOrigen: {
          include: {
            warehouse: true,
            location: true,
            etiquetas: true
          }
        },
        movimientosEgreso: {
          include: {
            etiquetas: true,
            creadoPor: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    if (!movimiento) {
      return NextResponse.json(
        { error: 'Movimiento no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(movimiento);
  } catch (error) {
    console.error('Error fetching reexpedicion movement:', error);
    return NextResponse.json(
      { error: 'Error al obtener el movimiento' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un movimiento
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    // Verificar que el movimiento existe
    const movimiento = await prisma.reexpedicionMovimiento.findUnique({
      where: { id },
      include: {
        movimientosEgreso: true,
        etiquetas: true
      }
    });

    if (!movimiento) {
      return NextResponse.json(
        { error: 'Movimiento no encontrado' },
        { status: 404 }
      );
    }

    // No permitir eliminar si tiene egresos asociados
    if (movimiento.movimientosEgreso.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un movimiento que tiene egresos asociados' },
        { status: 400 }
      );
    }

    // Si es un egreso, restaurar las etiquetas del movimiento origen
    if (movimiento.tipo === 'EGRESO' && movimiento.movimientoOrigenId) {
      await prisma.$transaction(async (tx) => {
        // Obtener los tracking numbers de las etiquetas egresadas
        const trackingNumbers = movimiento.etiquetas.map(e => e.trackingNumber);

        // Restaurar las etiquetas originales
        await tx.reexpedicionEtiqueta.updateMany({
          where: {
            movimientoId: movimiento.movimientoOrigenId!,
            trackingNumber: { in: trackingNumbers }
          },
          data: {
            estado: 'ACTIVO',
            egresadoAt: null
          }
        });

        // Actualizar el contador del movimiento origen
        await tx.reexpedicionMovimiento.update({
          where: { id: movimiento.movimientoOrigenId! },
          data: {
            cantidadEgresada: {
              decrement: movimiento.cantidad
            },
            estado: 'ACTIVO'
          }
        });

        // Eliminar el movimiento de egreso
        await tx.reexpedicionMovimiento.delete({
          where: { id }
        });
      });
    } else {
      // Eliminar movimiento de ingreso (las etiquetas se eliminan por cascade)
      await prisma.reexpedicionMovimiento.delete({
        where: { id }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting reexpedicion movement:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el movimiento' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar movimiento (agregar etiquetas adicionales a ingreso)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { trackingNumbers, notas } = body;

    const movimiento = await prisma.reexpedicionMovimiento.findUnique({
      where: { id },
      include: { etiquetas: true }
    });

    if (!movimiento) {
      return NextResponse.json(
        { error: 'Movimiento no encontrado' },
        { status: 404 }
      );
    }

    if (movimiento.tipo !== 'INGRESO') {
      return NextResponse.json(
        { error: 'Solo se pueden modificar movimientos de ingreso' },
        { status: 400 }
      );
    }

    if (movimiento.estado !== 'ACTIVO') {
      return NextResponse.json(
        { error: 'No se puede modificar un movimiento que ya tiene egresos' },
        { status: 400 }
      );
    }

    const updateData: any = {};

    // Actualizar notas si se proporcionan
    if (notas !== undefined) {
      updateData.notas = notas;
    }

    // Agregar nuevas etiquetas si se proporcionan
    if (trackingNumbers && trackingNumbers.length > 0) {
      // Verificar que no existan duplicados
      const existingTracking = movimiento.etiquetas.map(e => e.trackingNumber);
      const newTracking = trackingNumbers.filter(
        (tn: string) => !existingTracking.includes(tn.trim())
      );

      if (newTracking.length > 0) {
        await prisma.reexpedicionEtiqueta.createMany({
          data: newTracking.map((tn: string) => ({
            movimientoId: id,
            trackingNumber: tn.trim(),
            estado: 'ACTIVO'
          }))
        });

        updateData.cantidad = {
          increment: newTracking.length
        };
      }
    }

    const movimientoActualizado = await prisma.reexpedicionMovimiento.update({
      where: { id },
      data: updateData,
      include: {
        warehouse: true,
        location: true,
        etiquetas: true,
        creadoPor: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json(movimientoActualizado);
  } catch (error: any) {
    console.error('Error updating reexpedicion movement:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Una o más etiquetas ya existen en este movimiento' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al actualizar el movimiento' },
      { status: 500 }
    );
  }
}
