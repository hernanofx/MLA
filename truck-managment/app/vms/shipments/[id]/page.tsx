'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AppLayout from '@/app/components/AppLayout'
import { 
  ArrowLeft, 
  Package, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock,
  Download,
  FileText
} from 'lucide-react'

interface ReportStats {
  totalScanned: number
  ok: number
  faltantes: number
  sobrante: number
  fueraCobertura: number
  previo: number
  details: ScannedPackage[]
}

interface ScannedPackage {
  id: string
  trackingNumber: string
  status: 'OK' | 'SOBRANTE' | 'FUERA_COBERTURA' | 'PREVIO'
  scannedAt: string
  preAlerta?: {
    buyer: string
    city: string
    weight: number
  }
  preRuteo?: {
    chofer: string
    razonSocial: string
  }
}

interface ShipmentInfo {
  id: string
  shipmentDate: string
  status: string
  providerId?: string
}

export default function ShipmentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const shipmentId = params.id as string

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<ReportStats | null>(null)
  const [shipmentInfo, setShipmentInfo] = useState<ShipmentInfo | null>(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'OK' | 'SOBRANTE' | 'FUERA_COBERTURA' | 'PREVIO' | 'FALTANTES'>('all')

  useEffect(() => {
    if (shipmentId) {
      fetchShipmentData()
    }
  }, [shipmentId])

  const fetchShipmentData = async () => {
    try {
      setLoading(true)
      
      // Fetch shipment info
      const shipmentResponse = await fetch(`/api/vms/shipments`)
      if (shipmentResponse.ok) {
        const data = await shipmentResponse.json()
        const shipment = data.shipments.find((s: any) => s.id === shipmentId)
        if (shipment) {
          setShipmentInfo(shipment)
        }
      }

      // Fetch report data
      const reportResponse = await fetch(`/api/vms/shipments/${shipmentId}/report`)
      if (reportResponse.ok) {
        const reportData = await reportResponse.json()
        setStats(reportData)
      } else {
        const errorData = await reportResponse.json()
        setError(errorData.error || 'Error al cargar el reporte')
      }
    } catch (err: any) {
      console.error('Error fetching shipment data:', err)
      setError(err.message || 'Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/vms/reports/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentId }),
      })

      if (!response.ok) {
        throw new Error('Error al exportar')
      }

      // Descargar archivo
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte-${shipmentId}-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      alert(err.message || 'Error al exportar')
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      OK: 'text-green-600 bg-green-100',
      SOBRANTE: 'text-red-600 bg-red-100',
      FUERA_COBERTURA: 'text-yellow-600 bg-yellow-100',
      PREVIO: 'text-blue-600 bg-blue-100',
      FALTANTES: 'text-purple-600 bg-purple-100',
    }
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OK':
        return <CheckCircle2 className="h-5 w-5" />
      case 'SOBRANTE':
        return <XCircle className="h-5 w-5" />
      case 'FUERA_COBERTURA':
        return <AlertTriangle className="h-5 w-5" />
      case 'PREVIO':
        return <Clock className="h-5 w-5" />
      default:
        return <Package className="h-5 w-5" />
    }
  }

  const filteredPackages = stats?.details.filter(pkg => 
    filter === 'all' ? true : pkg.status === filter
  ) || []

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-900 mb-2">Error</h2>
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => router.push('/vms')}
              className="mt-4 inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </button>
          </div>
        </div>
      </AppLayout>
    )
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
                Detalle del Envío
              </h1>
              {shipmentInfo && (
                <p className="text-sm text-gray-500 mt-1">
                  Fecha: {new Date(shipmentInfo.shipmentDate).toLocaleDateString('es-AR')}
                </p>
              )}
            </div>
            
            <button
              onClick={handleExport}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-400">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Escaneados</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalScanned}</p>
                </div>
                <Package className="h-8 w-8 text-gray-400" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">OK</p>
                  <p className="text-2xl font-bold text-green-600">{stats.ok}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Faltantes</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.faltantes}</p>
                </div>
                <FileText className="h-8 w-8 text-purple-400" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sobrantes</p>
                  <p className="text-2xl font-bold text-red-600">{stats.sobrante}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Fuera Cobertura</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.fueraCobertura}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-400" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Previos</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.previo}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-400" />
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {[
                { key: 'all', label: 'Todos', count: stats?.totalScanned || 0 },
                { key: 'OK', label: 'OK', count: stats?.ok || 0 },
                { key: 'SOBRANTE', label: 'Sobrantes', count: stats?.sobrante || 0 },
                { key: 'FUERA_COBERTURA', label: 'Fuera Cobertura', count: stats?.fueraCobertura || 0 },
                { key: 'PREVIO', label: 'Previos', count: stats?.previo || 0 },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as any)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm
                    ${filter === tab.key
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>

          {/* Packages List */}
          <div className="p-6">
            {filteredPackages.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  No hay paquetes en esta categoría
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={`p-2 rounded-full ${getStatusColor(pkg.status)}`}>
                          {getStatusIcon(pkg.status)}
                        </div>
                        
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{pkg.trackingNumber}</p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(pkg.status)} mt-1`}>
                            {pkg.status}
                          </span>

                          {/* Details for OK packages */}
                          {pkg.status === 'OK' && (
                            <div className="mt-3 pl-4 border-l-2 border-green-300 space-y-1">
                              {pkg.preAlerta && (
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium text-green-700">📦 Pre-Alerta:</span>{' '}
                                  {pkg.preAlerta.buyer} • {pkg.preAlerta.city} • {(pkg.preAlerta.weight / 1000).toFixed(2)}kg
                                </div>
                              )}
                              {pkg.preRuteo && (
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium text-blue-700">🚚 Pre-Ruteo:</span>{' '}
                                  {pkg.preRuteo.chofer} • {pkg.preRuteo.razonSocial}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <span className="text-xs text-gray-500 ml-4">
                        {new Date(pkg.scannedAt).toLocaleString('es-AR')}
                      </span>
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
