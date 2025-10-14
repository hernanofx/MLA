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

  for (const feature of geojsonData.features) {
    const { CP, Prov, Dpto, Localidad, Tipo, geometria } = feature.properties;

    console.log('Processing:', CP, Prov, Dpto);

    // Parse WKT to GeoJSON geometry
    const geoJsonGeometry = wellknown.parse(geometria);

    // Split postal codes
    const postalCodes = typeof CP === 'string' ? CP.split(', ') : [];

    await prisma.zone.create({
      data: {
        postalCodes,
        province: Prov || '',
        department: Dpto || '',
        locality: Localidad || '',
        type: Tipo || '',
        geometry: geoJsonGeometry,
      },
    });
  }

  console.log('Zones seeded successfully');
}

seedZones()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });