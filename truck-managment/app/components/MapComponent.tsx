'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';

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
  onDrawCreated?: (geoJson: any) => void;
}

export default function MapComponent({ zones, onZoneSelect, selectedZone, onDrawCreated }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const zonesLayerRef = useRef<L.FeatureGroup | null>(null);

  // Inicializar mapa
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    console.log('Inicializando mapa...');

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
        console.log('Nuevo dibujo creado:', geoJSON);
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

    console.log(`=== RENDERIZANDO ZONAS ===`);
    console.log(`Total zonas recibidas: ${zones.length}`);

    let validZonesCount = 0;
    let invalidZonesCount = 0;

    zones.forEach((zone, index) => {
      if (!zone.geometry) {
        console.warn(`⚠️ Zona sin geometría: ${zone.locality}`);
        invalidZonesCount++;
        return;
      }

      try {
        // Verificar que la geometría sea válida
        if (!zone.geometry.type || !zone.geometry.coordinates) {
          console.error(`❌ Geometría inválida para zona ${zone.locality}:`, zone.geometry);
          invalidZonesCount++;
          return;
        }

        // Convertir MultiPoint a Polygon si es necesario
        let geometryToRender = zone.geometry;
        if (zone.geometry.type === 'MultiPoint') {
          console.log(`🔄 Convirtiendo MultiPoint a Polygon: ${zone.locality}`);
          const coordinates = zone.geometry.coordinates;
          
          // Asegurarse de que el polígono esté cerrado (primer punto = último punto)
          const polygonCoords = [...coordinates];
          if (JSON.stringify(polygonCoords[0]) !== JSON.stringify(polygonCoords[polygonCoords.length - 1])) {
            polygonCoords.push(polygonCoords[0]);
          }

          geometryToRender = {
            type: 'Polygon',
            coordinates: [polygonCoords]
          };
        }

        const isSelected = selectedZone?.id === zone.id;
        const hasCoverage = zone.coverages && zone.coverages.length > 0;

        // Crear capa GeoJSON
        const geoJsonLayer = L.geoJSON(geometryToRender, {
          style: {
            color: isSelected ? '#3B82F6' : (hasCoverage ? '#10B981' : '#EF4444'),
            weight: isSelected ? 3 : 2,
            opacity: 1,
            fillOpacity: isSelected ? 0.4 : 0.2,
          },
          onEachFeature: (feature, layer) => {
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
                ${hasCoverage ? `<p class="text-xs text-green-600 mt-1">✓ Con cobertura</p>` : `<p class="text-xs text-red-600 mt-1">✗ Sin cobertura</p>`}
              </div>
            `;
            
            layer.bindPopup(popupContent);

            // Click para seleccionar
            layer.on('click', () => {
              console.log('Zona clickeada:', zone.locality);
              onZoneSelect(zone);
            });
          },
        });

        zonesLayer.addLayer(geoJsonLayer);
        validZonesCount++;

        console.log(`✓ Zona renderizada [${index + 1}/${zones.length}]: ${zone.locality}`, {
          id: zone.id,
          hasGeometry: !!zone.geometry,
          geometryType: zone.geometry?.type,
          isSelected,
          hasCoverage
        });

      } catch (error) {
        console.error(`❌ Error renderizando zona ${zone.locality}:`, error, zone.geometry);
        invalidZonesCount++;
      }
    });

    console.log(`=== RESUMEN DE RENDERIZADO ===`);
    console.log(`Total zonas: ${zones.length}`);
    console.log(`Válidas: ${validZonesCount}`);
    console.log(`Inválidas: ${invalidZonesCount}`);
    console.log(`Capas en mapa: ${zonesLayer.getLayers().length}`);

    // Ajustar vista del mapa a las zonas
    if (zonesLayer.getLayers().length > 0) {
      try {
        const bounds = zonesLayer.getBounds();
        console.log('Ajustando bounds del mapa:', bounds);
        map.fitBounds(bounds, { 
          padding: [50, 50],
          maxZoom: 13
        });
      } catch (error) {
        console.error('Error ajustando bounds:', error);
      }
    }

  }, [zones, selectedZone, onZoneSelect]);

  // Zoom a zona seleccionada
  useEffect(() => {
    const map = mapInstanceRef.current;
    const zonesLayer = zonesLayerRef.current;
    
    if (!map || !zonesLayer || !selectedZone) return;

    console.log('=== ZOOM A ZONA SELECCIONADA ===');
    console.log('Zona:', selectedZone.locality);
    console.log('Geometría:', selectedZone.geometry);

    // Intentar hacer zoom directamente a la geometría
    if (selectedZone.geometry && selectedZone.geometry.type && selectedZone.geometry.coordinates) {
      try {
        const geoJsonLayer = L.geoJSON(selectedZone.geometry);
        const bounds = geoJsonLayer.getBounds();
        console.log('Bounds de zona seleccionada:', bounds);
        map.flyToBounds(bounds, { 
          padding: [100, 100],
          maxZoom: 14,
          duration: 1
        });
      } catch (error) {
        console.error('Error haciendo zoom a zona:', error);
      }
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