'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import * as turf from '@turf/turf';

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

interface Provider {
  id: string;
  name: string;
  responsible?: {
    name: string;
  };
}

interface MapComponentProps {
  zones: Zone[];
  onZoneSelect: (zone: Zone) => void;
  selectedZone?: Zone | null;
  onDrawCreated?: (geoJson: any) => void;
  providers: Provider[];
}

export default function MapComponent({ zones, onZoneSelect, selectedZone, onDrawCreated, providers }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const zonesLayerRef = useRef<L.FeatureGroup | null>(null);

  // Paleta de colores pasteles
  const pastelColors = [
    '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFBA', '#BAE1FF', '#D7BAFF', '#FFB3D9', '#FFD1B3', '#E6FFB3', '#B3FFDF',
    '#B3D7FF', '#D7B3FF', '#FFB3E6', '#FFE6B3', '#B3FFE6', '#B3D1FF', '#E6B3FF', '#FFB3F0', '#FFF0B3', '#B3FFF0'
  ];

  // Función para obtener color de provider
  const getProviderColor = (providerId: string) => {
    const index = providers.findIndex(p => p.id === providerId);
    return pastelColors[index % pastelColors.length];
  };

  // Función para dividir polígono en n partes verticales iguales
  const splitPolygonVertically = (polygon: any, n: number) => {
    const bbox = turf.bbox(polygon);
    const [minX, minY, maxX, maxY] = bbox;
    const width = maxX - minX;
    const partWidth = width / n;

    const parts = [];
    for (let i = 0; i < n; i++) {
      const partMinX = minX + i * partWidth;
      const partMaxX = minX + (i + 1) * partWidth;

      const rectangle = turf.bboxPolygon([partMinX, minY, partMaxX, maxY]);
      try {
        const intersection = turf.intersect(polygon, rectangle);
        if (intersection) {
          parts.push(intersection);
        }
      } catch (error) {
        // Si falla, usar el rectángulo completo
        parts.push(rectangle);
      }
    }
    return parts;
  };

  // Inicializar mapa
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Crear mapa centrado en Buenos Aires
    const map = L.map(mapRef.current).setView([-34.6037, -58.3816], 11);

    // Agregar tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Crear grupo para elementos dibujados
    drawnItemsRef.current = new L.FeatureGroup();
    map.addLayer(drawnItemsRef.current);

    // Crear grupo para zonas
    zonesLayerRef.current = new L.FeatureGroup();
    map.addLayer(zonesLayerRef.current);

    // Agregar control de dibujo
    const drawControl = new (L as any).Control.Draw({
      edit: {
        featureGroup: drawnItemsRef.current,
        remove: true,
      },
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
        },
        rectangle: true,
        circle: false,
        marker: false,
        polyline: false,
        circlemarker: false,
      },
    });
    map.addControl(drawControl);

    // Eventos de dibujo
    map.on((L as any).Draw.Event.CREATED, (e: any) => {
      const layer = e.layer;
      drawnItemsRef.current?.addLayer(layer);
      
      if (onDrawCreated) {
        const geoJSON = layer.toGeoJSON();
        onDrawCreated(geoJSON.geometry);
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [onDrawCreated]);

  // Renderizar zonas
  useEffect(() => {
    const map = mapInstanceRef.current;
    const zonesLayer = zonesLayerRef.current;
    
    if (!map || !zonesLayer) return;

    // Limpiar capas anteriores
    zonesLayer.clearLayers();

    zones.forEach((zone) => {
      if (!zone.geometry) return;

      try {
        if (!zone.geometry.type || !zone.geometry.coordinates) return;

        const isSelected = selectedZone?.id === zone.id;
        const hasCoverage = zone.coverages && zone.coverages.length > 0;
        
        // Popup con información
        const providersText = zone.coverages && zone.coverages.length > 0
          ? zone.coverages.map(c => c.provider.name).join(', ')
          : 'Sin proveedores asignados';
        
        const popupContent = `
          <div class="p-2">
            <h3 class="font-bold text-lg mb-2">${zone.locality}</h3>
            <p class="text-sm mb-1"><strong>Códigos Postales:</strong> ${zone.postalCodes.slice(0, 5).join(', ')}${zone.postalCodes.length > 5 ? '...' : ''}</p>
            <p class="text-sm mb-1"><strong>Ubicación:</strong> ${zone.province}, ${zone.department}</p>
            <p class="text-sm mb-1"><strong>Tipo:</strong> ${zone.type}</p>
            <p class="text-sm mb-2"><strong>Proveedores:</strong> ${providersText}</p>
            ${hasCoverage ? `<p class="text-xs text-green-600 mt-1">✓ Con cobertura</p>` : `<p class="text-xs text-gray-600 mt-1">Sin cobertura</p>`}
          </div>
        `;

        // Manejar MultiPoint con 1 o 2 puntos como marcadores circulares
        if (zone.geometry.type === 'MultiPoint' && zone.geometry.coordinates.length < 3) {
          const [lng, lat] = zone.geometry.coordinates[0];
          let color = '#808080'; // Gris más fuerte por defecto
          if (hasCoverage && zone.coverages.length === 1) {
            color = getProviderColor(zone.coverages[0].provider.id);
          } else if (hasCoverage && zone.coverages.length > 1) {
            color = '#808080'; // Para múltiples, gris o algo, pero como es punto, quizás no dividir
          }
          if (isSelected) color = '#3B82F6';

          const circle = L.circleMarker([lat, lng], {
            radius: isSelected ? 12 : 8,
            color: color,
            fillColor: color,
            fillOpacity: isSelected ? 0.6 : 0.4,
            weight: isSelected ? 3 : 2,
          });
          
          circle.bindPopup(popupContent);
          circle.on('click', () => {
            onZoneSelect(zone);
          });
          
          zonesLayer.addLayer(circle);
          return;
        }

        // Convertir MultiPoint a Polygon si tiene 3+ puntos
        let geometryToRender = zone.geometry;
        if (zone.geometry.type === 'MultiPoint' && zone.geometry.coordinates.length >= 3) {
          const coordinates = zone.geometry.coordinates;
          const polygonCoords = [...coordinates];
          
          if (JSON.stringify(polygonCoords[0]) !== JSON.stringify(polygonCoords[polygonCoords.length - 1])) {
            polygonCoords.push(polygonCoords[0]);
          }

          geometryToRender = {
            type: 'Polygon',
            coordinates: [polygonCoords]
          };
        }

        if (hasCoverage && zone.coverages.length > 1) {
          // Dividir el polígono en partes iguales
          const parts = splitPolygonVertically(geometryToRender, zone.coverages.length);
          parts.forEach((part, index) => {
            const provider = zone.coverages[index];
            if (provider) {
              const color = getProviderColor(provider.provider.id);
              const geoJsonLayer = L.geoJSON(part, {
                style: {
                  color: isSelected ? '#3B82F6' : color,
                  weight: isSelected ? 3 : 2,
                  opacity: 1,
                  fillOpacity: isSelected ? 0.4 : 0.2,
                },
                onEachFeature: (feature, layer) => {
                  layer.bindPopup(popupContent);
                  layer.on('click', () => {
                    onZoneSelect(zone);
                  });
                },
              });
              zonesLayer.addLayer(geoJsonLayer);
            }
          });
        } else {
          // Un solo color
          let color = '#808080'; // Gris más fuerte
          if (hasCoverage && zone.coverages.length === 1) {
            color = getProviderColor(zone.coverages[0].provider.id);
          }
          if (isSelected) color = '#3B82F6';

          // Crear capa GeoJSON para polígonos
          const geoJsonLayer = L.geoJSON(geometryToRender, {
            style: {
              color: color,
              weight: isSelected ? 3 : 2,
              opacity: 1,
              fillOpacity: isSelected ? 0.4 : 0.2,
            },
            onEachFeature: (feature, layer) => {
              layer.bindPopup(popupContent);
              layer.on('click', () => {
                onZoneSelect(zone);
              });
            },
          });

          zonesLayer.addLayer(geoJsonLayer);
        }
      } catch (error) {
        // Error silencioso
      }
    });

    // Auto zoom si hay zonas
    if (zones.length > 0 && zonesLayer.getLayers().length > 0) {
      try {
        const bounds = zonesLayer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
        }
      } catch (error) {
        // Error silencioso
      }
    }
  }, [zones, selectedZone, onZoneSelect, providers]);

  // Zoom a zona seleccionada
  useEffect(() => {
    const map = mapInstanceRef.current;
    
    if (!map || !selectedZone || !selectedZone.geometry) return;

    try {
      if (selectedZone.geometry.type === 'MultiPoint' && selectedZone.geometry.coordinates.length < 3) {
        // Zoom a punto único
        const [lng, lat] = selectedZone.geometry.coordinates[0];
        map.flyTo([lat, lng], 14, { duration: 1 });
      } else {
        // Zoom a polígono
        const geoJsonLayer = L.geoJSON(selectedZone.geometry);
        const bounds = geoJsonLayer.getBounds();
        if (bounds.isValid()) {
          map.flyToBounds(bounds, { 
            padding: [100, 100],
            maxZoom: 14,
            duration: 1
          });
        }
      }
    } catch (error) {
      // Error silencioso
    }
  }, [selectedZone]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full"
      style={{ minHeight: '500px' }}
    />
  );
}