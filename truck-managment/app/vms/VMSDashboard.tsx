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
        {/* Header mejorado con branding */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg shadow-lg mb-8">
          <div className="px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">
                  🏢 Panel de Control VMS
                </h1>
                {providerInfo && (
                  <p className="mt-1 text-blue-100">
                    Proveedor: <span className="font-semibold">{providerInfo.name}</span>
                  </p>
                )}
                {session?.user?.role === 'admin' && (
                  <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-400 text-yellow-900">
                    👑 Vista de Administrador
                  </div>
                )}
                <p className="mt-2 text-sm text-blue-100">
                  Bienvenido, {session?.user?.name || 'Usuario'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-blue-100">Estado del sistema</p>
                <p className="text-xl font-semibold">✅ Operativo</p>
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
            {/* Total Envíos */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200 shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <dt className="text-sm font-medium text-blue-600 truncate">
                    Total Envíos
                  </dt>
                  <dd className="text-2xl font-semibold text-blue-900">
                    {stats.totalShipments}
                  </dd>
                </div>
              </div>
            </div>

            {/* En Proceso */}
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 border border-yellow-200 shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <dt className="text-sm font-medium text-yellow-600 truncate">
                    En Proceso
                  </dt>
                  <dd className="text-2xl font-semibold text-yellow-900">
                    {stats.activeShipments}
                  </dd>
                </div>
              </div>
            </div>

            {/* Completados */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200 shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <dt className="text-sm font-medium text-green-600 truncate">
                    Completados
                  </dt>
                  <dd className="text-2xl font-semibold text-green-900">
                    {stats.completedShipments}
                  </dd>
                </div>
              </div>
            </div>

            {/* Eficiencia */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200 shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <dt className="text-sm font-medium text-purple-600 truncate">
                    Eficiencia
                  </dt>
                  <dd className="text-2xl font-semibold text-purple-900">
                    {stats.totalShipments > 0 ? Math.round((stats.completedShipments / stats.totalShipments) * 100) : 0}%
                  </dd>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Recent Shipments mejorados */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">
                📋 Envíos Recientes
              </h2>
              <button
                onClick={() => router.push('/vms/shipments')}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                Ver todos →
              </button>
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
                  No hay envíos
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Comienza creando tu primer envío para empezar a trabajar.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => router.push('/vms/shipments/new')}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Nuevo Envío
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {recentShipments.slice(0, 5).map((shipment) => (
                  <div key={shipment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        shipment.status === 'FINALIZADO' ? 'bg-green-400' :
                        shipment.status === 'VERIFICACION' ? 'bg-yellow-400' : 'bg-blue-400'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Envío del {new Date(shipment.shipmentDate).toLocaleDateString('es-AR')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {shipment.status === 'PRE_ALERTA' && '⏳ Esperando Pre-Ruteo'}
                          {shipment.status === 'PRE_RUTEO' && '📋 Listo para verificación'}
                          {shipment.status === 'VERIFICACION' && '🔍 En proceso de verificación'}
                          {shipment.status === 'FINALIZADO' && '✅ Verificación completada'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        shipment.status === 'FINALIZADO' ? 'bg-green-100 text-green-800' :
                        shipment.status === 'VERIFICACION' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {getStatusLabel(shipment.status)}
                      </span>
                      <button
                        onClick={() => router.push(`/vms/shipments/${shipment.id}`)}
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium transition-colors"
                      >
                        Ver detalles →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
