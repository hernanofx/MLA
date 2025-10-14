'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Zone {
  id: string;
  postalCodes: string[];
  province: string;
  department: string;
  locality: string;
  type: string;
  geometry: any;
  coverages: {
    provider: {
      id: string;
      name: string;
    };
  }[];
}

interface MapComponentProps {
  zones: Zone[];
  onZoneSelect: (zone: Zone) => void;
}

function MapController({ zones, onZoneSelect }: MapComponentProps) {
  const map = useMap();

  useEffect(() => {
    if (zones.length > 0) {
      const group = L.featureGroup();
      zones.forEach(zone => {
        if (zone.geometry) {
          const layer = L.geoJSON(zone.geometry, {
            style: {
              color: 'blue',
              weight: 2,
              opacity: 0.7,
            },
            onEachFeature: (feature, layer) => {
              layer.on('click', () => {
                onZoneSelect(zone);
              });
              layer.bindPopup(`<b>${zone.locality}</b><br>Códigos: ${zone.postalCodes.join(', ')}`);
            },
          });
          group.addLayer(layer);
        }
      });
      map.fitBounds(group.getBounds());
    }
  }, [zones, map, onZoneSelect]);

  return null;
}

export default function MapComponent({ zones, onZoneSelect }: MapComponentProps) {
  return (
    <MapContainer center={[-34.6037, -58.3816]} zoom={10} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapController zones={zones} onZoneSelect={onZoneSelect} />
    </MapContainer>
  );
}