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
  Eye,
  FileText,
  Calendar,
  ListOrdered,
  Truck,
  CheckCircle2
} from 'lucide-react'
import {
  formatArgentinaDate,
  formatArgentinaTime,
  formatArgentinaDateLong,
  toDateString
} from '@/lib/date-utils'

interface Clasificacion {
  id: string
  shipmentId: string
  finalizado: boolean
  createdAt: string
  updatedAt: string
  shipment: {
    shipmentDate: string
    status: string
    provider: {
      name: string
    }
  }
  _count?: {
    paquetes: number
  }
}

interface ProviderInfo {
  id: string
  name: string
}

export default function ClasificacionesListPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [clasificaciones, setClasificaciones] = useState<Clasificacion[]>([])
  const [filteredClasificaciones, setFilteredClasificaciones] = useState<Clasificacion[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'finalizado' | 'en_progreso'>('all')
  const [dateFilter, setDateFilter] = useState('')
  const [providerInfo, setProviderInfo] = useState<ProviderInfo | null>(null)

  useEffect(() => {
    fetchClasificaciones()
    fetchProviderInfo()
  }, [])

  useEffect(() => {
    filterClasificaciones()
  }, [clasificaciones, searchTerm, statusFilter, dateFilter])

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

  const fetchClasificaciones = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/vms/clasificaciones')
      if (response.ok) {
        const data = await response.json()
        setClasificaciones(data.clasificaciones || [])
      }
    } catch (error) {
      console.error('Error fetching clasificaciones:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterClasificaciones = () => {
    let filtered = clasificaciones

    // Filter by search term (by date)
    if (searchTerm) {
      filtered = filtered.filter(clasif =>
        formatArgentinaDate(clasif.shipment.shipmentDate).includes(searchTerm)
      )
    }

    // Filter by specific date
    if (dateFilter) {
      filtered = filtered.filter(clasif =>
        toDateString(clasif.shipment.shipmentDate) === dateFilter
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      if (statusFilter === 'finalizado') {
        filtered = filtered.filter(clasif => clasif.finalizado)
      } else if (statusFilter === 'en_progreso') {
        filtered = filtered.filter(clasif => !clasif.finalizado)
      }
    }

    setFilteredClasificaciones(filtered)
  }

  const getStatusBadge = (finalizado: boolean) => {
    return finalizado
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-orange-100 text-orange-800 border-orange-200'
  }

  const getStatusLabel = (finalizado: boolean) => {
    return finalizado ? 'Finalizada' : 'En Progreso'
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header mejorado con breadcrumbs */}
        <div className="bg-white shadow-sm border-b border-gray-200 mb-6">
          <div className="px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <nav className="flex mb-2" aria-label="Breadcrumb">
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
                      <span className="text-gray-500">Todas las Clasificaciones</span>
                    </li>
                  </ol>
                </nav>
                <h1 className="mt-2 text-2xl font-bold text-gray-900">Clasificaciones de Paquetes</h1>
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
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Volver al Dashboard</span>
                  <span className="sm:hidden">Volver</span>
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
                  Filtrar por fecha del lote
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
                  Estado de clasificación
                </label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="all">Todos los estados</option>
                  <option value="finalizado">Finalizadas</option>
                  <option value="en_progreso">En Progreso</option>
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
              <ListOrdered className="h-8 w-8 mr-3 opacity-90" />
              <div>
                <p className="text-sm font-medium opacity-90">Total Clasificaciones</p>
                <p className="text-2xl font-bold">{clasificaciones.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-4 text-white">
            <div className="flex items-center">
              <CheckCircle2 className="h-8 w-8 mr-3 opacity-90" />
              <div>
                <p className="text-sm font-medium opacity-90">Finalizadas</p>
                <p className="text-2xl font-bold">
                  {clasificaciones.filter(c => c.finalizado).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow-lg p-4 text-white">
            <div className="flex items-center">
              <div className="h-8 w-8 mr-3 opacity-90">⏳</div>
              <div>
                <p className="text-sm font-medium opacity-90">En Progreso</p>
                <p className="text-2xl font-bold">
                  {clasificaciones.filter(c => !c.finalizado).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-lg p-4 text-white">
            <div className="flex items-center">
              <Package className="h-8 w-8 mr-3 opacity-90" />
              <div>
                <p className="text-sm font-medium opacity-90">Paquetes Clasificados</p>
                <p className="text-2xl font-bold">
                  {clasificaciones.reduce((sum, c) => sum + (c._count?.paquetes || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Clasificaciones List */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-sm text-gray-500">Cargando clasificaciones...</p>
            </div>
          ) : filteredClasificaciones.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
                📦
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {clasificaciones.length === 0 ? 'No hay clasificaciones registradas' : 'No se encontraron clasificaciones con los filtros aplicados'}
              </h3>
              <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                {clasificaciones.length === 0
                  ? 'Las clasificaciones aparecerán aquí una vez que completes el proceso de clasificación en los lotes finalizados.'
                  : 'Intenta cambiar los filtros de búsqueda o limpiar todos los filtros para ver todas las clasificaciones.'}
              </p>
              {clasificaciones.length > 0 && (
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
                      Fecha del Lote
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Proveedor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Paquetes Clasificados
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Última Actualización
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredClasificaciones.map((clasif) => (
                    <tr key={clasif.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-5 w-5 text-indigo-500 mr-3" />
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {formatArgentinaDateLong(clasif.shipment.shipmentDate)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatArgentinaTime(clasif.createdAt)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Truck className="h-5 w-5 text-blue-500 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {clasif.shipment.provider.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(clasif.finalizado)}`}>
                          {getStatusLabel(clasif.finalizado)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="h-5 w-5 text-green-500 mr-2" />
                          <span className="text-sm font-semibold text-gray-900">
                            {clasif._count?.paquetes || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatArgentinaDate(clasif.updatedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => router.push(`/vms/clasificacion/${clasif.shipmentId}`)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700 transition-all duration-200 transform hover:scale-105"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Clasificación
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
        {filteredClasificaciones.length > 0 && (
          <div className="mt-4 text-sm text-gray-500 text-center">
            Mostrando {filteredClasificaciones.length} de {clasificaciones.length} clasificaciones
          </div>
        )}
      </div>
    </AppLayout>
  )
}