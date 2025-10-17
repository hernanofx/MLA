'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/app/components/AppLayout'
import { Package, TrendingUp, CheckCircle2, AlertTriangle, Plus, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'

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
        setRecentShipments(data.shipments || [])
        
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">
                Dashboard VMS
              </h1>
              {providerInfo && (
                <p className="mt-1 text-sm text-gray-500">
                  Proveedor: <span className="font-medium text-gray-900">{providerInfo.name}</span>
                </p>
              )}
              {session?.user?.role === 'admin' && (
                <p className="mt-1 text-xs text-indigo-600 font-medium">
                  Vista de administrador - Todos los proveedores
                </p>
              )}
              <p className="mt-2 text-sm text-gray-600">
                Bienvenido, {session?.user?.name || 'Usuario'}
              </p>
            </div>
            <button
              onClick={() => router.push('/vms/shipments/new')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nuevo Envío
            </button>
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
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Envíos
                      </dt>
                      <dd className="text-2xl font-semibold text-gray-900">
                        {stats.totalShipments}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-8 w-8 text-blue-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        En Proceso
                      </dt>
                      <dd className="text-2xl font-semibold text-gray-900">
                        {stats.activeShipments}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle2 className="h-8 w-8 text-green-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Completados
                      </dt>
                      <dd className="text-2xl font-semibold text-gray-900">
                        {stats.completedShipments}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-8 w-8 text-yellow-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Con Incidencias
                      </dt>
                      <dd className="text-2xl font-semibold text-gray-900">
                        {stats.issuesPackages}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Recent Shipments */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                Envíos Recientes
              </h2>
              <button
                onClick={() => router.push('/vms/shipments')}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Ver todos
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex items-center py-4 border-b border-gray-200">
                    <div className="h-10 w-10 bg-gray-200 rounded-full mr-4"></div>
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
                  No hay envíos
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Comienza creando un nuevo envío
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => router.push('/vms/shipments/new')}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Nuevo Envío
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Paquetes
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentShipments.slice(0, 5).map((shipment) => (
                      <tr key={shipment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(shipment.shipmentDate).toLocaleDateString('es-AR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(shipment.status)}`}>
                            {getStatusLabel(shipment.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {shipment._count?.preAlertas || 0} paquetes
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => router.push(`/vms/shipments/${shipment.id}`)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
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
        </div>
      </div>
    </AppLayout>
  )
}
