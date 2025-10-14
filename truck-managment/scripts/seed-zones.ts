import { PrismaClient } from '../app/generated/prisma';
import * as fs from 'fs';
import * as path from 'path';
const wellknown = require('wellknown');

const prisma = new PrismaClient();

interface GeoJSONFeature {
  type: 'Feature';
  properties: {
    CP: string;
    Prov: string;
    Dpto: string;
    Localidad: string;
    Tipo: string;
    geometria: string;
  };
  geometry: any;
}

interface GeoJSON {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

async function seedZones() {
  const geojsonPath = path.join(process.cwd(), 'Provincias_Unificadas_CP_Completo_Final.geojson');
  // Since the file has NaN which is invalid JSON, read as text and replace NaN with null
  let geojsonText = fs.readFileSync(geojsonPath, 'utf-8');
  geojsonText = geojsonText.replace(/NaN/g, 'null');
  const geojsonData: GeoJSON = JSON.parse(geojsonText);

  // Clear existing zones
  await prisma.zone.deleteMany();

  let count = 0;
  for (const feature of geojsonData.features) {
    const { CP, Prov, Dpto, Localidad, Tipo, geometria } = feature.properties;

    console.log('Processing:', CP, Prov, Dpto);

    // Parse WKT to GeoJSON geometry
    let geoJsonGeometry = wellknown.parse(geometria);
    
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
    
    geoJsonGeometry = roundCoordinates(geoJsonGeometry);
    console.log('Geometry size after rounding:', JSON.stringify(geoJsonGeometry).length);

    // Split postal codes and limit to 10
    const postalCodes = typeof CP === 'string' ? CP.split(', ').slice(0, 10) : [];

    await prisma.zone.create({
      data: {
        postalCodes,
        province: Prov || '',
        department: String(Dpto) || '',
        locality: Localidad || '',
        type: Tipo || '',
        geometry: geoJsonGeometry,
      },
    });
    count++;
  }

  console.log(`Seeded ${count} zones successfully`);
}

seedZones()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });