'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import SearchableLocationSelect from '@/app/components/SearchableLocationSelect';
import { Package, CheckCircle, ArrowDownCircle, ArrowUpCircle, FileSpreadsheet, Eye, X } from 'lucide-react';

interface Warehouse {
  id: string;
  name: string;
}

interface Location {
  id: string;
  name: string;
  warehouse: { name: string };
}

interface Etiqueta {
  id: string;
  trackingNumber: string;
  estado: string;
  escaneadoAt: string;
  egresadoAt?: string;
}

interface Movimiento {
  id: string;
  tipo: string;
  subtipoIngreso?: string;
  subtipoEgreso?: string;
  warehouse: Warehouse;
  location: Location;
  cantidad: number;
  cantidadEgresada: number;
  estado: string;
  notas?: string;
  creadoPor: {
    id: string;
    name: string;
    email: string;
  };
  etiquetas: Etiqueta[];
  movimientoOrigen?: any;
  movimientosEgreso?: any[];
  createdAt: string;
  updatedAt: string;
}

const SUBTIPOS_INGRESO = [
  { value: 'RETORNOS', label: 'Retornos' },
  { value: 'PENDIENTE_RETIRO', label: 'Pendiente de Retiro' },
  { value: 'PICKUP', label: 'Pickup' },
  { value: 'INSUMOS_WH', label: 'Insumos WH' }
];

const SUBTIPOS_EGRESO = [
  { value: 'ENTREGA_PARCIAL', label: 'Entrega Parcial' },
  { value: 'ENTREGA_TOTAL', label: 'Entrega Total' }
];

export default function ReexpedicionTab() {
  const [activeTab, setActiveTab] = useState<'ingreso' | 'egreso' | 'historial'>('ingreso');
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [movimientosDisponibles, setMovimientosDisponibles] = useState<Movimiento[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();

  // Estados para el formulario de ingreso
  const [formIngreso, setFormIngreso] = useState({
    warehouseId: '',
    locationId: '',
    subtipoIngreso: '',
    notas: ''
  });
  const [scannedCodes, setScannedCodes] = useState<string[]>([]);
  const [currentBarcode, setCurrentBarcode] = useState('');
  const [showBarcodeFlash, setShowBarcodeFlash] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState('');
  const trackingInputRef = useRef<HTMLInputElement>(null);

  // Estados para el formulario de egreso
  const [formEgreso, setFormEgreso] = useState({
    movimientoOrigenId: '',
    warehouseId: '',
    locationId: '',
    subtipoEgreso: '',
    notas: ''
  });
  const [etiquetasSeleccionadas, setEtiquetasSeleccionadas] = useState<string[]>([]);
  const [movimientoSeleccionado, setMovimientoSeleccionado] = useState<Movimiento | null>(null);
  const [currentBarcodeEgreso, setCurrentBarcodeEgreso] = useState('');
  const [showBarcodeFlashEgreso, setShowBarcodeFlashEgreso] = useState(false);
  const [lastScannedCodeEgreso, setLastScannedCodeEgreso] = useState('');
  const trackingEgresoInputRef = useRef<HTMLInputElement>(null);

  // Estados para el historial
  const [filters, setFilters] = useState({
    tipo: '',
    subtipoIngreso: '',
    subtipoEgreso: '',
    warehouseId: '',
    locationId: '',
    estado: '',
    trackingNumber: '',
    startDate: '',
    endDate: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(25);

  // Estado para modal de detalle
  const [selectedMovimiento, setSelectedMovimiento] = useState<Movimiento | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Estados para modal de advertencia de ubicación ocupada
  const [showLocationWarning, setShowLocationWarning] = useState(false);
  const [locationContents, setLocationContents] = useState<any>(null);
  const [pendingFormData, setPendingFormData] = useState<any>(null);

  useEffect(() => {
    fetchWarehouses();
    fetchLocations();
    if (activeTab === 'historial') {
      fetchMovimientos();
    }
    if (activeTab === 'egreso') {
      fetchMovimientosDisponibles();
    }
  }, [activeTab, filters, currentPage]);

  useEffect(() => {
    fetchLocations(formIngreso.warehouseId);
  }, [formIngreso.warehouseId]);

  useEffect(() => {
    fetchLocations(formEgreso.warehouseId);
  }, [formEgreso.warehouseId]);

  const fetchWarehouses = async () => {
    try {
      const res = await fetch('/api/warehouses');
      if (!res.ok) throw new Error('Error al cargar almacenes');
      const data = await res.json();
      setWarehouses(data.map((w: any) => ({ id: w.id, name: w.name })));
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const fetchLocations = async (warehouseId?: string) => {
    try {
      const params = new URLSearchParams();
      if (warehouseId) params.append('warehouseId', warehouseId);
      params.append('limit', '1000');
      const res = await fetch(`/api/locations?${params}`);
      if (!res.ok) throw new Error('Error al cargar ubicaciones');
      const data = await res.json();
      setLocations(Array.isArray(data.locations) ? data.locations : []);
    } catch (error) {
      console.error('Error fetching locations:', error);
      setLocations([]);
    }
  };

  const fetchMovimientos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString()
      });
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const res = await fetch(`/api/reexpedicion?${params}`);
      if (!res.ok) throw new Error('Error al cargar movimientos');
      const data = await res.json();
      setMovimientos(data.movimientos || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching movimientos:', error);
      setMovimientos([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMovimientosDisponibles = async () => {
    try {
      const params = new URLSearchParams();
      if (formEgreso.warehouseId) params.append('warehouseId', formEgreso.warehouseId);
      
      const res = await fetch(`/api/reexpedicion/disponibles?${params}`);
      if (!res.ok) throw new Error('Error al cargar movimientos disponibles');
      const data = await res.json();
      setMovimientosDisponibles(data || []);
    } catch (error) {
      console.error('Error fetching disponibles:', error);
      setMovimientosDisponibles([]);
    }
  };

  // Manejo de escaneo para ingreso
  const handleBarcodeScan = (barcode: string) => {
    const cleanBarcode = barcode.trim();
    if (!cleanBarcode) return;

    if (scannedCodes.includes(cleanBarcode)) {
      alert(`❌ ETIQUETA DUPLICADA\n\nEl tracking "${cleanBarcode}" ya fue escaneado.`);
      setCurrentBarcode('');
      setTimeout(() => trackingInputRef.current?.focus(), 100);
      return;
    }

    const newCodes = [...scannedCodes, cleanBarcode];
    setScannedCodes(newCodes);
    setLastScannedCode(cleanBarcode);
    setShowBarcodeFlash(true);
    setCurrentBarcode('');
    setTimeout(() => trackingInputRef.current?.focus(), 100);
  };

  const handleBarcodeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.includes('\n') || value.includes('\r')) {
      e.preventDefault();
      const cleanValue = value.replace(/[\n\r]/g, '').trim();
      if (cleanValue) handleBarcodeScan(cleanValue);
      return;
    }
    setCurrentBarcode(value);
  };

  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (currentBarcode.trim()) handleBarcodeScan(currentBarcode.trim());
    }
  };

  const removeScannedCode = (index: number) => {
    setScannedCodes(scannedCodes.filter((_, i) => i !== index));
  };

  // Auto-cerrar flash
  useEffect(() => {
    if (showBarcodeFlash) {
      const timer = setTimeout(() => setShowBarcodeFlash(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showBarcodeFlash]);

  // Auto-cerrar flash de egreso
  useEffect(() => {
    if (showBarcodeFlashEgreso) {
      const timer = setTimeout(() => setShowBarcodeFlashEgreso(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showBarcodeFlashEgreso]);

  // Verificar si la ubicación tiene contenido
  const checkLocationContents = async (locationId: string) => {
    try {
      const res = await fetch(`/api/locations/${locationId}/check-contents`);
      if (!res.ok) throw new Error('Error al verificar ubicación');
      const data = await res.json();
      return data;
    } catch (error) {
      console.error('Error checking location:', error);
      return { hasContents: false, details: null };
    }
  };

  // Enviar ingreso con verificación de ubicación
  const handleSubmitIngreso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (scannedCodes.length === 0) {
      alert('Debe escanear al menos una etiqueta');
      return;
    }

    // Verificar si la ubicación tiene contenido
    const contents = await checkLocationContents(formIngreso.locationId);
    if (contents.hasContents) {
      // Mostrar modal de advertencia
      setLocationContents(contents);
      setPendingFormData({ ...formIngreso, scannedCodes: [...scannedCodes] });
      setShowLocationWarning(true);
      return;
    }

    // Si no hay contenido, proceder directamente
    await submitIngreso();
  };

  // Función para enviar el ingreso
  const submitIngreso = async () => {
    try {
      const dataToSend = pendingFormData || { ...formIngreso, scannedCodes };
      const res = await fetch('/api/reexpedicion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'INGRESO',
          warehouseId: dataToSend.warehouseId,
          locationId: dataToSend.locationId,
          subtipoIngreso: dataToSend.subtipoIngreso,
          notas: dataToSend.notas,
          trackingNumbers: dataToSend.scannedCodes || scannedCodes
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al crear ingreso');
      }

      alert('✅ Ingreso registrado exitosamente');
      setFormIngreso({ warehouseId: '', locationId: '', subtipoIngreso: '', notas: '' });
      setScannedCodes([]);
      setCurrentBarcode('');
      setShowLocationWarning(false);
      setPendingFormData(null);
      setLocationContents(null);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  // Manejar selección de movimiento origen para egreso
  const handleSelectMovimientoOrigen = (movimientoId: string) => {
    const movimiento = movimientosDisponibles.find(m => m.id === movimientoId);
    setMovimientoSeleccionado(movimiento || null);
    setFormEgreso({ ...formEgreso, movimientoOrigenId: movimientoId });
    setEtiquetasSeleccionadas([]);
  };

  // Manejo de escaneo para egreso
  const handleBarcodeEgresoScan = (barcode: string) => {
    const cleanBarcode = barcode.trim();
    if (!cleanBarcode || !movimientoSeleccionado) return;

    // Buscar la etiqueta por tracking number
    const etiqueta = movimientoSeleccionado.etiquetas.find(
      e => e.trackingNumber.toLowerCase() === cleanBarcode.toLowerCase()
    );

    if (etiqueta) {
      // Si ya está seleccionada, no hacer nada
      if (etiquetasSeleccionadas.includes(etiqueta.id)) {
        alert(`⚠️ La etiqueta "${cleanBarcode}" ya está seleccionada`);
      } else {
        // Agregar a seleccionadas
        setEtiquetasSeleccionadas(prev => [...prev, etiqueta.id]);
        setLastScannedCodeEgreso(cleanBarcode);
        setShowBarcodeFlashEgreso(true);
      }
    } else {
      alert(`❌ ETIQUETA NO ENCONTRADA\n\nEl código "${cleanBarcode}" no existe en este movimiento.`);
    }

    setCurrentBarcodeEgreso('');
    setTimeout(() => trackingEgresoInputRef.current?.focus(), 100);
  };

  const handleBarcodeEgresoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.includes('\n') || value.includes('\r')) {
      e.preventDefault();
      const cleanValue = value.replace(/[\n\r]/g, '').trim();
      if (cleanValue) handleBarcodeEgresoScan(cleanValue);
      return;
    }
    setCurrentBarcodeEgreso(value);
  };

  const handleBarcodeEgresoKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (currentBarcodeEgreso.trim()) handleBarcodeEgresoScan(currentBarcodeEgreso.trim());
    }
  };

  // Toggle selección de etiqueta para egreso
  const toggleEtiqueta = (etiquetaId: string) => {
    setEtiquetasSeleccionadas(prev =>
      prev.includes(etiquetaId)
        ? prev.filter(id => id !== etiquetaId)
        : [...prev, etiquetaId]
    );
  };

  // Seleccionar todas las etiquetas
  const selectAllEtiquetas = () => {
    if (!movimientoSeleccionado) return;
    setEtiquetasSeleccionadas(movimientoSeleccionado.etiquetas.map(e => e.id));
  };

  // Enviar egreso
  const handleSubmitEgreso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (etiquetasSeleccionadas.length === 0) {
      alert('Debe seleccionar al menos una etiqueta');
      return;
    }

    try {
      const res = await fetch('/api/reexpedicion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'EGRESO',
          ...formEgreso,
          etiquetasSeleccionadas
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al crear egreso');
      }

      alert('✅ Egreso registrado exitosamente');
      setFormEgreso({ movimientoOrigenId: '', warehouseId: '', locationId: '', subtipoEgreso: '', notas: '' });
      setEtiquetasSeleccionadas([]);
      setMovimientoSeleccionado(null);
      fetchMovimientosDisponibles();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este movimiento?')) return;

    try {
      const res = await fetch(`/api/reexpedicion/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al eliminar');
      }
      alert('✅ Movimiento eliminado');
      fetchMovimientos();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      ACTIVO: { bg: 'bg-green-100', text: 'text-green-800', label: 'Activo' },
      EGRESADO_PARCIAL: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Egresado Parcial' },
      EGRESADO_TOTAL: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Egresado Total' }
    };
    const badge = badges[estado] || badges.ACTIVO;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div>
      {/* Flash de código escaneado - Ingreso */}
      {showBarcodeFlash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 animate-pulse">
          <div className="text-center px-8">
            <CheckCircle className="h-32 w-32 text-green-400 mx-auto animate-bounce mb-8" />
            <p className="text-2xl font-medium text-white mb-4">Código Escaneado</p>
            <p className="text-6xl font-mono font-bold text-white mb-8 tracking-wider">{lastScannedCode}</p>
            <p className="text-3xl font-semibold text-white">Etiqueta #{scannedCodes.length}</p>
            <p className="text-lg text-gray-300 mt-4">Escanea la siguiente o presiona ESC</p>
          </div>
        </div>
      )}

      {/* Flash de código escaneado - Egreso */}
      {showBarcodeFlashEgreso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 animate-pulse">
          <div className="text-center px-8">
            <CheckCircle className="h-32 w-32 text-purple-400 mx-auto animate-bounce mb-8" />
            <p className="text-2xl font-medium text-white mb-4">Etiqueta Seleccionada</p>
            <p className="text-6xl font-mono font-bold text-white mb-8 tracking-wider">{lastScannedCodeEgreso}</p>
            <p className="text-3xl font-semibold text-white">Total: {etiquetasSeleccionadas.length}</p>
            <p className="text-lg text-gray-300 mt-4">Escanea la siguiente o presiona ESC</p>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900">Reexpedición</h2>
        <p className="mt-2 text-sm text-gray-700">Gestiona ingresos y egresos de mercadería</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('ingreso')}
              className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'ingreso'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ArrowDownCircle className="h-5 w-5 mr-2" />
              Ingreso
            </button>
            <button
              onClick={() => setActiveTab('egreso')}
              className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'egreso'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ArrowUpCircle className="h-5 w-5 mr-2" />
              Egreso
            </button>
            <button
              onClick={() => setActiveTab('historial')}
              className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'historial'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileSpreadsheet className="h-5 w-5 mr-2" />
              Historial
            </button>
          </nav>
        </div>
      </div>

      {/* Contenido según tab activo */}
      {activeTab === 'ingreso' && (
        <div className="bg-white shadow sm:rounded-lg border border-gray-200">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Registrar Ingreso</h3>
            <form onSubmit={handleSubmitIngreso}>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo de Ingreso *</label>
                  <select
                    value={formIngreso.subtipoIngreso}
                    onChange={(e) => setFormIngreso({ ...formIngreso, subtipoIngreso: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  >
                    <option value="">Seleccionar tipo</option>
                    {SUBTIPOS_INGRESO.map(st => (
                      <option key={st.value} value={st.value}>{st.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Almacén *</label>
                  <select
                    value={formIngreso.warehouseId}
                    onChange={(e) => setFormIngreso({ ...formIngreso, warehouseId: e.target.value, locationId: '' })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  >
                    <option value="">Seleccionar almacén</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ubicación *</label>
                  <SearchableLocationSelect
                    id="locationIngreso"
                    locations={locations}
                    value={formIngreso.locationId}
                    onChange={(value) => setFormIngreso({ ...formIngreso, locationId: value })}
                    placeholder="Seleccionar ubicación..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notas</label>
                  <input
                    type="text"
                    value={formIngreso.notas}
                    onChange={(e) => setFormIngreso({ ...formIngreso, notas: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Observaciones (opcional)"
                  />
                </div>
              </div>

              {/* Escaneo de etiquetas */}
              <div className="mt-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 border-2 border-indigo-200">
                <div className="flex items-center mb-4">
                  <Package className="h-6 w-6 text-indigo-600 mr-2" />
                  <h4 className="text-lg font-medium text-gray-900">Escaneo de Etiquetas</h4>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tracking Number (Escanea o ingresa manualmente)
                  </label>
                  <input
                    ref={trackingInputRef}
                    type="text"
                    value={currentBarcode}
                    onChange={handleBarcodeInputChange}
                    onKeyDown={handleBarcodeKeyDown}
                    placeholder="Escanea el código de barras aquí..."
                    className="w-full px-4 py-3 text-2xl border-2 border-indigo-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                    autoFocus
                  />
                </div>

                <div className="bg-white rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Etiquetas escaneadas:</span>
                    <span className="text-2xl font-bold text-indigo-600">{scannedCodes.length}</span>
                  </div>
                </div>

                {scannedCodes.length > 0 && (
                  <div className="bg-white rounded-lg p-4 max-h-60 overflow-y-auto">
                    <div className="space-y-2">
                      {scannedCodes.map((code, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                          <span className="font-mono text-sm">{code}</span>
                          <button
                            type="button"
                            onClick={() => removeScannedCode(index)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setFormIngreso({ warehouseId: '', locationId: '', subtipoIngreso: '', notas: '' });
                    setScannedCodes([]);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Limpiar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Registrar Ingreso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'egreso' && (
        <div className="space-y-6">
          <div className="bg-white shadow sm:rounded-lg border border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Registrar Egreso</h3>
              <form onSubmit={handleSubmitEgreso}>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo de Egreso *</label>
                    <select
                      value={formEgreso.subtipoEgreso}
                      onChange={(e) => setFormEgreso({ ...formEgreso, subtipoEgreso: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    >
                      <option value="">Seleccionar tipo</option>
                      {SUBTIPOS_EGRESO.map(st => (
                        <option key={st.value} value={st.value}>{st.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Almacén Destino *</label>
                    <select
                      value={formEgreso.warehouseId}
                      onChange={(e) => {
                        setFormEgreso({ ...formEgreso, warehouseId: e.target.value, locationId: '' });
                        fetchMovimientosDisponibles();
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    >
                      <option value="">Seleccionar almacén</option>
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ubicación Destino *</label>
                    <SearchableLocationSelect
                      id="locationEgreso"
                      locations={locations}
                      value={formEgreso.locationId}
                      onChange={(value) => setFormEgreso({ ...formEgreso, locationId: value })}
                      placeholder="Seleccionar ubicación..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notas</label>
                    <input
                      type="text"
                      value={formEgreso.notas}
                      onChange={(e) => setFormEgreso({ ...formEgreso, notas: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Observaciones (opcional)"
                    />
                  </div>
                </div>

                {/* Selección de movimiento origen */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Movimiento de Ingreso *</label>
                  <select
                    value={formEgreso.movimientoOrigenId}
                    onChange={(e) => handleSelectMovimientoOrigen(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  >
                    <option value="">Seleccionar movimiento...</option>
                    {movimientosDisponibles.map(m => (
                      <option key={m.id} value={m.id}>
                        {SUBTIPOS_INGRESO.find(s => s.value === m.subtipoIngreso)?.label} - {m.warehouse.name} / {m.location.name} - {m.etiquetas.length} etiquetas disponibles
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selección de etiquetas */}
                {movimientoSeleccionado && (
                  <div className="mt-6 bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-gray-900">
                        Seleccionar Etiquetas ({etiquetasSeleccionadas.length} de {movimientoSeleccionado.etiquetas.length})
                      </h4>
                      <button
                        type="button"
                        onClick={selectAllEtiquetas}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Seleccionar todas
                      </button>
                    </div>
                    
                    {/* Campo de escaneo para seleccionar etiquetas */}
                    <div className="mb-4 bg-white rounded-lg p-4 border-2 border-purple-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        🔍 Escanear código para seleccionar
                      </label>
                      <input
                        ref={trackingEgresoInputRef}
                        type="text"
                        value={currentBarcodeEgreso}
                        onChange={handleBarcodeEgresoInputChange}
                        onKeyDown={handleBarcodeEgresoKeyDown}
                        placeholder="Escanea un código de barras..."
                        className="w-full px-4 py-2 text-xl border-2 border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                      />
                      <p className="text-xs text-gray-600 mt-2">
                        Al escanear, se seleccionará automáticamente la etiqueta correspondiente
                      </p>
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {movimientoSeleccionado.etiquetas.map(etiqueta => (
                        <div
                          key={etiqueta.id}
                          onClick={() => toggleEtiqueta(etiqueta.id)}
                          className={`flex items-center justify-between p-3 rounded cursor-pointer transition-colors ${
                            etiquetasSeleccionadas.includes(etiqueta.id)
                              ? 'bg-indigo-100 border-2 border-indigo-500'
                              : 'bg-white border-2 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={etiquetasSeleccionadas.includes(etiqueta.id)}
                              onChange={() => toggleEtiqueta(etiqueta.id)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <span className="ml-3 font-mono text-sm">{etiqueta.trackingNumber}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(etiqueta.escaneadoAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFormEgreso({ movimientoOrigenId: '', warehouseId: '', locationId: '', subtipoEgreso: '', notas: '' });
                      setEtiquetasSeleccionadas([]);
                      setMovimientoSeleccionado(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Limpiar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Registrar Egreso
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'historial' && (
        <div className="space-y-6">
          {/* Filtros */}
          <div className="bg-white shadow sm:rounded-lg border border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo</label>
                  <select
                    value={filters.tipo}
                    onChange={(e) => setFilters({ ...filters, tipo: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">Todos</option>
                    <option value="INGRESO">Ingreso</option>
                    <option value="EGRESO">Egreso</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Almacén</label>
                  <select
                    value={filters.warehouseId}
                    onChange={(e) => setFilters({ ...filters, warehouseId: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">Todos</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <select
                    value={filters.estado}
                    onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">Todos</option>
                    <option value="ACTIVO">Activo</option>
                    <option value="EGRESADO_PARCIAL">Egresado Parcial</option>
                    <option value="EGRESADO_TOTAL">Egresado Total</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Código</label>
                  <input
                    type="text"
                    value={filters.trackingNumber}
                    onChange={(e) => setFilters({ ...filters, trackingNumber: e.target.value })}
                    placeholder="Buscar..."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setFilters({
                    tipo: '', subtipoIngreso: '', subtipoEgreso: '', warehouseId: '',
                    locationId: '', estado: '', trackingNumber: '', startDate: '', endDate: ''
                  })}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>
          </div>

          {/* Tabla de movimientos */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Subtipo</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Almacén</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">Ubicación</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cant.</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Códigos</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Notas</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Estado</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : movimientos.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center text-sm text-gray-500">
                        No hay movimientos registrados
                      </td>
                    </tr>
                  ) : (
                    movimientos.map((mov) => (
                      <tr
                        key={mov.id}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex flex-col">
                            <span className="font-medium">{formatDate(mov.createdAt).split(',')[0]}</span>
                            <span className="text-xs text-gray-500">{formatDate(mov.createdAt).split(',')[1]}</span>
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            mov.tipo === 'INGRESO' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {mov.tipo === 'INGRESO' ? '↓' : '↑'}
                            <span className="ml-1 hidden sm:inline">{mov.tipo === 'INGRESO' ? 'Ing' : 'Egr'}</span>
                          </span>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
                          {mov.subtipoIngreso
                            ? SUBTIPOS_INGRESO.find(s => s.value === mov.subtipoIngreso)?.label
                            : SUBTIPOS_EGRESO.find(s => s.value === mov.subtipoEgreso)?.label}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                          {mov.warehouse.name}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 hidden xl:table-cell">
                          {mov.location.name}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {mov.cantidad}
                          {mov.cantidadEgresada > 0 && (
                            <span className="text-xs text-gray-500 block">
                              (-{mov.cantidadEgresada})
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500">
                          <div className="max-w-xs">
                            {mov.etiquetas.length > 0 ? (
                              <div className="space-y-1">
                                <div className="font-mono text-xs bg-gray-50 px-2 py-1 rounded truncate">
                                  {mov.etiquetas[0].trackingNumber}
                                </div>
                                {mov.etiquetas.length > 1 && (
                                  <div className="text-xs text-gray-400">
                                    +{mov.etiquetas.length - 1} más
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">Sin códigos</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500 max-w-xs hidden sm:table-cell">
                          {mov.notas ? (
                            <div className="truncate" title={mov.notas}>
                              {mov.notas}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap hidden lg:table-cell">
                          {getEstadoBadge(mov.estado)}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedMovimiento(mov);
                                setShowDetailModal(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-900 p-1"
                              title="Ver detalle"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {session?.user?.role === 'admin' && (
                              <button
                                onClick={() => handleDelete(mov.id)}
                                className="text-red-600 hover:text-red-900 p-1"
                                title="Eliminar"
                              >
                                <X className="h-4 w-4" />
                              </button>
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

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando {movimientos.length > 0 ? ((currentPage - 1) * limit) + 1 : 0} a {Math.min(currentPage * limit, total)} de {total} resultados
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Anterior
                </button>
                <span className="px-3 py-2 text-sm text-gray-700">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de detalle */}
      {showDetailModal && selectedMovimiento && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowDetailModal(false)}></div>
            <div className="relative bg-white rounded-lg max-w-3xl w-full p-6">
              <button
                onClick={() => setShowDetailModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>

              <h3 className="text-lg font-medium text-gray-900 mb-4">Detalle del Movimiento</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tipo</p>
                    <p className="mt-1 text-sm text-gray-900">{selectedMovimiento.tipo}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Subtipo</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedMovimiento.subtipoIngreso
                        ? SUBTIPOS_INGRESO.find(s => s.value === selectedMovimiento.subtipoIngreso)?.label
                        : SUBTIPOS_EGRESO.find(s => s.value === selectedMovimiento.subtipoEgreso)?.label}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Almacén</p>
                    <p className="mt-1 text-sm text-gray-900">{selectedMovimiento.warehouse.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Ubicación</p>
                    <p className="mt-1 text-sm text-gray-900">{selectedMovimiento.location.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Cantidad</p>
                    <p className="mt-1 text-sm text-gray-900">{selectedMovimiento.cantidad}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Estado</p>
                    <p className="mt-1">{getEstadoBadge(selectedMovimiento.estado)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Creado por</p>
                    <p className="mt-1 text-sm text-gray-900">{selectedMovimiento.creadoPor.name || selectedMovimiento.creadoPor.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Fecha</p>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedMovimiento.createdAt)}</p>
                  </div>
                </div>

                {selectedMovimiento.notas && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Notas</p>
                    <p className="mt-1 text-sm text-gray-900">{selectedMovimiento.notas}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Etiquetas ({selectedMovimiento.etiquetas.length})</p>
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {selectedMovimiento.etiquetas.map((etiqueta) => (
                      <div key={etiqueta.id} className="bg-gray-50 px-3 py-2 rounded flex items-center justify-between">
                        <span className="font-mono text-xs">{etiqueta.trackingNumber}</span>
                        {getEstadoBadge(etiqueta.estado)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de advertencia de ubicación ocupada */}
      {showLocationWarning && locationContents && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75"></div>
            <div className="relative bg-white rounded-lg max-w-lg w-full p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="ml-4 text-lg font-medium text-gray-900">Ubicación Ocupada</h3>
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-700 mb-4">
                  La ubicación seleccionada ya contiene elementos:
                </p>
                <div className="bg-gray-50 rounded-md p-4 space-y-2">
                  {locationContents.details.inventoryCount > 0 && (
                    <p className="text-sm text-gray-600">
                      📦 <strong>{locationContents.details.inventoryCount}</strong> registro(s) de devoluciones
                    </p>
                  )}
                  {locationContents.details.packagesCount > 0 && (
                    <p className="text-sm text-gray-600">
                      📋 <strong>{locationContents.details.packagesCount}</strong> paquete(s)
                    </p>
                  )}
                  {locationContents.details.reexpedicionCount > 0 && (
                    <p className="text-sm text-gray-600">
                      🔄 <strong>{locationContents.details.reexpedicionCount}</strong> movimiento(s) de reexpedición
                    </p>
                  )}
                  <p className="text-sm font-medium text-gray-900 pt-2 border-t border-gray-200">
                    Total: {locationContents.details.totalItems} elemento(s)
                  </p>
                </div>
                <p className="text-sm text-gray-700 mt-4">
                  ¿Desea continuar con el ingreso en esta ubicación o cambiar a otra?
                </p>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowLocationWarning(false);
                    setPendingFormData(null);
                    setLocationContents(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cambiar Ubicación
                </button>
                <button
                  onClick={submitIngreso}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Continuar de Todos Modos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
