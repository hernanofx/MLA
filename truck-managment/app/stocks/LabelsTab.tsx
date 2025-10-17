'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Barcode from 'react-barcode';
import { FileSpreadsheet, Printer, Calendar } from 'lucide-react';

interface Label {
  id: string;
  barcode: string;
  providerName: string;
  issueDate: string;
  description: string | null;
  createdAt: string;
}

interface CountByProvider {
  providerName: string;
  count: number;
}

export default function LabelsTab() {
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    providerName: '',
    description: '',
  });
  const [filters, setFilters] = useState({
    providerName: '',
    startDate: '',
    endDate: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [countsByProvider, setCountsByProvider] = useState<CountByProvider[]>([]);
  const [limit] = useState(25);
  const [printLabel, setPrintLabel] = useState<Label | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

  useEffect(() => {
    fetchLabels(1);
    setCurrentPage(1);
  }, [filters.providerName, filters.startDate, filters.endDate]);

  const fetchLabels = async (page: number = 1) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      if (filters.providerName) params.append('providerName', filters.providerName);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      const res = await fetch(`/api/labels?${params}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setLabels(data.labels || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
      setCountsByProvider(data.countsByProvider || []);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to fetch labels:', error);
      setLabels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setFormData({ providerName: '', description: '' });
        setShowForm(false);
        fetchLabels(currentPage);
      } else {
        const error = await res.json();
        alert(error.error || 'Error al crear etiqueta');
      }
    } catch (error) {
      console.error('Failed to create label:', error);
      alert('Error al crear etiqueta');
    }
  };

  const handlePrint = (label: Label) => {
    setPrintLabel(label);
    setTimeout(() => {
      if (printRef.current) {
        const printContent = printRef.current.innerHTML;
        const originalContent = document.body.innerHTML;
        document.body.innerHTML = printContent;
        window.print();
        document.body.innerHTML = originalContent;
        window.location.reload();
      }
    }, 100);
  };

  if (loading) return <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  </div>;

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Etiquetas</h2>
          <p className="mt-2 text-sm text-gray-700">Genera y gestiona etiquetas con códigos de barras</p>
        </div>
        <div className="mt-4 sm:mt-0">
          {session?.user?.role === 'admin' && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 h-10"
            >
              {showForm ? 'Cancelar' : 'Nueva Etiqueta'}
            </button>
          )}
        </div>
      </div>

      {/* Contador por proveedor */}
      {countsByProvider.length > 0 && (
        <div className="mb-8 bg-white shadow sm:rounded-lg border border-gray-200">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contador de Etiquetas por Proveedor</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {countsByProvider.map((item) => (
                <div key={item.providerName} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                  <div className="text-sm font-medium text-gray-600">{item.providerName}</div>
                  <div className="mt-2 text-3xl font-bold text-indigo-600">{item.count}</div>
                  <div className="mt-1 text-xs text-gray-500">etiquetas generadas</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-8 bg-white shadow sm:rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <label htmlFor="filterProvider" className="block text-sm font-medium text-gray-700">
                Proveedor
              </label>
              <select
                id="filterProvider"
                value={filters.providerName}
                onChange={(e) => setFilters({ ...filters, providerName: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Todos los proveedores</option>
                <option value="Urbano">Urbano</option>
                <option value="Ocasa">Ocasa</option>
              </select>
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
        </div>
      </div>

      {showForm && (
        <div className="mb-8 bg-white shadow sm:rounded-lg border border-gray-200">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Crear Nueva Etiqueta</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="providerName" className="block text-sm font-medium text-gray-700">
                    Proveedor *
                  </label>
                  <select
                    id="providerName"
                    value={formData.providerName}
                    onChange={(e) => setFormData({ ...formData, providerName: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  >
                    <option value="">Seleccionar Proveedor</option>
                    <option value="Urbano">Urbano</option>
                    <option value="Ocasa">Ocasa</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Descripción
                  </label>
                  <input
                    type="text"
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción opcional"
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
                  Generar Etiqueta
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
                  Código de Barras
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proveedor
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha de Emisión
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {labels.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No hay etiquetas generadas
                  </td>
                </tr>
              ) : (
                labels.map((label) => (
                  <tr key={label.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Barcode value={label.barcode} width={1} height={30} displayValue={false} />
                        <span className="ml-2 text-sm font-mono text-gray-900">{label.barcode}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {label.providerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                        {new Date(label.issueDate).toLocaleDateString('es-ES')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {label.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handlePrint(label)}
                        className="inline-flex items-center text-indigo-600 hover:text-indigo-900"
                      >
                        <Printer className="h-4 w-4 mr-1" />
                        Imprimir
                      </button>
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
            Mostrando {labels.length > 0 ? ((currentPage - 1) * limit) + 1 : 0} a {Math.min(currentPage * limit, total)} de {total} resultados
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              const params = new URLSearchParams();
              if (filters.providerName) params.append('providerName', filters.providerName);
              if (filters.startDate) params.append('startDate', filters.startDate);
              if (filters.endDate) params.append('endDate', filters.endDate);
              const url = `/api/labels/export?${params}`
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
                onClick={() => fetchLabels(currentPage - 1)}
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
                      onClick={() => fetchLabels(pageNum)}
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
                onClick={() => fetchLabels(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Print Template (hidden) */}
      {printLabel && (
        <div ref={printRef} style={{ display: 'none' }}>
          <div style={{ 
            padding: '40px', 
            fontFamily: 'Arial, sans-serif',
            maxWidth: '400px',
            margin: '0 auto'
          }}>
            <div style={{ 
              textAlign: 'center', 
              border: '2px solid #000',
              padding: '30px',
              borderRadius: '8px'
            }}>
              <h1 style={{ 
                fontSize: '28px', 
                marginBottom: '20px',
                fontWeight: 'bold'
              }}>
                {printLabel.providerName}
              </h1>
              
              <div style={{ marginBottom: '30px' }}>
                <Barcode 
                  value={printLabel.barcode} 
                  width={2} 
                  height={80}
                  fontSize={16}
                  margin={10}
                />
              </div>
              
              <div style={{ 
                textAlign: 'left', 
                marginTop: '20px',
                fontSize: '14px',
                lineHeight: '1.8'
              }}>
                <p><strong>Fecha de Emisión:</strong> {new Date(printLabel.issueDate).toLocaleDateString('es-ES')}</p>
                {printLabel.description && (
                  <p><strong>Descripción:</strong> {printLabel.description}</p>
                )}
                <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                  Código: {printLabel.barcode}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
