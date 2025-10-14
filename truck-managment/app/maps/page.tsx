'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import AppLayout from '../components/AppLayout';
import { Search, MapPin, Users, CheckCircle, XCircle } from 'lucide-react';

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

interface Provider {
  id: string;
  name: string;
  responsible?: {
    name: string;
  };
}

export default function MapsPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [filteredZones, setFilteredZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Filter zones based on search term
    const filtered = zones.filter(zone =>
      zone.locality.toLowerCase().includes(searchTerm.toLowerCase()) ||
      zone.postalCodes.some(cp => cp.includes(searchTerm)) ||
      zone.province.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredZones(filtered);
  }, [zones, searchTerm]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch zones
      const zonesRes = await fetch('/api/zones');
      if (zonesRes.ok) {
        const zonesData = await zonesRes.json();
        if (Array.isArray(zonesData)) {
          setZones(zonesData);
          setFilteredZones(zonesData);
        }
      }

      // Fetch providers
      const providersRes = await fetch('/api/providers');
      if (providersRes.ok) {
        const providersData = await providersRes.json();
        if (providersData.providers && Array.isArray(providersData.providers)) {
          setProviders(providersData.providers);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const assignProvider = async () => {
    if (!selectedZone || !selectedProviderId) return;

    setAssigning(true);
    try {
      const response = await fetch('/api/provider-coverages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: selectedProviderId,
          zoneId: selectedZone.id,
        }),
      });

      if (response.ok) {
        // Refresh zones data
        await loadData();
        setSelectedProviderId('');
        // Keep the same zone selected
        const updatedZone = zones.find(z => z.id === selectedZone.id);
        if (updatedZone) {
          setSelectedZone(updatedZone);
        }
      }
    } catch (error) {
      console.error('Error assigning provider:', error);
    } finally {
      setAssigning(false);
    }
  };

  const handleZoneSelect = (zone: Zone) => {
    setSelectedZone(zone);
  };

  const getZoneStatus = (zone: Zone) => {
    return zone.coverages.length > 0 ? 'covered' : 'uncovered';
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="h-screen flex bg-gray-50">
        {/* Left Panel - Zones and Details */}
        <div className="w-96 bg-white shadow-lg flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Mapa de Cobertura</h1>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar zona por localidad, código postal o provincia..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Zones List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                Zonas ({filteredZones.length})
              </h2>
              <div className="space-y-2">
                {filteredZones.map((zone) => {
                  const status = getZoneStatus(zone);
                  return (
                    <div
                      key={zone.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedZone?.id === zone.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                      onClick={() => handleZoneSelect(zone)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <span className="font-medium text-gray-900 truncate">
                              {zone.locality}
                            </span>
                            {status === 'covered' ? (
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {zone.postalCodes.slice(0, 3).join(', ')}
                            {zone.postalCodes.length > 3 && ` +${zone.postalCodes.length - 3} más`}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {zone.province} • {zone.department}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Zone Details Panel */}
          {selectedZone && (
            <div className="border-t border-gray-200 bg-gray-50 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {selectedZone.locality}
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Códigos Postales</label>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedZone.postalCodes.join(', ')}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Ubicación</label>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedZone.province}, {selectedZone.department}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Tipo</label>
                  <p className="text-sm text-gray-600 mt-1">{selectedZone.type}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Proveedores Asignados ({selectedZone.coverages.length})
                  </label>
                  {selectedZone.coverages.length > 0 ? (
                    <div className="mt-2 space-y-1">
                      {selectedZone.coverages.map((coverage) => (
                        <div key={coverage.provider.id} className="flex items-center gap-2 p-2 bg-white rounded border">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-gray-900">{coverage.provider.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">Sin proveedores asignados</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Asignar Nuevo Proveedor</label>
                  <div className="mt-2 flex gap-2">
                    <select
                      className="flex-1 text-sm border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={selectedProviderId}
                      onChange={(e) => setSelectedProviderId(e.target.value)}
                    >
                      <option value="">Seleccionar proveedor...</option>
                      {providers.map((provider) => (
                        <option key={provider.id} value={provider.id}>
                          {provider.name}
                        </option>
                      ))}
                    </select>
                    <button
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={assignProvider}
                      disabled={!selectedProviderId || assigning}
                    >
                      {assigning ? 'Asignando...' : 'Asignar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Map Panel */}
        <div className="flex-1">
          <MapComponent zones={filteredZones} onZoneSelect={handleZoneSelect} />
        </div>
      </div>
    </AppLayout>
  );
}