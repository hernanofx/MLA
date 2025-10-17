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
  const [providerInfo, setProviderInfo] = useState<ProviderInfo | null>(null)

  useEffect(() => {
    fetchShipments()
    fetchProviderInfo()
  }, [])

  useEffect(() => {
    filterShipments()
  }, [shipments, searchTerm, statusFilter])

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
        new Date(shipment.shipmentDate).toLocaleDateString('es-AR').includes(searchTerm)
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
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/vms')}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver al Dashboard
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Todos los Envíos
              </h1>
              {providerInfo && (
                <p className="text-sm text-gray-500 mt-1">
                  Proveedor: <span className="font-medium text-gray-900">{providerInfo.name}</span>
                </p>
              )}
              {session?.user?.role === 'admin' && (
                <p className="mt-1 text-xs text-indigo-600 font-medium">
                  Vista de administrador - Todos los proveedores
                </p>
              )}
            </div>
            
            <button
              onClick={() => router.push('/vms/shipments/new')}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Envío
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 gap-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar por fecha..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-3">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="all">Todos los estados</option>
                <option value="PRE_ALERTA">Pre-Alerta</option>
                <option value="PRE_RUTEO">Pre-Ruteo</option>
                <option value="VERIFICACION">Verificación</option>
                <option value="FINALIZADO">Finalizado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm font-medium text-gray-600">Total Envíos</p>
            <p className="text-2xl font-bold text-gray-900">{shipments.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm font-medium text-gray-600">En Proceso</p>
            <p className="text-2xl font-bold text-blue-600">
              {shipments.filter(s => s.status !== 'FINALIZADO').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm font-medium text-gray-600">Finalizados</p>
            <p className="text-2xl font-bold text-green-600">
              {shipments.filter(s => s.status === 'FINALIZADO').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm font-medium text-gray-600">Resultados</p>
            <p className="text-2xl font-bold text-gray-900">{filteredShipments.length}</p>
          </div>
        </div>

        {/* Shipments List */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-sm text-gray-500">Cargando envíos...</p>
            </div>
          ) : filteredShipments.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {shipments.length === 0 ? 'No hay envíos' : 'No se encontraron envíos'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {shipments.length === 0 
                  ? 'Comienza creando un nuevo envío'
                  : 'Intenta cambiar los filtros de búsqueda'}
              </p>
              {shipments.length === 0 && (
                <div className="mt-6">
                  <button
                    onClick={() => router.push('/vms/shipments/new')}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Nuevo Envío
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha de Envío
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progreso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paquetes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Escaneados
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Creación
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredShipments.map((shipment) => (
                    <tr key={shipment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {new Date(shipment.shipmentDate).toLocaleDateString('es-AR')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(shipment.status)}`}>
                          {getStatusLabel(shipment.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2 max-w-[100px]">
                            <div
                              className="bg-indigo-600 h-2 rounded-full"
                              style={{ width: `${getStatusProgress(shipment.status)}%` }}
                            ></div>
                          </div>
                          <span className="ml-2 text-xs text-gray-500">
                            {getStatusProgress(shipment.status)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Package className="h-4 w-4 text-gray-400 mr-1" />
                          {shipment._count?.preAlertas || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {shipment._count?.scannedPackages || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(shipment.createdAt).toLocaleDateString('es-AR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => router.push(`/vms/shipments/${shipment.id}`)}
                          className="inline-flex items-center text-indigo-600 hover:text-indigo-900"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver detalle
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
            Mostrando {filteredShipments.length} de {shipments.length} envíos
          </div>
        )}
      </div>
    </AppLayout>
  )
}
