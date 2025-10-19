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
  FileText,
  Calendar
} from 'lucide-react'
import { 
  formatArgentinaDateLong, 
  formatArgentinaDateTime,
  getArgentinaDateForInput,
  toDateString
} from '@/lib/date-utils'

interface ReportStats {
  totalScanned: number
  ok: number
  faltantes: number
  sobrante: number
  fueraCobertura: number
  previo: number
  details: ScannedPackage[]
  allPreAlertas?: PreAlertaInfo[]
  allPreRuteos?: PreRuteoInfo[]
  faltantesData?: FaltanteItem[]
  fueraCoberturaData?: FueraCoberturaItem[]
  previoData?: PrevioItem[]
  sobranteData?: SobranteItem[]
}

interface ScannedPackage {
  id: string
  trackingNumber: string
  status: 'OK' | 'SOBRANTE' | 'FUERA_COBERTURA' | 'PREVIO' | 'FALTANTES'
  scannedAt: string
  preAlerta?: {
    buyer: string
    city: string
    weight: number
  }
  preRuteo?: {
    chofer: string
    razonSocial: string
    fechaReparto?: Date
  }
}

interface FaltanteItem {
  trackingNumber: string
  buyer: string
  city: string
  weight: number
}

interface FueraCoberturaItem {
  trackingNumber: string
  buyer: string
  city: string
  weight: number
}

interface PrevioItem {
  trackingNumber: string
  chofer: string
  razonSocial: string
  fechaReparto?: Date
}

interface SobranteItem {
  trackingNumber: string
}

interface PreAlertaInfo {
  trackingNumber: string
  buyer: string
  city: string
  weight: number
  inPreRuteo: boolean
}

interface PreRuteoInfo {
  codigoPedido: string
  chofer: string
  razonSocial: string
  inPreAlerta: boolean
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
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [dateFilter, setDateFilter] = useState('')

  useEffect(() => {
    if (shipmentId) {
      fetchShipmentData()
    }
  }, [shipmentId, dateFilter])

  useEffect(() => {
    setCurrentPage(1) // Reset to first page when filter changes
  }, [filter])

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
      a.download = `reporte-${shipmentId}-${getArgentinaDateForInput()}.xlsx`
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
      case 'FALTANTES':
        return <FileText className="h-5 w-5" />
      default:
        return <Package className="h-5 w-5" />
    }
  }

  const getTotalPackages = () => {
    if (!stats) return 0
    return stats.totalScanned + stats.faltantes + stats.fueraCobertura + stats.previo + stats.sobrante
  }

  // Get filtered items based on selected tab
  const getFilteredItems = () => {
    if (!stats) return []

    switch (filter) {
      case 'OK':
        return stats.details.filter(pkg => pkg.status === 'OK')
      
      case 'SOBRANTE':
        return stats.sobranteData ? stats.sobranteData.map(item => ({
          id: `sobrante-${item.trackingNumber}`,
          trackingNumber: item.trackingNumber,
          status: 'SOBRANTE' as const,
          scannedAt: new Date().toISOString()
        })) : []
      
      case 'FUERA_COBERTURA':
        return stats.fueraCoberturaData ? stats.fueraCoberturaData.map(item => ({
          id: `fuera-${item.trackingNumber}`,
          trackingNumber: item.trackingNumber,
          status: 'FUERA_COBERTURA' as const,
          scannedAt: new Date().toISOString(),
          preAlerta: {
            buyer: item.buyer,
            city: item.city,
            weight: item.weight
          }
        })) : []
      
      case 'PREVIO':
        return stats.previoData ? stats.previoData.map(item => ({
          id: `previo-${item.trackingNumber}`,
          trackingNumber: item.trackingNumber,
          status: 'PREVIO' as const,
          scannedAt: new Date().toISOString(),
          preRuteo: {
            chofer: item.chofer,
            razonSocial: item.razonSocial,
            fechaReparto: item.fechaReparto
          }
        })) : []
      
      case 'FALTANTES':
        return stats.faltantesData ? stats.faltantesData.map(item => ({
          id: `faltante-${item.trackingNumber}`,
          trackingNumber: item.trackingNumber,
          status: 'FALTANTES' as const,
          scannedAt: new Date().toISOString(),
          preAlerta: {
            buyer: item.buyer,
            city: item.city,
            weight: item.weight
          }
        })) : []
      
      case 'all':
      default:
        // Combine all categories for "Todos"
        const allItems: ScannedPackage[] = []
        
        // Add scanned packages (OK and SOBRANTE)
        allItems.push(...stats.details)
        
        // Add faltantes
        if (stats.faltantesData) {
          allItems.push(...stats.faltantesData.map(item => ({
            id: `faltante-${item.trackingNumber}`,
            trackingNumber: item.trackingNumber,
            status: 'FALTANTES' as const,
            scannedAt: new Date().toISOString(),
            preAlerta: {
              buyer: item.buyer,
              city: item.city,
              weight: item.weight
            }
          })))
        }
        
        // Add fuera cobertura
        if (stats.fueraCoberturaData) {
          allItems.push(...stats.fueraCoberturaData.map(item => ({
            id: `fuera-${item.trackingNumber}`,
            trackingNumber: item.trackingNumber,
            status: 'FUERA_COBERTURA' as const,
            scannedAt: new Date().toISOString(),
            preAlerta: {
              buyer: item.buyer,
              city: item.city,
              weight: item.weight
            }
          })))
        }
        
        // Add previo
        if (stats.previoData) {
          allItems.push(...stats.previoData.map(item => ({
            id: `previo-${item.trackingNumber}`,
            trackingNumber: item.trackingNumber,
            status: 'PREVIO' as const,
            scannedAt: new Date().toISOString(),
            preRuteo: {
              chofer: item.chofer,
              razonSocial: item.razonSocial,
              fechaReparto: item.fechaReparto
            }
          })))
        }
        
        return allItems
    }
  }

  const filteredItems = getFilteredItems()
  
  // Apply date filter if needed
  const dateFilteredItems = dateFilter 
    ? filteredItems.filter(item => {
        if (!item.scannedAt) return false
        try {
          return toDateString(item.scannedAt) === dateFilter
        } catch {
          return false
        }
      })
    : filteredItems

  // Pagination
  const totalPages = Math.ceil(dateFilteredItems.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = dateFilteredItems.slice(indexOfFirstItem, indexOfLastItem)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

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
        <div className="bg-white shadow-sm border-b border-gray-200 mb-6">
          <div className="px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex-1 min-w-0">
                <nav className="flex mb-2" aria-label="Breadcrumb">
                  <ol className="flex items-center space-x-2 text-sm">
                    <li>
                      <button
                        onClick={() => router.push('/vms')}
                        className="text-gray-400 hover:text-gray-500 transition-colors"
                      >
                        Dashboard
                      </button>
                    </li>
                    <li>
                      <svg className="flex-shrink-0 h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </li>
                    <li>
                      <button
                        onClick={() => router.push('/vms/shipments')}
                        className="text-gray-400 hover:text-gray-500 transition-colors"
                      >
                        Lotes
                      </button>
                    </li>
                    <li>
                      <svg className="flex-shrink-0 h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </li>
                    <li>
                      <span className="text-gray-500">Detalle</span>
                    </li>
                  </ol>
                </nav>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Reporte de Lote</h1>
                {shipmentInfo && (
                  <p className="mt-1 text-sm text-gray-600">
                    Fecha: <span className="font-medium">{formatArgentinaDateLong(shipmentInfo.shipmentDate)}</span>
                  </p>
                )}
                {shipmentInfo && (
                  <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    Estado: {shipmentInfo.status === 'PRE_ALERTA' ? 'Pre-Alerta' :
                             shipmentInfo.status === 'PRE_RUTEO' ? 'Pre-Ruteo' :
                             shipmentInfo.status === 'VERIFICACION' ? 'Verificación' :
                             shipmentInfo.status === 'FINALIZADO' ? 'Finalizado' : shipmentInfo.status}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => router.push('/vms/shipments')}
                  className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Volver a Lotes</span>
                  <span className="sm:hidden">Volver</span>
                </button>
                <button
                  onClick={handleExport}
                  className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transition-all duration-200 transform hover:scale-105"
                >
                  <Download className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Exportar Excel</span>
                  <span className="sm:hidden">Exportar</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards mejoradas */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg shadow-lg p-3 sm:p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium opacity-90 truncate">Total</p>
                  <p className="text-lg sm:text-2xl font-bold">{getTotalPackages()}</p>
                </div>
                <Package className="h-6 w-6 sm:h-8 sm:w-8 opacity-90 flex-shrink-0 ml-2" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-3 sm:p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium opacity-90 truncate">OK</p>
                  <p className="text-lg sm:text-2xl font-bold">{stats.ok}</p>
                </div>
                <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 opacity-90 flex-shrink-0 ml-2" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-lg p-3 sm:p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium opacity-90 truncate">Faltantes</p>
                  <p className="text-lg sm:text-2xl font-bold">{stats.faltantes}</p>
                </div>
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 opacity-90 flex-shrink-0 ml-2" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow-lg p-3 sm:p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium opacity-90 truncate">Sobrantes</p>
                  <p className="text-lg sm:text-2xl font-bold">{stats.sobrante}</p>
                </div>
                <XCircle className="h-6 w-6 sm:h-8 sm:w-8 opacity-90 flex-shrink-0 ml-2" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg shadow-lg p-3 sm:p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium opacity-90 truncate">Fuera Cob.</p>
                  <p className="text-lg sm:text-2xl font-bold">{stats.fueraCobertura}</p>
                </div>
                <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 opacity-90 flex-shrink-0 ml-2" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-3 sm:p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium opacity-90 truncate">Previos</p>
                  <p className="text-lg sm:text-2xl font-bold">{stats.previo}</p>
                </div>
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 opacity-90 flex-shrink-0 ml-2" />
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs mejoradas */}
        <div className="bg-white rounded-lg shadow mb-6">
          {/* Date Filter mejorado */}
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <Calendar className="h-5 w-5 text-gray-400 hidden sm:block" />
              <label htmlFor="dateFilter" className="text-sm font-medium text-gray-700">
                Filtrar por fecha de escaneo:
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  id="dateFilter"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <button
                  onClick={() => setDateFilter(getArgentinaDateForInput())}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium whitespace-nowrap"
                >
                  Hoy
                </button>
                {dateFilter && (
                  <button
                    onClick={() => setDateFilter('')}
                    className="text-sm text-gray-600 hover:text-gray-800 font-medium whitespace-nowrap"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-4 sm:space-x-8 px-4 sm:px-6 overflow-x-auto scrollbar-hide" aria-label="Tabs">
              {[
                { key: 'all', label: 'Todos', count: getTotalPackages() },
                { key: 'OK', label: 'OK', count: stats?.ok || 0 },
                { key: 'FALTANTES', label: 'Faltantes', count: stats?.faltantes || 0 },
                { key: 'SOBRANTE', label: 'Sobrantes', count: stats?.sobrante || 0 },
                { key: 'FUERA_COBERTURA', label: 'Fuera Cobertura', count: stats?.fueraCobertura || 0 },
                { key: 'PREVIO', label: 'Previos', count: stats?.previo || 0 },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as any)}
                  className={`
                    py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0
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
            {currentItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
                  📦
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {filter === 'all' ? 'No hay paquetes en este lote' : `No hay paquetes en la categoría "${filter}"`}
                </h3>
                <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                  {filter === 'all' 
                    ? 'Este lote aún no tiene paquetes escaneados o la información no está disponible.'
                    : `No se encontraron paquetes que coincidan con el filtro seleccionado. Intenta cambiar la categoría o limpiar los filtros.`}
                </p>
                {filter !== 'all' && (
                  <button
                    onClick={() => setFilter('all')}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    🔄 Ver Todos los Paquetes
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {currentItems.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="border border-gray-200 rounded-md p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      {/* Tracking Number - Always visible and prominent */}
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-full ${getStatusColor(pkg.status)} flex-shrink-0`}>
                          {getStatusIcon(pkg.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{pkg.trackingNumber}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(pkg.status)}`}>
                              {pkg.status === 'FALTANTES' ? 'Faltante' : pkg.status}
                            </span>
                            
                            {/* Compact info based on status */}
                            {pkg.status === 'OK' && (
                              <span className="text-xs text-gray-600 truncate">
                                {pkg.preAlerta && pkg.preAlerta.buyer && pkg.preAlerta.city && `${pkg.preAlerta.buyer} • ${pkg.preAlerta.city}`}
                                {pkg.preAlerta && pkg.preAlerta.buyer && pkg.preRuteo && pkg.preRuteo.chofer && ' | '}
                                {pkg.preRuteo && pkg.preRuteo.chofer && `${pkg.preRuteo.chofer}`}
                              </span>
                            )}
                            
                            {pkg.status === 'FALTANTES' && pkg.preAlerta && (
                              <span className="text-xs text-gray-600 truncate">
                                {pkg.preAlerta.buyer || 'Sin datos'} • {pkg.preAlerta.city || 'Sin ciudad'} • {pkg.preAlerta.weight ? (pkg.preAlerta.weight / 1000).toFixed(1) : '0'}kg
                              </span>
                            )}
                            
                            {pkg.status === 'FUERA_COBERTURA' && pkg.preAlerta && (
                              <span className="text-xs text-gray-600 truncate">
                                {pkg.preAlerta.buyer || 'Sin datos'} • {pkg.preAlerta.city || 'Sin ciudad'} • {pkg.preAlerta.weight ? (pkg.preAlerta.weight / 1000).toFixed(1) : '0'}kg
                              </span>
                            )}
                            
                            {pkg.status === 'PREVIO' && pkg.preRuteo && (
                              <span className="text-xs text-gray-600 truncate">
                                {pkg.preRuteo.chofer || 'Sin chofer'} • {pkg.preRuteo.razonSocial || 'Sin razón social'}
                              </span>
                            )}
                            
                            {pkg.status === 'SOBRANTE' && (
                              <span className="text-xs text-gray-600">No encontrado en referencias</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Date - Right side */}
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {(() => {
                            // Try to get fechaReparto from preRuteo first
                            const pkgWithPreRuteo = pkg as any
                            if (pkgWithPreRuteo.preRuteo?.fechaReparto) {
                              try {
                                return formatArgentinaDateTime(pkgWithPreRuteo.preRuteo.fechaReparto)
                              } catch {
                                return 'Error'
                              }
                            }
                            // Fallback to scannedAt
                            if (pkg.scannedAt) {
                              try {
                                return formatArgentinaDateTime(pkg.scannedAt)
                              } catch {
                                return 'Error'
                              }
                            }
                            return 'Sin fecha'
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {dateFilteredItems.length > 10 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, dateFilteredItems.length)} de {dateFilteredItems.length} resultados
            </div>
            <div className="flex space-x-1">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                Anterior
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
                    onClick={() => paginate(pageNumber)}
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
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
