'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import AppLayout from '../components/AppLayout';
import ActionMenu from '../components/ActionMenu';
import { Search, MapPin, Users, CheckCircle, XCircle, Plus, X, Edit2, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

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

export default function MapsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin';

  const [zones, setZones] = useState<Zone[]>([]);
  const [filteredZones, setFilteredZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [newZone, setNewZone] = useState({
    postalCodes: '',
    province: '',
    department: '',
    locality: '',
    type: '',
    geometry: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch zones
      const zonesRes = await fetch('/api/zones');
      if (zonesRes.ok) {
        const zonesData = await zonesRes.json();
        
        console.log('=== DATOS DE ZONAS RECIBIDOS ===');
        console.log('Total zonas:', zonesData.length);
        console.log('Primera zona:', zonesData[0]);
        console.log('Zonas con geometría:', zonesData.filter((z: Zone) => z.geometry).length);
        console.log('Zonas sin geometría:', zonesData.filter((z: Zone) => !z.geometry).length);
        
        // Verificar zona específica "Agronomia"
        const agronomia = zonesData.find((z: Zone) => z.locality === 'Agronomia');
        if (agronomia) {
          console.log('=== ZONA AGRONOMIA ===');
          console.log('ID:', agronomia.id);
          console.log('Geometría:', agronomia.geometry);
          console.log('Tipo de geometría:', agronomia.geometry?.type);
          console.log('Coordenadas válidas:', Array.isArray(agronomia.geometry?.coordinates));
        }
        
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

  useEffect(() => {
    // Filter zones based on search term
    const filtered = zones.filter(zone =>
      zone.locality.toLowerCase().includes(searchTerm.toLowerCase()) ||
      zone.postalCodes.some(cp => cp.includes(searchTerm)) ||
      zone.province.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredZones(filtered);
  }, [zones, searchTerm]);

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
        // Send notification
        const providerName = providers.find(p => p.id === selectedProviderId)?.name || 'Proveedor';
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'ASSIGN_PROVIDER',
            message: `Proveedor ${providerName} asignado a zona ${selectedZone.locality}`
          })
        });
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

  const handleDrawCreated = (geoJson: any) => {
    setNewZone({
      postalCodes: '',
      province: '',
      department: '',
      locality: '',
      type: '',
      geometry: JSON.stringify(geoJson, null, 2),
    });
    setShowCreateModal(true);
  };

  const removeProviderAssignment = async (coverageId: string) => {
    if (!confirm('¿Estás seguro de que quieres remover esta asignación de proveedor?')) return;

    try {
      const response = await fetch(`/api/provider-coverages/${coverageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh zones data
        await loadData();
        // Keep the same zone selected
        const updatedZone = zones.find(z => z.id === selectedZone?.id);
        if (updatedZone) {
          setSelectedZone(updatedZone);
        }
        // Send notification
        const coverage = selectedZone?.coverages.find(c => c.id === coverageId);
        const providerName = coverage?.provider.name || 'Proveedor';
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'UNASSIGN_PROVIDER',
            message: `Proveedor ${providerName} desasignado de zona ${selectedZone?.locality}`
          })
        });
      }
    } catch (error) {
      console.error('Error removing provider assignment:', error);
    }
  };

  const createZone = async () => {
    try {
      // Parse postal codes (comma separated)
      const postalCodesArray = newZone.postalCodes.split(',').map(cp => cp.trim()).filter(cp => cp);
      
      // Parse geometry (expecting GeoJSON format)
      let geometryObj;
      try {
        geometryObj = JSON.parse(newZone.geometry);
      } catch (e) {
        alert('El formato del geometry debe ser un JSON válido');
        return;
      }

      const response = await fetch('/api/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postalCodes: postalCodesArray,
          province: newZone.province,
          department: newZone.department,
          locality: newZone.locality,
          type: newZone.type,
          geometry: geometryObj,
        }),
      });

      if (response.ok) {
        // Refresh zones data
        await loadData();
        // Close modal and reset form
        setShowCreateModal(false);
        setNewZone({
          postalCodes: '',
          province: '',
          department: '',
          locality: '',
          type: '',
          geometry: '',
        });
        // Send notification
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'NEW_ZONE',
            message: `Nueva zona creada: ${newZone.locality}`
          })
        });
      } else {
        const error = await response.json();
        alert(`Error al crear zona: ${error.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error creating zone:', error);
      alert('Error al crear zona');
    }
  };

  const openEditModal = (zone: Zone) => {
    setEditingZone(zone);
    setNewZone({
      postalCodes: zone.postalCodes.join(', '),
      province: zone.province,
      department: zone.department,
      locality: zone.locality,
      type: zone.type,
      geometry: JSON.stringify(zone.geometry, null, 2),
    });
    setShowEditModal(true);
  };

  const updateZone = async () => {
    if (!editingZone) return;

    try {
      // Parse postal codes (comma separated)
      const postalCodesArray = newZone.postalCodes.split(',').map(cp => cp.trim()).filter(cp => cp);
      
      // Parse geometry (expecting GeoJSON format)
      let geometryObj;
      try {
        geometryObj = JSON.parse(newZone.geometry);
      } catch (e) {
        alert('El formato del geometry debe ser un JSON válido');
        return;
      }

      const response = await fetch(`/api/zones/${editingZone.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postalCodes: postalCodesArray,
          province: newZone.province,
          department: newZone.department,
          locality: newZone.locality,
          type: newZone.type,
          geometry: geometryObj,
        }),
      });

      if (response.ok) {
        // Refresh zones data
        await loadData();
        // Close modal and reset form
        setShowEditModal(false);
        setEditingZone(null);
        setNewZone({
          postalCodes: '',
          province: '',
          department: '',
          locality: '',
          type: '',
          geometry: '',
        });
        // Send notification
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'EDIT_ZONE',
            message: `Zona editada: ${editingZone.locality}`
          })
        });
      } else {
        const error = await response.json();
        alert(`Error al actualizar zona: ${error.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error updating zone:', error);
      alert('Error al actualizar zona');
    }
  };

  const deleteZone = async (zoneId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta zona? Esta acción no se puede deshacer.')) return;

    try {
      const response = await fetch(`/api/zones/${zoneId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh zones data
        await loadData();
        // Clear selection if deleted zone was selected
        if (selectedZone?.id === zoneId) {
          setSelectedZone(null);
        }
      } else {
        const error = await response.json();
        alert(`Error al eliminar zona: ${error.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error deleting zone:', error);
      alert('Error al eliminar zona');
    }
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
          <div className="p-4 border-b border-gray-200 sticky top-0 z-10 bg-white">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl font-bold text-gray-900">Mapa de Cobertura</h1>
              {isAdmin && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Nueva Zona"
                >
                  <Plus className="h-5 w-5" />
                </button>
              )}
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar zona por localidad, código postal o provincia..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-gray-900 truncate">
                  {selectedZone.locality}
                </h3>
                {/* ActionMenu de tres puntitos */}
                <div>
                  {isAdmin && (
                    <ActionMenu
                      onEdit={() => openEditModal(selectedZone)}
                      onDelete={() => deleteZone(selectedZone.id)}
                      editLabel="Editar"
                      deleteLabel="Eliminar"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="block text-xs font-medium text-gray-500 mb-0.5">Códigos Postales</span>
                  <span className="text-gray-700">{selectedZone.postalCodes.join(', ')}</span>
                </div>
                <div>
                  <span className="block text-xs font-medium text-gray-500 mb-0.5">Ubicación</span>
                  <span className="text-gray-700">{selectedZone.province}, {selectedZone.department}</span>
                </div>
                <div>
                  <span className="block text-xs font-medium text-gray-500 mb-0.5">Tipo</span>
                  <span className="text-gray-700">{selectedZone.type}</span>
                </div>
                <div>
                  <span className="block text-xs font-medium text-gray-500 flex items-center gap-2 mb-0.5">
                    <Users className="h-4 w-4" /> Proveedores Asignados ({selectedZone.coverages.length})
                  </span>
                  {selectedZone.coverages.length > 0 ? (
                    <div className="mt-1 space-y-1">
                      {selectedZone.coverages.map((coverage) => (
                        <div key={coverage.provider.id} className="flex items-center justify-between p-1 bg-white rounded border border-gray-100">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-xs text-gray-900">{coverage.provider.name}</span>
                          </div>
                          <button
                            onClick={() => removeProviderAssignment(coverage.id)}
                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                            title="Remover asignación"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 mt-1">Sin proveedores asignados</span>
                  )}
                </div>
                <div>
                  <span className="block text-xs font-medium text-gray-500 mb-0.5">Asignar Nuevo Proveedor</span>
                  <div className="mt-1 flex gap-2">
                    <select
                      className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <MapComponent zones={filteredZones} onZoneSelect={handleZoneSelect} selectedZone={selectedZone} onDrawCreated={handleDrawCreated} />
        </div>
      </div>

      {/* Create Zone Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Crear Nueva Zona</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Códigos Postales (separados por comas)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1234, 5678, 9012"
                  value={newZone.postalCodes}
                  onChange={(e) => setNewZone({ ...newZone, postalCodes: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provincia
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Buenos Aires"
                  value={newZone.province}
                  onChange={(e) => setNewZone({ ...newZone, province: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Departamento
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="La Plata"
                  value={newZone.department}
                  onChange={(e) => setNewZone({ ...newZone, department: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Localidad
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="City Bell"
                  value={newZone.locality}
                  onChange={(e) => setNewZone({ ...newZone, locality: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="BARRIO, CIUDAD, etc."
                  value={newZone.type}
                  onChange={(e) => setNewZone({ ...newZone, type: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Geometry (GeoJSON)
                </label>
                <textarea
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  placeholder={'{\n  "type": "Polygon",\n  "coordinates": [[[-58.123, -34.456], ...]]\n}'}
                  value={newZone.geometry}
                  onChange={(e) => setNewZone({ ...newZone, geometry: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formato GeoJSON válido. Puedes usar herramientas como geojson.io para crear geometrías.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={createZone}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Crear Zona
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Zone Modal */}
      {showEditModal && editingZone && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Editar Zona: {editingZone.locality}</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingZone(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Códigos Postales (separados por comas)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1234, 5678, 9012"
                  value={newZone.postalCodes}
                  onChange={(e) => setNewZone({ ...newZone, postalCodes: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provincia
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Buenos Aires"
                  value={newZone.province}
                  onChange={(e) => setNewZone({ ...newZone, province: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Departamento
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="La Plata"
                  value={newZone.department}
                  onChange={(e) => setNewZone({ ...newZone, department: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Localidad
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="City Bell"
                  value={newZone.locality}
                  onChange={(e) => setNewZone({ ...newZone, locality: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="BARRIO, CIUDAD, etc."
                  value={newZone.type}
                  onChange={(e) => setNewZone({ ...newZone, type: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Geometry (GeoJSON)
                </label>
                <textarea
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  placeholder={'{\n  "type": "Polygon",\n  "coordinates": [[[-58.123, -34.456], ...]]\n}'}
                  value={newZone.geometry}
                  onChange={(e) => setNewZone({ ...newZone, geometry: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formato GeoJSON válido. Puedes usar herramientas como geojson.io para crear geometrías.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingZone(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={updateZone}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}