import { PrismaClient } from '../app/generated/prisma';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

function wktToGeoJson(wkt: string) {
  const match = wkt.match(/POLYGON\s*\(\(([^)]+)\)\)/);
  if (!match) return null;
  const coordsStr = match[1];
  const rings = coordsStr.split('),(').map(ring => ring.split(',').map(coord => {
    const [lng, lat] = coord.trim().split(' ').map(Number);
    // Round to 6 decimal places
    return [Math.round(lng * 1000000) / 1000000, Math.round(lat * 1000000) / 1000000];
  }));
  return {
    type: 'Polygon',
    coordinates: rings
  };
}

const barriosCABA = {
  nunez: {
    nombre: "Núñez",
    comuna: 13,
    codigosPostales: ["C1429", "C1430", "C1431"],
    coordenadas: {
      poligono: [
        { lat: -34.5338, lng: -58.4720 },
        { lat: -34.5338, lng: -58.4480 },
        { lat: -34.5485, lng: -58.4420 },
        { lat: -34.5520, lng: -58.4520 },
        { lat: -34.5520, lng: -58.4720 },
        { lat: -34.5338, lng: -58.4720 }
      ]
    }
  },
  belgrano: {
    nombre: "Belgrano",
    comuna: 13,
    codigosPostales: ["C1426", "C1427", "C1428"],
    coordenadas: {
      poligono: [
        { lat: -34.5520, lng: -58.4720 },
        { lat: -34.5520, lng: -58.4420 },
        { lat: -34.5680, lng: -58.4380 },
        { lat: -34.5750, lng: -58.4420 },
        { lat: -34.5750, lng: -58.4580 },
        { lat: -34.5740, lng: -58.4720 },
        { lat: -34.5520, lng: -58.4720 }
      ]
    }
  },
  palermo: {
    nombre: "Palermo",
    comuna: 14,
    codigosPostales: ["C1414", "C1415", "C1416", "C1425"],
    coordenadas: {
      poligono: [
        { lat: -34.5680, lng: -58.4380 },
        { lat: -34.5680, lng: -58.4050 },
        { lat: -34.5950, lng: -58.4000 },
        { lat: -34.6020, lng: -58.4150 },
        { lat: -34.6020, lng: -58.4300 },
        { lat: -34.5750, lng: -58.4350 },
        { lat: -34.5680, lng: -58.4380 }
      ]
    }
  },
  recoleta: {
    nombre: "Recoleta",
    comuna: 2,
    codigosPostales: ["C1113", "C1116", "C1118", "C1120", "C1425"],
    coordenadas: {
      poligono: [
        { lat: -34.5800, lng: -58.4050 },
        { lat: -34.5800, lng: -58.3850 },
        { lat: -34.5950, lng: -58.3850 },
        { lat: -34.6020, lng: -58.3950 },
        { lat: -34.6020, lng: -58.4050 },
        { lat: -34.5800, lng: -58.4050 }
      ]
    }
  },
  retiro: {
    nombre: "Retiro",
    comuna: 1,
    codigosPostales: ["C1001", "C1002", "C1003", "C1010", "C1011", "C1012", "C1013", "C1014", "C1015"],
    coordenadas: {
      poligono: [
        { lat: -34.5800, lng: -58.3720 },
        { lat: -34.5760, lng: -58.3640 },
        { lat: -34.5950, lng: -58.3620 },
        { lat: -34.6020, lng: -58.3680 },
        { lat: -34.6020, lng: -58.3850 },
        { lat: -34.5800, lng: -58.3720 }
      ]
    }
  }
};

async function seedFromHardcodedCABA() {
  let count = 0;
  for (const key in barriosCABA) {
    const barrio = barriosCABA[key as keyof typeof barriosCABA];
    console.log('Processing hardcoded CABA:', barrio.nombre, 'CABA');

    const coordinates = barrio.coordenadas.poligono.map(coord => [
      Math.round(coord.lng * 1000000) / 1000000,
      Math.round(coord.lat * 1000000) / 1000000
    ]);

    const geoJsonGeometry = {
      type: 'Polygon',
      coordinates: [coordinates]
    };

    console.log('Geometry size after rounding:', JSON.stringify(geoJsonGeometry).length);

    await prisma.zone.create({
      data: {
        postalCodes: barrio.codigosPostales,
        province: 'CABA',
        department: String(barrio.comuna),
        locality: barrio.nombre,
        type: 'BARRIO',
        geometry: geoJsonGeometry,
      },
    });
    count++;
  }
  return count;
}

async function seedFromGeoJSON() {
  const geojsonPath = path.join(process.cwd(), 'Localidades_Poly_2022_WGS84_con_CP.geojson.json');
  const geojsonData = JSON.parse(fs.readFileSync(geojsonPath, 'utf-8'));

  let count = 0;
  for (const feature of geojsonData.features) {
    const properties = feature.properties;

    console.log('Processing Buenos Aires:', properties.LOCALIDAD, properties.PARTIDO);

    const geoJsonGeometry = feature.geometry;

    // Round coordinates to 6 decimal places to reduce precision
    function roundCoordinates(coords: any): any {
      if (Array.isArray(coords)) {
        return coords.map(coord => {
          if (typeof coord === 'number') {
            return Math.round(coord * 1000000) / 1000000;
          } else if (Array.isArray(coord)) {
            return roundCoordinates(coord);
          }
          return coord;
        });
      }
      return coords;
    }
    
    const roundedGeometry = roundCoordinates(geoJsonGeometry);
    console.log('Geometry size after rounding:', JSON.stringify(roundedGeometry).length);

    // Postal codes from codigo_postal
    const postalCodes = properties.codigo_postal || [];

    await prisma.zone.create({
      data: {
        postalCodes,
        province: properties.PARTIDO || '',
        department: String(properties.COD_PART) || '',
        locality: properties.LOCALIDAD || '',
        type: properties.GNA || '',
        geometry: roundedGeometry,
      },
    });
    count++;
  }
  return count;
}

async function seedFromCSV() {
  const csvPath = path.join(process.cwd(), 'CABA.csv');
  const csvData = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(csvData, {
    skip_empty_lines: true,
    from_line: 2, // skip header
  });

  let count = 0;
  for (const record of records) {
    const [cp, prov, dpto, localidad, tipo, latitud, longitud, geometria] = record;

    console.log('Processing CABA:', localidad, prov);

    const geoJsonGeometry = wktToGeoJson(geometria);
    if (!geoJsonGeometry) continue;

    console.log('Geometry size after rounding:', JSON.stringify(geoJsonGeometry).length);

    // Postal codes from cp
    const postalCodes = cp.split(', ');

    await prisma.zone.create({
      data: {
        postalCodes,
        province: prov || '',
        department: String(dpto) || '',
        locality: localidad || '',
        type: tipo || '',
        geometry: geoJsonGeometry,
      },
    });
    count++;
  }
  return count;
}

async function seedZones() {
  // Clear existing zones
  await prisma.zone.deleteMany();

  let totalCount = 0;

  // Seed from Buenos Aires GeoJSON
  const baCount = await seedFromGeoJSON();
  totalCount += baCount;

  // Seed from CABA CSV
  const cabaCount = await seedFromCSV();
  totalCount += cabaCount;

  // Seed from hardcoded CABA
  const hardcodedCount = await seedFromHardcodedCABA();
  totalCount += hardcodedCount;

  console.log(`Seeded ${totalCount} zones successfully (${baCount} from Buenos Aires, ${cabaCount} from CABA CSV, ${hardcodedCount} from hardcoded CABA)`);
}

seedZones()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });