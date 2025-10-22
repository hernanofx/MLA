'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import AppLayout from '../components/AppLayout';
import ActionMenu from '../components/ActionMenu';
import { Search, MapPin, Users, CheckCircle, XCircle, Plus, X, Edit2, Trash2, Download, Layers, RefreshCw, AlertCircle, Info } from 'lucide-react';
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
  const [showLegend, setShowLegend] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Esc to close modals and panels
      if (e.key === 'Escape') {
        if (showCreateModal) {
          setShowCreateModal(false);
        } else if (showEditModal) {
          setShowEditModal(false);
        } else if (selectedZone) {
          setSelectedZone(null);
        } else if (showLegend) {
          setShowLegend(false);
        }
      }

      // Ctrl+F or Cmd+F to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"][placeholder*="Buscar"]') as HTMLInputElement;
        searchInput?.focus();
      }

      // Ctrl+N or Cmd+N to create new zone (admin only)
      if (isAdmin && (e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setShowCreateModal(true);
      }

      // Ctrl+L or Cmd+L to toggle legend
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        setShowLegend(!showLegend);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCreateModal, showEditModal, selectedZone, showLegend, isAdmin]);

  // Toast notification helper
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Clear search helper
  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleExport = async (filter: string, format: string) => {
    try {
      const response = await fetch(`/api/zones/export?filter=${filter}&format=${format}`);
      if (!response.ok) throw new Error('Error en la exportación');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zonas_${filter}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Error al exportar datos');
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
        // Send notification and show toast
        const providerName = providers.find(p => p.id === selectedProviderId)?.name || 'Proveedor';
        showToast(`✓ Proveedor ${providerName} asignado exitosamente`);
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
        // Send notification and show toast
        const coverage = selectedZone?.coverages.find(c => c.id === coverageId);
        const providerName = coverage?.provider.name || 'Proveedor';
        showToast(`✓ Proveedor ${providerName} removido exitosamente`);
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
        // Send notification and show toast
        showToast(`✓ Nueva zona "${newZone.locality}" creada exitosamente`);
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
        // Send notification and show toast
        showToast(`✓ Zona "${editingZone.locality}" actualizada exitosamente`);
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
        showToast('✓ Zona eliminada exitosamente');
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
        <div className="h-screen flex bg-gray-50">
          {/* Left Panel Skeleton */}
          <div className="w-96 bg-white shadow-lg flex flex-col">
            {/* Header Skeleton */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="h-7 w-40 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
              <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse"></div>
            </div>

            {/* List Skeleton */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="h-6 w-32 bg-gray-200 rounded mb-3 animate-pulse"></div>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="p-3 rounded-lg border border-gray-200 bg-white">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 w-40 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Map Skeleton */}
          <div className="flex-1 relative bg-gray-100">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Cargando mapa y zonas...</p>
                <p className="text-gray-400 text-sm mt-1">Esto puede tardar unos segundos</p>
              </div>
            </div>
          </div>
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
                  className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Buscar zonas"
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Limpiar búsqueda"
                    title="Limpiar búsqueda"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {/* Search Results Counter */}
              {searchTerm && (
                <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Mostrando {filteredZones.length} de {zones.length} zonas
                </div>
              )}
            </div>

            {/* Zones List */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-3">
                  Zonas ({filteredZones.length})
                </h2>
                {filteredZones.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No se encontraron zonas</p>
                    <p className="text-gray-400 text-sm mt-1">
                      {searchTerm ? 'Intenta con otros términos de búsqueda' : 'No hay zonas disponibles'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredZones.map((zone) => {
                      const status = getZoneStatus(zone);
                      const providerCount = zone.coverages.length;
                      return (
                        <div
                          key={zone.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                            selectedZone?.id === zone.id
                              ? 'border-blue-500 bg-blue-50 shadow-sm'
                              : 'border-gray-200 bg-white hover:border-blue-300'
                          }`}
                          onClick={() => handleZoneSelect(zone)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                <span className="font-medium text-gray-900 truncate">
                                  {zone.locality}
                                </span>
                                {/* Provider Badge */}
                                {providerCount > 0 ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                    <Users className="h-3 w-3" />
                                    {providerCount}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                    Sin cobertura
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 truncate">
                                {zone.postalCodes.slice(0, 3).join(', ')}
                                {zone.postalCodes.length > 3 && ` +${zone.postalCodes.length - 3} más`}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-gray-500">
                                  {zone.province} • {zone.department}
                                </p>
                                {zone.type && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                                    {zone.type}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Zone Details Panel */}
            {selectedZone && (
              <div className="border-t border-gray-200 bg-gradient-to-b from-white to-gray-50 p-4 animate-in slide-in-from-bottom duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <h3 className="text-base font-bold text-gray-900 truncate">
                      {selectedZone.locality}
                    </h3>
                  </div>
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

                <div className="space-y-3 text-sm">
                  {/* Coverage Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-600">Cobertura</span>
                      <span className="text-xs font-semibold text-blue-600">
                        {selectedZone.coverages.length > 0 ? '100%' : '0%'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          selectedZone.coverages.length > 0 ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        style={{ width: selectedZone.coverages.length > 0 ? '100%' : '0%' }}
                      ></div>
                    </div>
                  </div>

                  {/* Postal Codes */}
                  <div className="bg-white p-2 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <svg className="h-3.5 w-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs font-medium text-gray-600">Códigos Postales</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {selectedZone.postalCodes.map((cp, idx) => (
                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          {cp}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Location */}
                  <div className="bg-white p-2 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <svg className="h-3.5 w-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-xs font-medium text-gray-600">Ubicación</span>
                    </div>
                    <span className="text-sm text-gray-900">{selectedZone.province}, {selectedZone.department}</span>
                  </div>

                  {/* Type Chip */}
                  {selectedZone.type && (
                    <div className="bg-white p-2 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Layers className="h-3.5 w-3.5 text-gray-500" />
                        <span className="text-xs font-medium text-gray-600">Tipo</span>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        selectedZone.type === 'CIUDAD' ? 'bg-purple-100 text-purple-700' :
                        selectedZone.type === 'BARRIO' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {selectedZone.type}
                      </span>
                    </div>
                  )}

                  {/* Providers Section */}
                  <div className="bg-white p-2 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Users className="h-3.5 w-3.5 text-gray-500" />
                      <span className="text-xs font-medium text-gray-600">
                        Proveedores Asignados ({selectedZone.coverages.length})
                      </span>
                    </div>
                    {selectedZone.coverages.length > 0 ? (
                      <div className="space-y-1.5">
                        {selectedZone.coverages.map((coverage) => (
                          <div key={coverage.provider.id} className="flex items-center justify-between p-2 bg-green-50 rounded-md border border-green-200">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-xs font-medium text-green-900">{coverage.provider.name}</span>
                            </div>
                            {isAdmin && (
                              <button
                                onClick={() => removeProviderAssignment(coverage.id)}
                                className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-100 transition-colors"
                                title="Remover asignación"
                                aria-label={`Remover ${coverage.provider.name}`}
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-3">
                        <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-1" />
                        <span className="text-xs text-gray-400">Sin proveedores asignados</span>
                      </div>
                    )}
                  </div>

                  {/* Assign New Provider */}
                  {isAdmin && (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <span className="block text-xs font-medium text-blue-900 mb-2">Asignar Nuevo Proveedor</span>
                      <div className="flex gap-2">
                        <select
                          className="flex-1 text-xs border border-blue-300 rounded-md px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
                          className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                          onClick={assignProvider}
                          disabled={!selectedProviderId || assigning}
                        >
                          {assigning ? 'Asignando...' : 'Asignar'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Map Panel */}
          <div className="flex-1 relative">
            <MapComponent zones={filteredZones} onZoneSelect={handleZoneSelect} selectedZone={selectedZone} onDrawCreated={handleDrawCreated} providers={providers} />
            
            {/* Floating Legend */}
            {showLegend && providers.length > 0 && (
              <div className="absolute top-4 right-4 bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-xs animate-in slide-in-from-right duration-300" style={{ zIndex: 9500 }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-blue-600" />
                    Leyenda de Proveedores
                  </h3>
                  <button
                    onClick={() => setShowLegend(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded"
                    aria-label="Cerrar leyenda"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {providers.map((provider, index) => {
                    const pastelColors = [
                      '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFBA', '#BAE1FF', '#D7BAFF', '#FFB3D9', '#FFD1B3', '#E6FFB3', '#B3FFDF',
                      '#B3D7FF', '#D7B3FF', '#FFB3E6', '#FFE6B3', '#B3FFE6', '#B3D1FF', '#E6B3FF', '#FFB3F0', '#FFF0B3', '#B3FFF0'
                    ];
                    const color = pastelColors[index % pastelColors.length];
                    return (
                      <div key={provider.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                        <div
                          className="w-6 h-6 rounded border-2 border-gray-300 flex-shrink-0"
                          style={{ backgroundColor: color }}
                        ></div>
                        <span className="text-xs font-medium text-gray-700 truncate">{provider.name}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Los colores indican qué proveedor cubre cada zona
                  </p>
                </div>
              </div>
            )}

            {/* Legend Toggle Button */}
            <button
              onClick={() => setShowLegend(!showLegend)}
              className={`absolute top-4 right-4 bg-white rounded-lg shadow-lg border-2 p-3 transition-all duration-200 hover:shadow-xl ${
                showLegend ? 'border-blue-500' : 'border-gray-200 hover:border-blue-300'
              }`}
              style={{ zIndex: 9500 }}
              aria-label={showLegend ? 'Ocultar leyenda' : 'Mostrar leyenda'}
              title={showLegend ? 'Ocultar leyenda' : 'Mostrar leyenda'}
            >
              <Layers className={`h-5 w-5 ${showLegend ? 'text-blue-600' : 'text-gray-600'}`} />
            </button>
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
      
      {/* Floating Export Buttons - With higher z-index */}
      <div className="fixed bottom-4 right-4" style={{ zIndex: 10000 }}>
        <div className="flex flex-col gap-1 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-200 p-2">
          <div className="flex gap-1">
            <button 
              onClick={() => handleExport('withProviders', 'xlsx')} 
              className="p-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
              title="Zonas con proveedores asignados"
              aria-label="Exportar zonas con proveedores"
            >
              <Download className="h-4 w-4" />
            </button>
            <button 
              onClick={() => handleExport('withoutProviders', 'xlsx')} 
              className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
              title="Zonas sin proveedores asignados"
              aria-label="Exportar zonas sin proveedores"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
          <div className="flex gap-1">
            <button 
              onClick={() => handleExport('postalCodes', 'xlsx')} 
              className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
              title="Códigos postales con zonas asociadas"
              aria-label="Exportar códigos postales"
            >
              <Download className="h-4 w-4" />
            </button>
            <button 
              onClick={() => handleExport('all', 'xlsx')} 
              className="p-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
              title="Todas las zonas"
              aria-label="Exportar todas las zonas"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-[10001] animate-in slide-in-from-right duration-300">
          <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[300px] border-2 border-green-700">
            <div className="flex-shrink-0">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{toastMessage}</p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="flex-shrink-0 text-green-100 hover:text-white transition-colors p-1 hover:bg-green-700 rounded"
              aria-label="Cerrar notificación"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}