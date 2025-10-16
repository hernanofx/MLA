'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ActionMenu from '@/app/components/ActionMenu';
import { FileSpreadsheet, ArrowRight, Package, Eye } from 'lucide-react';

interface Package {
  id: string;
  trackingNumber: string;
  status: string;
  currentProvider?: {
    id: string;
    name: string;
  };
  currentLocation: {
    id: string;
    name: string;
    warehouse: { name: string };
  };
  inventory: {
    provider?: { name: string };
  };
  createdAt: string;
}

interface Provider {
  id: string;
  name: string;
}

interface Warehouse {
  id: string;
  name: string;
}

interface Location {
  id: string;
  name: string;
  warehouse: { name: string };
}

export default function PackagesTab() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showBulkActionsModal, setShowBulkActionsModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [selectedPackages, setSelectedPackages] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<'transfer' | 'deliver' | 'status'>('status');
  const [bulkStatus, setBulkStatus] = useState('');
  const [transferData, setTransferData] = useState({
    toProviderId: '',
    toLocationId: '',
    notes: '',
  });
  const [filters, setFilters] = useState({
    providerId: '',
    warehouseId: '',
    locationId: '',
    status: '',
    trackingNumber: '',
    trackingNumbers: '', // Para búsqueda múltiple
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(25);
  const { data: session } = useSession();

  useEffect(() => {
    fetchPackages(1);
    setCurrentPage(1);
    setSelectedPackages(new Set()); // Limpiar selección al cambiar filtros
  }, [filters.providerId, filters.warehouseId, filters.locationId, filters.status, filters.trackingNumber, filters.trackingNumbers]);

  useEffect(() => {
    fetchLocations(filters.warehouseId);
  }, [filters.warehouseId]);

  useEffect(() => {
    fetchProviders();
    fetchWarehouses();
  }, []);

  const fetchPackages = async (page: number = 1) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      if (filters.providerId) params.append('providerId', filters.providerId);
      if (filters.warehouseId) params.append('warehouseId', filters.warehouseId);
      if (filters.locationId) params.append('locationId', filters.locationId);
      if (filters.status) params.append('status', filters.status);
      if (filters.trackingNumber) params.append('trackingNumber', filters.trackingNumber);
      if (filters.trackingNumbers) params.append('trackingNumbers', filters.trackingNumbers);
      const res = await fetch(`/api/packages?${params}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setPackages(data.packages || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to fetch packages:', error);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async (warehouseId?: string) => {
    try {
      const params = new URLSearchParams();
      if (warehouseId) params.append('warehouseId', warehouseId);
      const res = await fetch(`/api/locations?${params}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setLocations(Array.isArray(data.locations) ? data.locations : []);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
      setLocations([]);
    }
  };

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/providers');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setProviders(data.providers || []);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
      setProviders([]);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const res = await fetch('/api/warehouses');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setWarehouses(data.map((w: any) => ({ id: w.id, name: w.name })));
    } catch (error) {
      console.error('Failed to fetch warehouses:', error);
      setWarehouses([]);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage) return;

    try {
      const res = await fetch(`/api/packages/${selectedPackage.id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferData),
      });
      if (res.ok) {
        setShowTransferModal(false);
        setSelectedPackage(null);
        setTransferData({ toProviderId: '', toLocationId: '', notes: '' });
        fetchPackages(currentPage);
      }
    } catch (error) {
      console.error('Failed to transfer package:', error);
    }
  };

  const handleDeliver = async (pkg: Package) => {
    if (!confirm('¿Estás seguro de que quieres marcar este paquete como entregado?')) return;

    try {
      const res = await fetch(`/api/packages/${pkg.id}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Entrega final' }),
      });
      if (res.ok) {
        fetchPackages(currentPage);
      }
    } catch (error) {
      console.error('Failed to deliver package:', error);
    }
  };

  const toggleSelectPackage = (packageId: string) => {
    const newSelected = new Set(selectedPackages);
    if (newSelected.has(packageId)) {
      newSelected.delete(packageId);
    } else {
      newSelected.add(packageId);
    }
    setSelectedPackages(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedPackages.size === packages.length) {
      setSelectedPackages(new Set());
    } else {
      setSelectedPackages(new Set(packages.map(p => p.id)));
    }
  };

  const handleBulkAction = async () => {
    if (selectedPackages.size === 0) return;

    const packageIds = Array.from(selectedPackages);

    try {
      let endpoint = '';
      let body: any = { packageIds };

      if (bulkAction === 'status') {
        endpoint = '/api/packages/bulk-update';
        body.status = bulkStatus;
      } else if (bulkAction === 'transfer') {
        endpoint = '/api/packages/bulk-transfer';
        body = { ...body, ...transferData };
      } else if (bulkAction === 'deliver') {
        endpoint = '/api/packages/bulk-deliver';
        body.notes = 'Entrega masiva';
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowBulkActionsModal(false);
        setSelectedPackages(new Set());
        setBulkStatus('');
        setTransferData({ toProviderId: '', toLocationId: '', notes: '' });
        fetchPackages(currentPage);
      }
    } catch (error) {
      console.error('Failed to perform bulk action:', error);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  </div>;

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Paquetes</h2>
          <p className="mt-2 text-sm text-gray-700">Gestiona paquetes individuales por tracking number</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-8 bg-white shadow sm:rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="filterProvider" className="block text-sm font-medium text-gray-700">
                Proveedor Actual
              </label>
              <select
                id="filterProvider"
                value={filters.providerId}
                onChange={(e) => setFilters({ ...filters, providerId: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Todos los proveedores</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filterWarehouse" className="block text-sm font-medium text-gray-700">
                Almacén
              </label>
              <select
                id="filterWarehouse"
                value={filters.warehouseId}
                onChange={(e) => setFilters({ ...filters, warehouseId: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Todos los almacenes</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filterLocation" className="block text-sm font-medium text-gray-700">
                Ubicación
              </label>
              <select
                id="filterLocation"
                value={filters.locationId}
                onChange={(e) => setFilters({ ...filters, locationId: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Todas las ubicaciones</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.warehouse.name} - {location.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filterStatus" className="block text-sm font-medium text-gray-700">
                Estado
              </label>
              <select
                id="filterStatus"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Todos los estados</option>
                <option value="ingresado">Ingresado</option>
                <option value="almacenado">Almacenado</option>
                <option value="en_traspaso">En Traspaso</option>
                <option value="entregado">Entregado</option>
              </select>
            </div>
            <div>
              <label htmlFor="filterTrackingNumber" className="block text-sm font-medium text-gray-700">
                Tracking Number
              </label>
              <input
                type="text"
                id="filterTrackingNumber"
                value={filters.trackingNumber}
                onChange={(e) => setFilters({ ...filters, trackingNumber: e.target.value })}
                placeholder="Buscar por tracking number"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div className="lg:col-span-2">
              <label htmlFor="filterTrackingNumbers" className="block text-sm font-medium text-gray-700">
                Búsqueda Múltiple (separados por coma, espacio o nueva línea)
              </label>
              <textarea
                id="filterTrackingNumbers"
                value={filters.trackingNumbers}
                onChange={(e) => setFilters({ ...filters, trackingNumbers: e.target.value })}
                placeholder="Ej: TN001, TN002, TN003"
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedPackages.size > 0 && (
        <div className="bg-indigo-600 text-white px-4 py-3 rounded-md mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="font-medium">{selectedPackages.size} paquete{selectedPackages.size > 1 ? 's' : ''} seleccionado{selectedPackages.size > 1 ? 's' : ''}</span>
            <button
              onClick={() => setSelectedPackages(new Set())}
              className="text-sm underline hover:no-underline"
            >
              Deseleccionar todos
            </button>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setBulkAction('status');
                setShowBulkActionsModal(true);
              }}
              className="bg-white text-indigo-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-50"
            >
              Cambiar Estado
            </button>
            <button
              onClick={() => {
                setBulkAction('transfer');
                setShowBulkActionsModal(true);
              }}
              className="bg-white text-indigo-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-50"
            >
              Traspasar
            </button>
            <button
              onClick={() => {
                setBulkAction('deliver');
                setShowBulkActionsModal(true);
              }}
              className="bg-white text-indigo-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-50"
            >
              Marcar Entregados
            </button>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && selectedPackage && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Traspasar Paquete</h3>
              <p className="text-sm text-gray-600 mb-4">Tracking: {selectedPackage.trackingNumber}</p>
              <form onSubmit={handleTransfer}>
                <div className="mb-4">
                  <label htmlFor="toProviderId" className="block text-sm font-medium text-gray-700">
                    Nuevo Proveedor
                  </label>
                  <select
                    id="toProviderId"
                    value={transferData.toProviderId}
                    onChange={(e) => setTransferData({ ...transferData, toProviderId: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  >
                    <option value="">Seleccionar Proveedor</option>
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label htmlFor="toLocationId" className="block text-sm font-medium text-gray-700">
                    Nueva Ubicación
                  </label>
                  <select
                    id="toLocationId"
                    value={transferData.toLocationId}
                    onChange={(e) => setTransferData({ ...transferData, toLocationId: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  >
                    <option value="">Seleccionar Ubicación</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.warehouse.name} - {location.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                    Notas
                  </label>
                  <textarea
                    id="notes"
                    value={transferData.notes}
                    onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowTransferModal(false)}
                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                  >
                    Traspasar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Modal */}
      {showBulkActionsModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {bulkAction === 'status' ? 'Cambiar Estado Masivo' : 
                 bulkAction === 'transfer' ? 'Traspaso Masivo' : 
                 'Marcar como Entregados'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {selectedPackages.size} paquete{selectedPackages.size > 1 ? 's' : ''} seleccionado{selectedPackages.size > 1 ? 's' : ''}
              </p>
              
              {bulkAction === 'status' ? (
                <form onSubmit={(e) => { e.preventDefault(); handleBulkAction(); }}>
                  <div className="mb-4">
                    <label htmlFor="bulkStatus" className="block text-sm font-medium text-gray-700">
                      Nuevo Estado
                    </label>
                    <select
                      id="bulkStatus"
                      value={bulkStatus}
                      onChange={(e) => setBulkStatus(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    >
                      <option value="">Seleccionar Estado</option>
                      <option value="ingresado">Ingresado</option>
                      <option value="almacenado">Almacenado</option>
                      <option value="en_traspaso">En Traspaso</option>
                      <option value="entregado">Entregado</option>
                    </select>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowBulkActionsModal(false);
                        setBulkStatus('');
                      }}
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                    >
                      Actualizar
                    </button>
                  </div>
                </form>
              ) : bulkAction === 'transfer' ? (
                <form onSubmit={(e) => { e.preventDefault(); handleBulkAction(); }}>
                  <div className="mb-4">
                    <label htmlFor="bulkToProviderId" className="block text-sm font-medium text-gray-700">
                      Nuevo Proveedor
                    </label>
                    <select
                      id="bulkToProviderId"
                      value={transferData.toProviderId}
                      onChange={(e) => setTransferData({ ...transferData, toProviderId: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    >
                      <option value="">Seleccionar Proveedor</option>
                      {providers.map((provider) => (
                        <option key={provider.id} value={provider.id}>
                          {provider.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label htmlFor="bulkToLocationId" className="block text-sm font-medium text-gray-700">
                      Nueva Ubicación
                    </label>
                    <select
                      id="bulkToLocationId"
                      value={transferData.toLocationId}
                      onChange={(e) => setTransferData({ ...transferData, toLocationId: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    >
                      <option value="">Seleccionar Ubicación</option>
                      {locations.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.warehouse.name} - {location.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label htmlFor="bulkNotes" className="block text-sm font-medium text-gray-700">
                      Notas
                    </label>
                    <textarea
                      id="bulkNotes"
                      value={transferData.notes}
                      onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowBulkActionsModal(false);
                        setTransferData({ toProviderId: '', toLocationId: '', notes: '' });
                      }}
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                    >
                      Traspasar
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <p className="text-sm text-gray-700 mb-4">
                    ¿Está seguro que desea marcar estos {selectedPackages.size} paquetes como entregados?
                  </p>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowBulkActionsModal(false)}
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleBulkAction}
                      className="inline-flex justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={packages.length > 0 && selectedPackages.size === packages.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tracking Number
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proveedor Actual
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ubicación Actual
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {packages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No hay paquetes
                  </td>
                </tr>
              ) : (
                packages.map((pkg) => (
                  <tr key={pkg.id} className={selectedPackages.has(pkg.id) ? 'bg-indigo-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedPackages.has(pkg.id)}
                        onChange={() => toggleSelectPackage(pkg.id)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {pkg.trackingNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pkg.currentProvider?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pkg.currentLocation?.warehouse?.name || 'N/A'} - {pkg.currentLocation?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        pkg.status === 'ingresado' ? 'bg-blue-100 text-blue-800' :
                        pkg.status === 'almacenado' ? 'bg-green-100 text-green-800' :
                        pkg.status === 'en_traspaso' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {pkg.status === 'ingresado' ? 'Ingresado' :
                         pkg.status === 'almacenado' ? 'Almacenado' :
                         pkg.status === 'en_traspaso' ? 'En Traspaso' :
                         'Entregado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => window.open(`/stocks/packages/${pkg.trackingNumber}`, '_blank')}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver Historial"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {session?.user?.role === 'admin' && pkg.status !== 'entregado' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedPackage(pkg);
                                setShowTransferModal(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Traspasar"
                            >
                              <ArrowRight className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeliver(pkg)}
                              className="text-green-600 hover:text-green-900"
                              title="Marcar como Entregado"
                            >
                              <Package className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-8 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="text-sm text-gray-700">
            Mostrando {packages.length > 0 ? ((currentPage - 1) * limit) + 1 : 0} a {Math.min(currentPage * limit, total)} de {total} resultados
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {totalPages > 1 && (
            <div className="flex flex-wrap justify-center sm:justify-end gap-1">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                ← Anterior
              </button>
              
              <div className="hidden sm:flex items-center space-x-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                  if (pageNum > totalPages) return null
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-md border transition-colors ${
                        pageNum === currentPage
                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>

              <div className="sm:hidden flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md">
                {currentPage} / {totalPages}
              </div>

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}