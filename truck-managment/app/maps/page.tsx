'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the map component to avoid SSR issues
const MapComponent = dynamic(() => import('../components/MapComponent'), {
  ssr: false,
});

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

export default function MapsPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');

  useEffect(() => {
    // Fetch zones
    fetch('/api/zones')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setZones(data);
        } else {
          console.error('Zones data is not an array:', data);
          setZones([]);
        }
      })
      .catch(error => {
        console.error('Error fetching zones:', error);
        setZones([]);
      });

    // Fetch providers
    fetch('/api/providers')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProviders(data);
        } else {
          console.error('Providers data is not an array:', data);
          setProviders([]);
        }
      })
      .catch(error => {
        console.error('Error fetching providers:', error);
        setProviders([]);
      });
  }, []);

  const assignProvider = async () => {
    if (!selectedZone || !selectedProviderId) return;
    await fetch('/api/provider-coverages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId: selectedProviderId,
        zoneId: selectedZone.id,
      }),
    });
    // Refresh zones
    const updatedZones = await fetch('/api/zones').then(res => res.json());
    setZones(updatedZones);
  };

  return (
    <div className="h-screen flex bg-gray-50">
      <div className="w-1/4 p-6 bg-white shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Proveedores</h2>
        <ul className="space-y-2">
          {providers.map(provider => (
            <li key={provider.id} className="p-3 bg-gray-100 rounded-lg">
              {provider.name}
            </li>
          ))}
        </ul>
        {selectedZone && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800">Zona Seleccionada</h3>
            <p className="text-sm text-gray-600 mt-2">Códigos Postales: {selectedZone.postalCodes.join(', ')}</p>
            <p className="text-sm text-gray-600">Localidad: {selectedZone.locality}</p>
            <p className="text-sm text-gray-600">Proveedores: {selectedZone.coverages.map(c => c.provider.name).join(', ')}</p>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Asignar Proveedor</label>
              <select
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={selectedProviderId}
                onChange={(e) => setSelectedProviderId(e.target.value)}
              >
                <option value="">Seleccionar...</option>
                {providers.map(provider => (
                  <option key={provider.id} value={provider.id}>{provider.name}</option>
                ))}
              </select>
              <button
                className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition duration-200"
                onClick={assignProvider}
              >
                Asignar Proveedor
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="w-3/4">
        <MapComponent zones={zones} onZoneSelect={setSelectedZone} />
      </div>
    </div>
  );
}