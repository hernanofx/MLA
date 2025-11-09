'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/app/components/AppLayout'
import { Package, TrendingUp, CheckCircle2, AlertTriangle, Plus, FileText, Trash2, ListOrdered, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatArgentinaDate } from '@/lib/date-utils'
import TrackingSearchWidget from './TrackingSearchWidget'

interface DashboardStats {
  totalShipments: number
  activeShipments: number
  completedShipments: number
  totalPackages: number
  okPackages: number
  issuesPackages: number
}

interface ProviderInfo {
  id: string
  name: string
}

export default function VMSDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [recentShipments, setRecentShipments] = useState<any[]>([])
  const [providerInfo, setProviderInfo] = useState<ProviderInfo | null>(null)
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10) // Default 10 items per page

  useEffect(() => {
    fetchDashboardData()
    fetchProviderInfo()
  }, [])

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

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/vms/shipments')
      if (response.ok) {
        const data = await response.json()
        
        // Agregar información de clasificación a cada shipment
        const shipmentsWithClasificacion = await Promise.all(
          data.shipments.map(async (shipment: any) => {
            if (shipment.status === 'FINALIZADO') {
              try {
                const clasifResponse = await fetch(`/api/vms/shipments/${shipment.id}/clasificacion`)
                if (clasifResponse.ok) {
                  const clasifData = await clasifResponse.json()
                  return { ...shipment, clasificacion: clasifData.clasificacion }
                }
              } catch (err) {
                console.error('Error fetching clasificacion:', err)
              }
            }
            return shipment
          })
        )
        
        setRecentShipments(shipmentsWithClasificacion || [])
        
        // Calcular estadísticas
        const statsData: DashboardStats = {
          totalShipments: data.shipments.length,
          activeShipments: data.shipments.filter((s: any) => s.status !== 'FINALIZADO').length,
          completedShipments: data.shipments.filter((s: any) => s.status === 'FINALIZADO').length,
          totalPackages: data.totalPackages || 0,
          okPackages: data.okPackages || 0,
          issuesPackages: data.issuesPackages || 0,
        }
        setStats(statsData)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteShipment = async (shipmentId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este lote? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      const response = await fetch(`/api/vms/shipments/${shipmentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al eliminar el lote')
      }

      // Refresh the data
      fetchDashboardData()
      alert('Lote eliminado exitosamente')
    } catch (error: any) {
      alert(error.message || 'Error al eliminar el lote')
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      PRE_ALERTA: 'bg-blue-100 text-blue-800',
      PRE_RUTEO: 'bg-yellow-100 text-yellow-800',
      VERIFICACION: 'bg-purple-100 text-purple-800',
      FINALIZADO: 'bg-green-100 text-green-800',
    }
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800'
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

  return (
    <AppLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header profesional y limpio */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-8">
          <div className="px-4 py-4 sm:px-6 sm:py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Panel de Control VMS
                </h1>
                {providerInfo && (
                  <p className="mt-1 text-sm text-gray-600">
                    Proveedor: <span className="font-medium text-gray-900">{providerInfo.name}</span>
                  </p>
                )}
                {session?.user?.role === 'admin' && (
                  <div className="mt-2 inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-amber-100 text-amber-900 border border-amber-200">
                    Vista de Administrador
                  </div>
                )}
                <p className="mt-2 text-sm text-gray-600">
                  Bienvenido, {session?.user?.name || 'Usuario'}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end space-y-3 sm:space-y-0 sm:space-x-3 lg:space-x-0 lg:space-y-3">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                  <button
                    onClick={() => router.push('/vms/scan')}
                    className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-indigo-600 shadow-sm text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 transition-colors w-full sm:w-auto"
                  >
                    <Package className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    <span className="hidden xs:inline">Escanear Paquetes</span>
                    <span className="xs:hidden">Escanear</span>
                  </button>
                  <button
                    onClick={() => router.push('/vms/shipments/new')}
                    className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Nuevo Lote
                  </button>
                </div>
                <div className="text-left sm:text-right lg:text-right w-full sm:w-auto">
                  <p className="text-sm text-gray-600">Estado del sistema</p>
                  <div className="flex items-center justify-start sm:justify-end lg:justify-end space-x-2 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-base sm:text-lg font-semibold text-gray-900">Operativo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
                <div className="p-5">
                  <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {/* Total Lotes */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Package className="h-8 w-8 text-gray-700" />
                </div>
                <div className="ml-4">
                  <dt className="text-sm font-medium text-gray-600">
                    Total Lotes
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {stats.totalShipments}
                  </dd>
                </div>
              </div>
            </div>

            {/* En Proceso */}
            <div className="bg-white rounded-lg p-6 border border-amber-200 shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-amber-600" />
                </div>
                <div className="ml-4">
                  <dt className="text-sm font-medium text-amber-700">
                    En Proceso
                  </dt>
                  <dd className="text-2xl font-bold text-amber-900">
                    {stats.activeShipments}
                  </dd>
                </div>
              </div>
            </div>

            {/* Completados */}
            <div className="bg-white rounded-lg p-6 border border-green-200 shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <dt className="text-sm font-medium text-green-700">
                    Completados
                  </dt>
                  <dd className="text-2xl font-bold text-green-900">
                    {stats.completedShipments}
                  </dd>
                </div>
              </div>
            </div>

            {/* Eficiencia */}
            <div className="bg-white rounded-lg p-6 border border-blue-200 shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <dt className="text-sm font-medium text-blue-700">
                    Eficiencia
                  </dt>
                  <dd className="text-2xl font-bold text-blue-900">
                    {stats.totalShipments > 0 ? Math.round((stats.completedShipments / stats.totalShipments) * 100) : 0}%
                  </dd>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Buscador de Tracking Number */}
        <div className="mb-8">
          <TrackingSearchWidget />
        </div>

        <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-3 sm:space-y-0">
              <h2 className="text-lg font-semibold text-gray-900">
                Lotes Recientes
              </h2>
              <div className="flex flex-col xs:flex-row gap-2 xs:gap-3">
                <button
                  onClick={() => router.push('/vms/clasificaciones')}
                  className="text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors text-left xs:text-right"
                >
                  Ver todas las clasificaciones →
                </button>
                <div className="hidden xs:block text-gray-400">|</div>
                <button
                  onClick={() => router.push('/vms/shipments')}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors text-left xs:text-right"
                >
                  Ver todos los lotes →
                </button>
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex items-center p-4 border rounded-lg">
                    <div className="w-3 h-3 bg-gray-200 rounded-full mr-4"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentShipments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No hay lotes
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Comienza creando tu primer lote para empezar a trabajar.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => router.push('/vms/shipments/new')}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Nuevo Lote
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Pagination logic */}
                {(() => {
                  const totalItems = recentShipments.length
                  const totalPages = Math.ceil(totalItems / itemsPerPage)
                  const startIndex = (currentPage - 1) * itemsPerPage
                  const endIndex = startIndex + itemsPerPage
                  const currentShipments = recentShipments.slice(startIndex, endIndex)

                  return (
                    <>
                      {currentShipments.map((shipment) => (
                        <div key={shipment.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors space-y-3 sm:space-y-0">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                              shipment.status === 'FINALIZADO' ? 'bg-green-500' :
                              shipment.status === 'VERIFICACION' ? 'bg-amber-500' : 'bg-blue-500'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                Lote del {formatArgentinaDate(shipment.shipmentDate)}
                              </p>
                              <p className="text-sm text-gray-600">
                                {shipment.status === 'PRE_ALERTA' && 'Esperando Pre-Ruteo'}
                                {shipment.status === 'PRE_RUTEO' && 'Listo para verificación'}
                                {shipment.status === 'VERIFICACION' && 'En verificación'}
                                {shipment.status === 'FINALIZADO' && 'Completado'}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium self-start ${
                              shipment.status === 'FINALIZADO' ? 'bg-green-100 text-green-800 border border-green-200' :
                              shipment.status === 'VERIFICACION' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                              'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}>
                              {getStatusLabel(shipment.status)}
                            </span>
                            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                              {shipment.status === 'FINALIZADO' && (
                                <button
                                  onClick={() => router.push(`/vms/clasificacion/${shipment.id}`)}
                                  className={`inline-flex items-center justify-center px-3 py-2 border shadow-sm text-xs font-medium rounded-md transition-all duration-200 w-full sm:w-auto ${
                                    shipment.clasificacion?.finalizado
                                      ? 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 hover:border-blue-400'
                                      : 'border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100 hover:border-orange-400'
                                  }`}
                                  title={shipment.clasificacion?.finalizado ? 'Ver clasificación finalizada' : 'Clasificar paquetes por vehículo'}
                                >
                                  <ListOrdered className="h-4 w-4 mr-1.5" />
                                  <span className="truncate">
                                    {shipment.clasificacion?.finalizado ? 'Ver Clasificación' : 'Clasificar'}
                                  </span>
                                </button>
                              )}
                              <button
                                onClick={() => router.push(`/vms/shipments/${shipment.id}`)}
                                className="inline-flex items-center justify-center px-3 py-2 border border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-400 shadow-sm text-xs font-medium rounded-md transition-all duration-200 w-full sm:w-auto"
                              >
                                <Eye className="h-4 w-4 mr-1.5" />
                                Ver Lote
                              </button>
                              <button
                                onClick={() => handleDeleteShipment(shipment.id)}
                                className="inline-flex items-center justify-center px-3 py-2 border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 hover:border-red-400 shadow-sm text-xs font-medium rounded-md transition-all duration-200 w-full sm:w-auto"
                                title="Eliminar lote"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                          <div className="flex flex-1 justify-between sm:hidden">
                            <button
                              onClick={() => setCurrentPage(currentPage - 1)}
                              disabled={currentPage === 1}
                              className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Anterior
                            </button>
                            <button
                              onClick={() => setCurrentPage(currentPage + 1)}
                              disabled={currentPage === totalPages}
                              className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Siguiente
                            </button>
                          </div>

                          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm text-gray-700">
                                Mostrando <span className="font-medium">{startIndex + 1}</span> a{' '}
                                <span className="font-medium">{Math.min(endIndex, totalItems)}</span> de{' '}
                                <span className="font-medium">{totalItems}</span> lotes
                              </p>
                            </div>

                            <div>
                              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button
                                  onClick={() => setCurrentPage(1)}
                                  disabled={currentPage === 1}
                                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <span className="sr-only">Primera</span>
                                  <ChevronLeft className="h-5 w-5" />
                                </button>

                                <button
                                  onClick={() => setCurrentPage(currentPage - 1)}
                                  disabled={currentPage === 1}
                                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <span className="sr-only">Anterior</span>
                                  <ChevronLeft className="h-5 w-5" />
                                </button>

                                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                  let pageNumber
                                  if (totalPages <= 5) {
                                    pageNumber = i + 1
                                  } else if (currentPage <= 3) {
                                    pageNumber = i + 1
                                  } else if (currentPage >= totalPages - 2) {
                                    pageNumber = totalPages - 4 + i
                                  } else {
                                    pageNumber = currentPage - 2 + i
                                  }
                                  return (
                                    <button
                                      key={pageNumber}
                                      onClick={() => setCurrentPage(pageNumber)}
                                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                        pageNumber === currentPage
                                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                      }`}
                                    >
                                      {pageNumber}
                                    </button>
                                  )
                                })}

                                <button
                                  onClick={() => setCurrentPage(currentPage + 1)}
                                  disabled={currentPage === totalPages}
                                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <span className="sr-only">Siguiente</span>
                                  <ChevronRight className="h-5 w-5" />
                                </button>

                                <button
                                  onClick={() => setCurrentPage(totalPages)}
                                  disabled={currentPage === totalPages}
                                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <span className="sr-only">Última</span>
                                  <ChevronRight className="h-5 w-5" />
                                </button>
                              </nav>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
