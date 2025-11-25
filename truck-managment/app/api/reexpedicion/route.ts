import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Listar movimientos de reexpedición con filtros
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const tipo = searchParams.get('tipo') || undefined;
    const subtipoIngreso = searchParams.get('subtipoIngreso') || undefined;
    const subtipoEgreso = searchParams.get('subtipoEgreso') || undefined;
    const warehouseId = searchParams.get('warehouseId') || undefined;
    const locationId = searchParams.get('locationId') || undefined;
    const estado = searchParams.get('estado') || undefined;
    const trackingNumber = searchParams.get('trackingNumber') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (tipo) {
      where.tipo = tipo;
    }
    if (subtipoIngreso) {
      where.subtipoIngreso = subtipoIngreso;
    }
    if (subtipoEgreso) {
      where.subtipoEgreso = subtipoEgreso;
    }
    if (warehouseId) {
      where.warehouseId = warehouseId;
    }
    if (locationId) {
      where.locationId = locationId;
    }
    if (estado) {
      where.estado = estado;
    }
    if (trackingNumber) {
      where.etiquetas = {
        some: {
          trackingNumber: {
            contains: trackingNumber,
            mode: 'insensitive'
          }
        }
      };
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [movimientos, total] = await Promise.all([
      prisma.reexpedicionMovimiento.findMany({
        where,
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
          etiquetas: true,
          movimientoOrigen: {
            select: {
              id: true,
              subtipoIngreso: true,
              cantidad: true
            }
          },
          _count: {
            select: {
              movimientosEgreso: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.reexpedicionMovimiento.count({ where })
    ]);

    return NextResponse.json({
      movimientos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching reexpedicion movements:', error);
    return NextResponse.json(
      { error: 'Error al obtener los movimientos de reexpedición' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo movimiento de reexpedición
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      tipo,
      subtipoIngreso,
      subtipoEgreso,
      warehouseId,
      locationId,
      trackingNumbers,
      notas,
      movimientoOrigenId,
      etiquetasSeleccionadas
    } = body;

    // Validaciones
    if (!tipo || !warehouseId || !locationId) {
      return NextResponse.json(
        { error: 'Tipo, almacén y ubicación son requeridos' },
        { status: 400 }
      );
    }

    if (tipo === 'INGRESO') {
      if (!subtipoIngreso) {
        return NextResponse.json(
          { error: 'Subtipo de ingreso es requerido' },
          { status: 400 }
        );
      }
      if (!trackingNumbers || trackingNumbers.length === 0) {
        return NextResponse.json(
          { error: 'Debe escanear al menos una etiqueta' },
          { status: 400 }
        );
      }

      // Crear movimiento de ingreso con etiquetas
      const movimiento = await prisma.reexpedicionMovimiento.create({
        data: {
          tipo: 'INGRESO',
          subtipoIngreso,
          warehouseId,
          locationId,
          cantidad: trackingNumbers.length,
          notas,
          creadoPorId: session.user.id,
          etiquetas: {
            create: trackingNumbers.map((tn: string) => ({
              trackingNumber: tn.trim(),
              estado: 'ACTIVO'
            }))
          }
        },
        include: {
          warehouse: true,
          location: true,
          etiquetas: true,
          creadoPor: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      // Crear notificaciones para usuarios suscritos
      const subscribedUsers = await prisma.userNotificationPreferences.findMany({
        where: { newReexpedicion: true },
        select: { userId: true }
      });

      if (subscribedUsers.length > 0) {
        const subtipoLabel = subtipoIngreso === 'RETORNOS' ? 'Retornos' :
                            subtipoIngreso === 'PENDIENTE_RETIRO' ? 'Pendiente de Retiro' :
                            subtipoIngreso === 'PICKUP' ? 'Pickup' : 'Insumos WH';

        await prisma.notification.createMany({
          data: subscribedUsers.map(user => ({
            type: 'NEW_REEXPEDICION',
            message: `Nuevo ingreso de reexpedición: ${subtipoLabel} - ${trackingNumbers.length} etiqueta(s) en ${movimiento.location.name}`,
            userId: user.userId
          }))
        });
      }

      return NextResponse.json(movimiento, { status: 201 });
    } else if (tipo === 'EGRESO') {
      if (!subtipoEgreso) {
        return NextResponse.json(
          { error: 'Subtipo de egreso es requerido' },
          { status: 400 }
        );
      }
      if (!movimientoOrigenId) {
        return NextResponse.json(
          { error: 'Debe seleccionar un movimiento de origen para el egreso' },
          { status: 400 }
        );
      }
      if (!etiquetasSeleccionadas || etiquetasSeleccionadas.length === 0) {
        return NextResponse.json(
          { error: 'Debe seleccionar al menos una etiqueta para egresar' },
          { status: 400 }
        );
      }

      // Verificar que el movimiento de origen existe y tiene etiquetas disponibles
      const movimientoOrigen = await prisma.reexpedicionMovimiento.findUnique({
        where: { id: movimientoOrigenId },
        include: {
          etiquetas: {
            where: { estado: 'ACTIVO' }
          }
        }
      });

      if (!movimientoOrigen) {
        return NextResponse.json(
          { error: 'Movimiento de origen no encontrado' },
          { status: 404 }
        );
      }

      // Verificar que todas las etiquetas seleccionadas están activas
      const etiquetasActivas = movimientoOrigen.etiquetas.map(e => e.id);
      const etiquetasInvalidas = etiquetasSeleccionadas.filter(
        (id: string) => !etiquetasActivas.includes(id)
      );

      if (etiquetasInvalidas.length > 0) {
        return NextResponse.json(
          { error: 'Algunas etiquetas seleccionadas ya no están disponibles' },
          { status: 400 }
        );
      }

      // Crear movimiento de egreso en una transacción
      const result = await prisma.$transaction(async (tx) => {
        // Crear el movimiento de egreso
        const movimientoEgreso = await tx.reexpedicionMovimiento.create({
          data: {
            tipo: 'EGRESO',
            subtipoEgreso,
            warehouseId,
            locationId,
            cantidad: etiquetasSeleccionadas.length,
            notas,
            creadoPorId: session.user.id,
            movimientoOrigenId
          }
        });

        // Obtener los tracking numbers de las etiquetas seleccionadas
        const etiquetasAEgresar = await tx.reexpedicionEtiqueta.findMany({
          where: {
            id: { in: etiquetasSeleccionadas }
          }
        });

        // Crear etiquetas en el movimiento de egreso y marcar las originales como egresadas
        await tx.reexpedicionEtiqueta.createMany({
          data: etiquetasAEgresar.map(e => ({
            movimientoId: movimientoEgreso.id,
            trackingNumber: e.trackingNumber,
            estado: 'EGRESADO_TOTAL'
          }))
        });

        // Actualizar las etiquetas originales
        await tx.reexpedicionEtiqueta.updateMany({
          where: {
            id: { in: etiquetasSeleccionadas }
          },
          data: {
            estado: 'EGRESADO_TOTAL',
            egresadoAt: new Date()
          }
        });

        // Actualizar el movimiento de origen
        const etiquetasRestantes = await tx.reexpedicionEtiqueta.count({
          where: {
            movimientoId: movimientoOrigenId,
            estado: 'ACTIVO'
          }
        });

        const nuevoEstado = etiquetasRestantes === 0 ? 'EGRESADO_TOTAL' : 'EGRESADO_PARCIAL';
        
        await tx.reexpedicionMovimiento.update({
          where: { id: movimientoOrigenId },
          data: {
            estado: nuevoEstado,
            cantidadEgresada: {
              increment: etiquetasSeleccionadas.length
            }
          }
        });

        return movimientoEgreso;
      });

      // Obtener el movimiento completo
      const movimientoCompleto = await prisma.reexpedicionMovimiento.findUnique({
        where: { id: result.id },
        include: {
          warehouse: true,
          location: true,
          etiquetas: true,
          creadoPor: {
            select: { id: true, name: true, email: true }
          },
          movimientoOrigen: true
        }
      });

      // Crear notificaciones para usuarios suscritos
      const subscribedUsers = await prisma.userNotificationPreferences.findMany({
        where: { newReexpedicion: true },
        select: { userId: true }
      });

      if (subscribedUsers.length > 0 && movimientoCompleto) {
        const subtipoLabel = subtipoEgreso === 'ENTREGA_PARCIAL' ? 'Entrega Parcial' : 'Entrega Total';

        await prisma.notification.createMany({
          data: subscribedUsers.map(user => ({
            type: 'NEW_REEXPEDICION',
            message: `Nuevo egreso de reexpedición: ${subtipoLabel} - ${etiquetasSeleccionadas.length} etiqueta(s) desde ${movimientoCompleto.location.name}`,
            userId: user.userId
          }))
        });
      }

      return NextResponse.json(movimientoCompleto, { status: 201 });
    }

    return NextResponse.json(
      { error: 'Tipo de movimiento no válido' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error creating reexpedicion movement:', error);
    
    // Manejar error de tracking number duplicado
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Una o más etiquetas ya existen en este movimiento' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al crear el movimiento de reexpedición' },
      { status: 500 }
    );
  }
}
