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
    id: string;
    provider: {
      id: string;
      name: string;
    };
  }[];
}

interface MapComponentProps {
  zones: Zone[];
  onZoneSelect: (zone: Zone) => void;
  selectedZone?: Zone | null;
}

function MapController({ zones, onZoneSelect, selectedZone }: MapComponentProps) {
  const map = useMap();

  useEffect(() => {
    if (zones && Array.isArray(zones) && zones.length > 0) {
      const group = L.featureGroup();
      const selectedLayers: L.Layer[] = [];

      zones.forEach(zone => {
        if (zone.geometry) {
          const isSelected = selectedZone?.id === zone.id;
          const hasCoverage = zone.coverages && zone.coverages.length > 0;
          
          const layer = L.geoJSON(zone.geometry, {
            style: {
              color: isSelected ? '#2563EB' : (hasCoverage ? '#10B981' : '#EF4444'), // Blue for selected, green for covered, red for uncovered
              weight: isSelected ? 4 : 2,
              opacity: 0.8,
              fillColor: isSelected ? '#2563EB' : (hasCoverage ? '#10B981' : '#EF4444'),
              fillOpacity: isSelected ? 0.6 : 0.3,
            },
            onEachFeature: (feature, layer) => {
              layer.on('click', () => {
                onZoneSelect(zone);
              });
              const providersText = zone.coverages && zone.coverages.length > 0
                ? zone.coverages.map(c => c.provider.name).join(', ')
                : 'Sin proveedores asignados';
              layer.bindPopup(`
                <div class="p-2">
                  <h3 class="font-bold text-lg mb-2">${zone.locality}</h3>
                  <p class="text-sm mb-1"><strong>Códigos Postales:</strong> ${zone.postalCodes.slice(0, 5).join(', ')}${zone.postalCodes.length > 5 ? '...' : ''}</p>
                  <p class="text-sm mb-1"><strong>Ubicación:</strong> ${zone.province}, ${zone.department}</p>
                  <p class="text-sm mb-1"><strong>Tipo:</strong> ${zone.type}</p>
                  <p class="text-sm mb-2"><strong>Proveedores:</strong> ${providersText}</p>
                  <p class="text-xs text-gray-600">Haz click para ver detalles</p>
                </div>
              `);
            },
          });
          
          group.addLayer(layer);
          
          if (isSelected) {
            selectedLayers.push(layer);
          }
        }
      });

      // Fit map to show all zones
      if (group.getLayers().length > 0) {
        map.fitBounds(group.getBounds(), { padding: [20, 20] });
      }

      // If there's a selected zone, zoom to it
      if (selectedLayers.length > 0) {
        const selectedGroup = L.featureGroup(selectedLayers);
        map.fitBounds(selectedGroup.getBounds(), { padding: [50, 50], maxZoom: 14 });
      }
    }
  }, [zones, map, onZoneSelect, selectedZone]);

  return null;
}

export default function MapComponent({ zones, onZoneSelect, selectedZone }: MapComponentProps) {
  return (
    <MapContainer center={[-34.6037, -58.3816]} zoom={10} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapController zones={zones} onZoneSelect={onZoneSelect} selectedZone={selectedZone} />
    </MapContainer>
  );
}