'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import AppLayout from '@/app/components/AppLayout'
import { 
  ArrowLeft, 
  Package, 
  Search,
  Filter,
  Plus,
  Eye,
  FileText,
  Calendar
} from 'lucide-react'
import { 
  formatArgentinaDate, 
  formatArgentinaTime, 
  formatArgentinaDateLong,
  toDateString
} from '@/lib/date-utils'

interface Shipment {
  id: string
  shipmentDate: string
  status: 'PRE_ALERTA' | 'PRE_RUTEO' | 'VERIFICACION' | 'FINALIZADO'
  createdAt: string
  _count?: {
    preAlertas: number
    preRuteos: number
    scannedPackages: number
  }
}

interface ProviderInfo {
  id: string
  name: string
}

export default function ShipmentsListPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [filteredShipments, setFilteredShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Shipment['status']>('all')
  const [dateFilter, setDateFilter] = useState('')
  const [providerInfo, setProviderInfo] = useState<ProviderInfo | null>(null)

  useEffect(() => {
    fetchShipments()
    fetchProviderInfo()
  }, [])

  useEffect(() => {
    filterShipments()
  }, [shipments, searchTerm, statusFilter, dateFilter])

  const fetchProviderInfo = async () => {
    if (session?.user?.providerId) {
      try {
        const response = await fetch(`/api/providers/${session.user.providerId}`)
        if (response.ok) {
          const data = await response.json()
          setProviderInfo(data)
        }
      } catch (error) {
        console.error('Error fetching provider info:', error)
      }
    }
  }

  const fetchShipments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/vms/shipments')
      if (response.ok) {
        const data = await response.json()
        setShipments(data.shipments || [])
      }
    } catch (error) {
      console.error('Error fetching shipments:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterShipments = () => {
    let filtered = shipments

    // Filter by search term (by date)
    if (searchTerm) {
      filtered = filtered.filter(shipment =>
        formatArgentinaDate(shipment.shipmentDate).includes(searchTerm)
      )
    }

    // Filter by specific date
    if (dateFilter) {
      filtered = filtered.filter(shipment =>
        toDateString(shipment.shipmentDate) === dateFilter
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(shipment => shipment.status === statusFilter)
    }

    setFilteredShipments(filtered)
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      PRE_ALERTA: 'bg-blue-100 text-blue-800 border-blue-200',
      PRE_RUTEO: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      VERIFICACION: 'bg-purple-100 text-purple-800 border-purple-200',
      FINALIZADO: 'bg-green-100 text-green-800 border-green-200',
    }
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      PRE_ALERTA: 'Pre-Alerta',
      PRE_RUTEO: 'Pre-Ruteo',
      VERIFICACION: 'Verificación',
      FINALIZADO: 'Finalizado',
    }
    return labels[status as keyof typeof labels] || status
  }

  const getStatusProgress = (status: string) => {
    const progress = {
      PRE_ALERTA: 25,
      PRE_RUTEO: 50,
      VERIFICACION: 75,
      FINALIZADO: 100,
    }
    return progress[status as keyof typeof progress] || 0
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header mejorado con breadcrumbs */}
        <div className="bg-white shadow-sm border-b border-gray-200 mb-6">
          <div className="px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <nav className="flex" aria-label="Breadcrumb">
                  <ol className="flex items-center space-x-2">
                    <li>
                      <button
                        onClick={() => router.push('/vms')}
                        className="text-gray-400 hover:text-gray-500 transition-colors"
                      >
                        Dashboard
                      </button>
                    </li>
                    <li>
                      <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </li>
                    <li>
                      <span className="text-gray-500">Todos los Lotes</span>
                    </li>
                  </ol>
                </nav>
                <h1 className="mt-2 text-2xl font-bold text-gray-900">Gestión de Lotes</h1>
                {providerInfo && (
                  <p className="mt-1 text-sm text-gray-600">
                    Proveedor: <span className="font-medium">{providerInfo.name}</span>
                  </p>
                )}
                {session?.user?.role === 'admin' && (
                  <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    Vista de Administrador
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => router.push('/vms')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  ← Volver al Dashboard
                </button>
                <button
                  onClick={() => router.push('/vms/shipments/new')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Lote
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters mejorados */}
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-4 sm:px-6 lg:px-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div>
                <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Filtrar por fecha específica
                </label>
                <input
                  type="date"
                  id="date-filter"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">
                  <Filter className="h-4 w-4 inline mr-1" />
                  Estado del lote
                </label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="all">Todos los estados</option>
                  <option value="PRE_ALERTA">Pre-Alerta</option>
                  <option value="PRE_RUTEO">Pre-Ruteo</option>
                  <option value="VERIFICACION">Verificación</option>
                  <option value="FINALIZADO">Finalizado</option>
                </select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setDateFilter('')
                  setStatusFilter('all')
                }}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>

        {/* Stats Summary mejorado */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-4 text-white">
            <div className="flex items-center">
              <Package className="h-8 w-8 mr-3 opacity-90" />
              <div>
                <p className="text-sm font-medium opacity-90">Total Lotes</p>
                <p className="text-2xl font-bold">{shipments.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg shadow-lg p-4 text-white">
            <div className="flex items-center">
              <div className="h-8 w-8 mr-3 opacity-90">⏳</div>
              <div>
                <p className="text-sm font-medium opacity-90">En Proceso</p>
                <p className="text-2xl font-bold">
                  {shipments.filter(s => s.status !== 'FINALIZADO').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-4 text-white">
            <div className="flex items-center">
              <div className="h-8 w-8 mr-3 opacity-90">✅</div>
              <div>
                <p className="text-sm font-medium opacity-90">Finalizados</p>
                <p className="text-2xl font-bold">
                  {shipments.filter(s => s.status === 'FINALIZADO').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-lg p-4 text-white">
            <div className="flex items-center">
              <div className="h-8 w-8 mr-3 opacity-90">📊</div>
              <div>
                <p className="text-sm font-medium opacity-90">Resultados</p>
                <p className="text-2xl font-bold">{filteredShipments.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Shipments List */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-sm text-gray-500">Cargando lotes...</p>
            </div>
          ) : filteredShipments.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
                📦
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {shipments.length === 0 ? 'No hay lotes registrados' : 'No se encontraron lotes con los filtros aplicados'}
              </h3>
              <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                {shipments.length === 0 
                  ? 'Comienza creando tu primer lote para gestionar tus paquetes de manera eficiente.'
                  : 'Intenta cambiar los filtros de búsqueda o limpiar todos los filtros para ver todos los lotes.'}
              </p>
              {shipments.length === 0 && (
                <button
                  onClick={() => router.push('/vms/shipments/new')}
                  className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 transform hover:scale-105"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Crear Primer Lote
                </button>
              )}
              {shipments.length > 0 && (
                <button
                  onClick={() => {
                    setDateFilter('')
                    setStatusFilter('all')
                  }}
                  className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Limpiar Filtros
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Fecha de Lote
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Progreso
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Paquetes
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Escaneados
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Creado
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredShipments.map((shipment) => (
                    <tr key={shipment.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-5 w-5 text-indigo-500 mr-3" />
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {formatArgentinaDateLong(shipment.shipmentDate)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatArgentinaTime(shipment.shipmentDate)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(shipment.status)}`}>
                          {getStatusLabel(shipment.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-3 max-w-[120px] mr-3">
                            <div
                              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                              style={{ width: `${getStatusProgress(shipment.status)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-gray-700">
                            {getStatusProgress(shipment.status)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="h-5 w-5 text-blue-500 mr-2" />
                          <span className="text-sm font-semibold text-gray-900">
                            {shipment._count?.preAlertas || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-5 w-5 text-green-500 mr-2">📱</div>
                          <span className="text-sm font-semibold text-gray-900">
                            {shipment._count?.scannedPackages || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatArgentinaDate(shipment.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => router.push(`/vms/shipments/${shipment.id}`)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700 transition-all duration-200 transform hover:scale-105"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Results count */}
        {filteredShipments.length > 0 && (
          <div className="mt-4 text-sm text-gray-500 text-center">
            Mostrando {filteredShipments.length} de {shipments.length} lotes
          </div>
        )}
      </div>
    </AppLayout>
  )
}
