import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all'; // 'all', 'withProviders', 'withoutProviders', 'postalCodes', 'polygons'
    const format = searchParams.get('format') || 'xlsx'; // 'xlsx' or 'csv'

    let whereClause: any = {};
    if (filter === 'withProviders') {
      whereClause.coverages = { some: {} };
    } else if (filter === 'withoutProviders') {
      whereClause.coverages = { none: {} };
    } else if (filter === 'polygons') {
      whereClause.geometry = { not: null };
    }

    const zones = await prisma.zone.findMany({
      where: whereClause,
      include: {
        coverages: {
          include: {
            provider: true,
          },
        },
      },
      orderBy: { locality: 'asc' },
    });

    let excelData: any[] = [];
    let filename: string;

    if (filter === 'postalCodes') {
      // Agrupa códigos postales únicos con zonas asociadas
      const postalCodeMap = new Map<string, string[]>();
      zones.forEach(zone => {
        zone.postalCodes.forEach(cp => {
          if (!postalCodeMap.has(cp)) postalCodeMap.set(cp, []);
          postalCodeMap.get(cp)!.push(zone.locality);
        });
      });
      excelData = Array.from(postalCodeMap.entries()).map(([cp, localities]) => ({
        'Código Postal': cp,
        'Zonas Asociadas': localities.join(', '),
        'Cantidad de Zonas': localities.length,
      }));
      filename = `codigos_postales_${new Date().toISOString().split('T')[0]}`;
    } else {
      // Datos estándar para otras exportaciones
      excelData = zones.map(zone => ({
        'Localidad': zone.locality,
        'Códigos Postales': zone.postalCodes.join(', '),
        'Provincia': zone.province,
        'Departamento': zone.department,
        'Tipo': zone.type,
        'Proveedores Asignados': zone.coverages.map(c => c.provider.name).join(', ') || 'Ninguno',
        'Cantidad de Proveedores': zone.coverages.length,
        'Geometría (Tipo)': (zone.geometry as any)?.type || 'N/A',
        'Geometría (Coordenadas)': zone.geometry ? JSON.stringify((zone.geometry as any).coordinates).slice(0, 500) + '...' : 'N/A',
      }));
      filename = `zonas_${filter}_${new Date().toISOString().split('T')[0]}`;
    }

    // Crear workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Auto-size columns
    const colWidths = filter === 'postalCodes' ? [
      { wch: 15 }, // Código Postal
      { wch: 40 }, // Zonas Asociadas
      { wch: 20 }, // Cantidad de Zonas
    ] : [
      { wch: 20 }, // Localidad
      { wch: 30 }, // Códigos Postales
      { wch: 15 }, // Provincia
      { wch: 15 }, // Departamento
      { wch: 10 }, // Tipo
      { wch: 30 }, // Proveedores Asignados
      { wch: 20 }, // Cantidad de Proveedores
      { wch: 15 }, // Geometría (Tipo)
      { wch: 50 }, // Geometría (Coordenadas)
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, filter === 'postalCodes' ? 'Códigos Postales' : 'Zonas');

    // Generar buffer según formato
    let buffer: any;
    let mimeType: string;

    if (format === 'csv') {
      buffer = XLSX.write(wb, { type: 'buffer', bookType: 'csv' });
      mimeType = 'text/csv';
      filename += '.csv';
    } else {
      buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      filename += '.xlsx';
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}