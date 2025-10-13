'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ActionMenu from '@/app/components/ActionMenu';
import { FileSpreadsheet } from 'lucide-react';

interface Inventory {
  id: string;
  entryId: string | null;
  providerId: string | null;
  locationId: string;
  quantity: number;
  status: string;
  trackingNumbers: string | null;
  entry?: {
    id: string;
    provider: { name: string };
  };
  provider?: { name: string };
  location: {
    name: string;
    warehouse: { name: string };
  };
}

interface Provider {
  id: string;
  name: string;
}

interface Warehouse {
  id: string;
  name: string;
}

interface Entry {
  id: string;
  provider: { name: string };
}

interface Location {
  id: string;
  name: string;
  warehouse: { name: string };
}

export default function InventoryTab() {
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    providerId: '',
    locationId: '',
    quantity: 1,
    status: 'stored',
    trackingNumbers: '',
  });
  const [filters, setFilters] = useState({
    providerId: '',
    warehouseId: '',
    locationId: '',
    status: '',
    trackingNumber: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(25);
  const { data: session } = useSession();

  useEffect(() => {
    fetchInventories(1);
    setCurrentPage(1);
  }, [filters.providerId, filters.warehouseId, filters.locationId, filters.status, filters.trackingNumber]);

  useEffect(() => {
    fetchLocations(filters.warehouseId);
  }, [filters.warehouseId]);

  useEffect(() => {
    fetchProviders();
    fetchWarehouses();
  }, []);

  const fetchInventories = async (page: number = 1) => {
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
      const res = await fetch(`/api/inventory?${params}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setInventories(data.inventories || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to fetch inventories:', error);
      setInventories([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEntries = async () => {
    try {
      const res = await fetch('/api/entries');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setEntries(data.entries || []);
    } catch (error) {
      console.error('Failed to fetch entries:', error);
      setEntries([]);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setFormData({ providerId: '', locationId: '', quantity: 1, status: 'stored', trackingNumbers: '' });
        setShowForm(false);
        fetchInventories(currentPage);
      }
    } catch (error) {
      console.error('Failed to create inventory:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este registro de inventario?')) return;

    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchInventories(currentPage);
      }
    } catch (error) {
      console.error('Failed to delete inventory:', error);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  </div>;

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Inventario</h2>
          <p className="mt-2 text-sm text-gray-700">Gestiona el inventario de paquetes en las ubicaciones</p>
        </div>
        <div className="mt-4 sm:mt-0">
          {session?.user?.role === 'admin' && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 h-10"
            >
              {showForm ? 'Cancelar' : 'Nuevo Registro'}
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-8 bg-white shadow sm:rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="filterProvider" className="block text-sm font-medium text-gray-700">
                Proveedor
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
                <option value="stored">Almacenado</option>
                <option value="shipped">Enviado</option>
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
          </div>
        </div>
      </div>

      {showForm && (
        <div className="mb-8 bg-white shadow sm:rounded-lg border border-gray-200">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Crear Nuevo Registro de Inventario</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="providerId" className="block text-sm font-medium text-gray-700">
                    Proveedor
                  </label>
                  <select
                    id="providerId"
                    value={formData.providerId}
                    onChange={(e) => setFormData({ ...formData, providerId: e.target.value })}
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
                <div>
                  <label htmlFor="locationId" className="block text-sm font-medium text-gray-700">
                    Ubicación
                  </label>
                  <select
                    id="locationId"
                    value={formData.locationId}
                    onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
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
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Estado
                  </label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="stored">Almacenado</option>
                    <option value="shipped">Enviado</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="trackingNumbers" className="block text-sm font-medium text-gray-700">
                    Tracking Numbers
                  </label>
                  <input
                    type="text"
                    id="trackingNumbers"
                    value={formData.trackingNumbers}
                    onChange={(e) => setFormData({ ...formData, trackingNumbers: e.target.value })}
                    placeholder="Ingrese tracking numbers separados por coma"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Crear Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proveedor
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Almacén
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ubicación
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tracking Numbers
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
              {inventories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    No hay registros de inventario
                  </td>
                </tr>
              ) : (
                inventories.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {inv.entry?.provider?.name || inv.provider?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {inv.location?.warehouse?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {inv.location?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {inv.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {inv.trackingNumbers || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        inv.status === 'stored'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {inv.status === 'stored' ? 'Almacenado' : 'Enviado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {session?.user?.role === 'admin' && (
                        <ActionMenu
                          editHref={`/stocks/inventory/${inv.id}/edit`}
                          onDelete={() => handleDelete(inv.id)}
                        />
                      )}
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
            Mostrando {inventories.length > 0 ? ((currentPage - 1) * limit) + 1 : 0} a {Math.min(currentPage * limit, total)} de {total} resultados
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              const params = new URLSearchParams();
              if (filters.providerId) params.append('providerId', filters.providerId);
              if (filters.warehouseId) params.append('warehouseId', filters.warehouseId);
              if (filters.locationId) params.append('locationId', filters.locationId);
              if (filters.status) params.append('status', filters.status);
              if (filters.trackingNumber) params.append('trackingNumber', filters.trackingNumber);
              const url = `/api/inventory/export?${params}`
              window.open(url, '_blank')
            }}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            title="Exportar a Excel"
          >
            <FileSpreadsheet className="h-4 w-4 mr-1" />
            Excel
          </button>
          {totalPages > 1 && (
            <div className="flex flex-wrap justify-center sm:justify-end gap-1">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                ← Anterior
              </button>
              
              {/* Mobile pagination - show current page and nearby pages */}
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

              {/* Mobile current page indicator */}
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