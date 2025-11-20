'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import ActionMenu from '@/app/components/ActionMenu';
import SearchableLocationSelect from '@/app/components/SearchableLocationSelect';
import { FileSpreadsheet, Package, CheckCircle } from 'lucide-react';

interface Inventory {
  id: string;
  entryId: string | null;
  providerId: string | null;
  locationId: string;
  quantity: number;
  status: string;
  trackingNumbers: string | null;
  createdAt: string;
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
    startDate: '',
    endDate: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(25);
  const { data: session } = useSession();
  
  // Estados para el escaneo de códigos de barras
  const [scannedCodes, setScannedCodes] = useState<string[]>([]);
  const [currentBarcode, setCurrentBarcode] = useState('');
  const [showBarcodeFlash, setShowBarcodeFlash] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState('');
  const trackingInputRef = useRef<HTMLInputElement>(null);
  
  // Modal state for detail view
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchInventories(1);
    setCurrentPage(1);
  }, [filters.providerId, filters.warehouseId, filters.locationId, filters.status, filters.trackingNumber, filters.startDate, filters.endDate]);

  useEffect(() => {
    fetchLocations(filters.warehouseId);
  }, [filters.warehouseId]);

  useEffect(() => {
    fetchProviders();
    fetchWarehouses();
    fetchLocations(); // Cargar todas las ubicaciones al inicio
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
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
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
      console.error('Failed to fetch devoluciones:', error);
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
      // Obtener todas las ubicaciones (limit alto para selectores)
      params.append('limit', '1000');
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

  // Ocultar flash con clic o teclas específicas (no Enter para evitar conflicto con scanner)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showBarcodeFlash) {
        // Ignorar Enter y saltos de línea para evitar que el scanner cierre el flash
        if (e.key === 'Enter' || e.key === '\n' || e.key === '\r') {
          return;
        }
        // Cerrar con Escape o cualquier otra tecla
        setShowBarcodeFlash(false);
      }
    };

    const handleClick = () => {
      if (showBarcodeFlash) {
        setShowBarcodeFlash(false);
      }
    };

    if (showBarcodeFlash) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('click', handleClick);
      
      // Auto-cerrar después de 2 segundos
      const autoCloseTimer = setTimeout(() => {
        setShowBarcodeFlash(false);
      }, 2000);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('click', handleClick);
        clearTimeout(autoCloseTimer);
      };
    }
  }, [showBarcodeFlash]);

  // Manejar el escaneo de códigos de barras
  const handleBarcodeScan = (barcode: string) => {
    const cleanBarcode = barcode.trim();
    if (!cleanBarcode) return;

    // Verificar si el código ya fue escaneado (prevenir duplicados)
    if (scannedCodes.includes(cleanBarcode)) {
      alert(`❌ PAQUETE DUPLICADO\n\nEl tracking number "${cleanBarcode}" ya fue escaneado en esta devolución.`);
      setCurrentBarcode('');
      setTimeout(() => {
        if (trackingInputRef.current) {
          trackingInputRef.current.focus();
        }
      }, 100);
      return;
    }

    // Agregar a la lista de códigos escaneados
    const newCodes = [...scannedCodes, cleanBarcode];
    setScannedCodes(newCodes);
    
    // Actualizar la cantidad igual al número de códigos escaneados
    setFormData(prev => ({
      ...prev,
      quantity: newCodes.length,
      trackingNumbers: prev.trackingNumbers ? `${prev.trackingNumbers}, ${cleanBarcode}` : cleanBarcode
    }));

    // Mostrar flash en pantalla completa
    setLastScannedCode(cleanBarcode);
    setShowBarcodeFlash(true);
    
    // Limpiar el input
    setCurrentBarcode('');
    
    // Volver a enfocar el input para el siguiente escaneo
    setTimeout(() => {
      if (trackingInputRef.current) {
        trackingInputRef.current.focus();
      }
    }, 100);
  };

  const handleBarcodeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Si detecta un salto de línea (Enter automático del scanner)
    if (value.includes('\n') || value.includes('\r')) {
      e.preventDefault();
      const cleanValue = value.replace(/[\n\r]/g, '').trim();
      if (cleanValue) {
        handleBarcodeScan(cleanValue);
      }
      return;
    }
    
    setCurrentBarcode(value);
  };

  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      const cleanValue = currentBarcode.trim();
      if (cleanValue) {
        handleBarcodeScan(cleanValue);
      }
    }
  };

  const removeScannedCode = (index: number) => {
    const newCodes = scannedCodes.filter((_, i) => i !== index);
    setScannedCodes(newCodes);
    setFormData(prev => ({
      ...prev,
      quantity: newCodes.length,
      trackingNumbers: newCodes.join(', ')
    }));
  };

  const resetForm = () => {
    setFormData({ providerId: '', locationId: '', quantity: 1, status: 'stored', trackingNumbers: '' });
    setScannedCodes([]);
    setCurrentBarcode('');
    setShowForm(false);
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
        resetForm();
        fetchInventories(currentPage);
      } else {
        const error = await res.json();
        alert(`Error al crear la devolución: ${error.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Failed to create devolución:', error);
      alert('Error al crear la devolución. Por favor, intenta nuevamente.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este registro de devolución?')) return;

    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchInventories(currentPage);
      }
    } catch (error) {
      console.error('Failed to delete devolución:', error);
    }
  };

  const clearFilters = () => {
    setFilters({
      providerId: '',
      warehouseId: '',
      locationId: '',
      status: '',
      trackingNumber: '',
      startDate: '',
      endDate: '',
    });
    setCurrentPage(1);
    fetchInventories(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  </div>;

  return (
    <div>
      {/* Flash de código escaneado en pantalla completa */}
      {showBarcodeFlash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 animate-pulse">
          <div className="text-center px-4 sm:px-8">
            <div className="mb-4 sm:mb-8">
              <CheckCircle className="h-16 w-16 sm:h-24 sm:w-24 md:h-32 md:w-32 text-green-400 mx-auto animate-bounce" />
            </div>
            <div className="text-white">
              <p className="text-lg sm:text-xl md:text-2xl font-medium mb-2 sm:mb-4">Código Escaneado</p>
              <p className="text-3xl sm:text-4xl md:text-6xl font-mono font-bold mb-4 sm:mb-6 md:mb-8 tracking-wider">{lastScannedCode}</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-semibold">
                Paquete #{scannedCodes.length}
              </p>
              <p className="text-sm sm:text-base md:text-lg text-gray-300 mt-2 sm:mt-4">
                Escanea el siguiente o presiona ESC / Click para continuar
              </p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1 sm:mt-2">
                Se cerrará automáticamente en 2 segundos
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Ingreso de devoluciones</h2>
          <p className="mt-2 text-sm text-gray-700">Gestiona el ingreso de devoluciones en las ubicaciones</p>
        </div>
        <div className="mt-4 sm:mt-0">
          {(session?.user?.role === 'admin' || session?.user?.role === 'operario') && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 h-10"
            >
              {showForm ? 'Cancelar' : 'Nueva Devolución'}
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
              <SearchableLocationSelect
                id="filterLocation"
                locations={locations}
                value={filters.locationId}
                onChange={(value) => setFilters({ ...filters, locationId: value })}
                placeholder="Buscar ubicación..."
              />
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
                <option value="shipped">En Tránsito</option>
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
            <div>
              <label htmlFor="filterStartDate" className="block text-sm font-medium text-gray-700">
                Fecha Desde
              </label>
              <input
                type="date"
                id="filterStartDate"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="filterEndDate" className="block text-sm font-medium text-gray-700">
                Fecha Hasta
              </label>
              <input
                type="date"
                id="filterEndDate"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="mb-8 bg-white shadow sm:rounded-lg border border-gray-200">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Crear Nuevo Registro de Devolución</h3>
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
                  <SearchableLocationSelect
                    id="locationId"
                    locations={locations}
                    value={formData.locationId}
                    onChange={(value) => setFormData({ ...formData, locationId: value })}
                    placeholder="Seleccionar ubicación..."
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
                    <option value="shipped">En Tránsito</option>
                  </select>
                </div>
              </div>

              {/* Sección de Escaneo de Códigos de Barras */}
              <div className="mt-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 border-2 border-indigo-200">
                <div className="flex items-center mb-4">
                  <Package className="h-6 w-6 text-indigo-600 mr-2" />
                  <h4 className="text-lg font-medium text-gray-900">Escaneo de Códigos de Barras</h4>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="barcodeInput" className="block text-sm font-medium text-gray-700 mb-2">
                    Tracking Number (Escanea con pistola o ingresa manualmente)
                  </label>
                  <input
                    ref={trackingInputRef}
                    type="text"
                    id="barcodeInput"
                    value={currentBarcode}
                    onChange={handleBarcodeInputChange}
                    onKeyDown={handleBarcodeKeyDown}
                    placeholder="Escanea el código de barras aquí..."
                    className="w-full px-4 py-3 text-2xl border-2 border-indigo-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                    autoFocus
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Cada escaneo incrementa automáticamente la cantidad y agrega el tracking number a la lista
                  </p>
                </div>

                {/* Contador de paquetes escaneados */}
                <div className="bg-white rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Paquetes escaneados:</span>
                    <span className="text-2xl font-bold text-indigo-600">{scannedCodes.length}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-medium text-gray-700">Cantidad total:</span>
                    <span className="text-xl font-semibold text-gray-900">{formData.quantity}</span>
                  </div>
                </div>

                {/* Lista de códigos escaneados */}
                {scannedCodes.length > 0 && (
                  <div className="bg-white rounded-lg p-4 max-h-60 overflow-y-auto">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Códigos escaneados:</h5>
                    <div className="space-y-2">
                      {scannedCodes.map((code, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                          <span className="font-mono text-sm">{code}</span>
                          <button
                            type="button"
                            onClick={() => removeScannedCode(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Campo oculto para tracking numbers (para compatibilidad) */}
              <input type="hidden" value={formData.trackingNumbers} />
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
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
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Devolución
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proveedor
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Almacén
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ubicación
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Tracking Numbers
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="relative px-4 py-3">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventories.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-4 text-center text-sm text-gray-500">
                    No hay registros de devoluciones
                  </td>
                </tr>
              ) : (
                inventories.map((inv) => (
                  <tr 
                    key={inv.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedInventory(inv)
                      setShowDetailModal(true)
                    }}
                  >
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex flex-col">
                        <span className="font-medium">{formatDate(inv.createdAt).split(',')[0]}</span>
                        <span className="text-xs text-gray-500">{formatDate(inv.createdAt).split(',')[1]}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {inv.entry?.provider?.name || inv.provider?.name || 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {inv.location?.warehouse?.name || 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {inv.location?.name || 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {inv.quantity}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 hidden md:table-cell">
                      <div className="max-w-xs truncate" title={inv.trackingNumbers || 'N/A'}>
                        {inv.trackingNumbers || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        inv.status === 'stored'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {inv.status === 'stored' ? 'Almacenado' : 'En Tránsito'}
                      </span>
                    </td>
                    <td 
                      className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
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
              if (filters.startDate) params.append('startDate', filters.startDate);
              if (filters.endDate) params.append('endDate', filters.endDate);
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

      {/* Detail Modal */}
      {showDetailModal && selectedInventory && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              aria-hidden="true"
              onClick={() => setShowDetailModal(false)}
            ></div>

            {/* Center modal */}
            <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
              <div className="absolute top-0 right-0 pt-4 pr-4 z-10">
                <button
                  type="button"
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => setShowDetailModal(false)}
                >
                  <span className="sr-only">Cerrar</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="w-full">
                <div className="mt-3 text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                    Detalle de Devolución
                  </h3>
                  
                  <div className="mt-4 border-t border-gray-200">
                    <dl className="divide-y divide-gray-200">
                      <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500">Fecha de Devolución</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 font-medium">
                          {formatDate(selectedInventory.createdAt)}
                        </dd>
                      </div>
                      <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500">Proveedor</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                          {selectedInventory.entry?.provider?.name || selectedInventory.provider?.name || 'N/A'}
                        </dd>
                      </div>
                      <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500">Almacén</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                          {selectedInventory.location?.warehouse?.name || 'N/A'}
                        </dd>
                      </div>
                      <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500">Ubicación</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                          {selectedInventory.location?.name || 'N/A'}
                        </dd>
                      </div>
                      <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500">Cantidad</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                          {selectedInventory.quantity} paquetes
                        </dd>
                      </div>
                      <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500">Estado</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            selectedInventory.status === 'stored'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {selectedInventory.status === 'stored' ? 'Almacenado' : 'En Tránsito'}
                          </span>
                        </dd>
                      </div>
                      <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500">Tracking Numbers</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                          {selectedInventory.trackingNumbers ? (
                            <div className="max-h-60 overflow-y-auto space-y-1">
                              {selectedInventory.trackingNumbers.split(',').map((tn, idx) => (
                                <div key={idx} className="bg-gray-50 px-3 py-2 rounded font-mono text-xs">
                                  {tn.trim()}
                                </div>
                              ))}
                            </div>
                          ) : (
                            'N/A'
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {(session?.user?.role === 'admin') && (
                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                        onClick={() => setShowDetailModal(false)}
                      >
                        Cerrar
                      </button>
                      <a
                        href={`/stocks/inventory/${selectedInventory.id}/edit`}
                        className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                      >
                        Editar
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}