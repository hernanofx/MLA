'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ScanLine, Truck, MapPin, CheckCircle, XCircle, AlertTriangle, Download, Play, Pause, CheckSquare, Package } from 'lucide-react'
import Pagination from '@/app/components/Pagination'
import TableFilters from '@/app/components/TableFilters'
import ClasificacionStats from '@/app/components/ClasificacionStats'
import VehicleProgressTracker from '@/app/components/VehicleProgressTracker'

interface EscaneoClasificacionStepProps {
  clasificacionId: string
  shipmentId: string
  isReadOnly?: boolean
}

interface ScanResult {
  trackingNumber: string
  status: 'CLASIFICADO' | 'YA_ESCANEADO' | 'NO_ENCONTRADO'
  timestamp: string
  vehiculo?: string
  ordenVisita?: string
  ordenNumerico?: number
}

interface PaqueteClasificado {
  id: string
  trackingNumber: string
  vehiculo: string
  ordenNumerico: number
  ordenVisita: string
  escaneado: boolean
  escaneadoAt: string | null
  escaneadoPor: string | null
}

interface VehicleStats {
  vehiculo: string
  total: number
  escaneados: number
  pendientes: number
  porcentaje: number
}

interface PaginationInfo {
  page: number
  limit: number
  totalPages: number
  totalItems: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

interface ClasificacionStats {
  totalPaquetes: number
  paquetesEscaneados: number
  paquetesPendientes: number
  vehiculos: VehicleStats[]
}

interface FilterOption {
  value: string
  label: string
  count?: number
}

interface Stats {
  total: number
  escaneados: number
  pendientes: number
  porcentaje: number
}

interface StatsResponse {
  stats: Stats
  vehiculos: VehicleStats[]
  totalVehiculos: number
}

export default function EscaneoClasificacionStep({ clasificacionId, shipmentId, isReadOnly = false }: EscaneoClasificacionStepProps) {
  const router = useRouter()
  const [scanning, setScanning] = useState(false)
  const [scannedPackages, setScannedPackages] = useState<ScanResult[]>([])
  const [currentScan, setCurrentScan] = useState('')
  const [error, setError] = useState('')
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null)
  const [showFlash, setShowFlash] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [vehicleStats, setVehicleStats] = useState<VehicleStats[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingPaquetes, setLoadingPaquetes] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [finalizing, setFinalizing] = useState(false)
  const [paquetesClasificados, setPaquetesClasificados] = useState<PaqueteClasificado[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [clasificacionStats, setClasificacionStats] = useState<ClasificacionStats | null>(null)
  const [vehicleOptions, setVehicleOptions] = useState<FilterOption[]>([])
  const [scannedOptions, setScannedOptions] = useState<FilterOption[]>([])

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [vehicleFilter, setVehicleFilter] = useState('')
  const [scannedFilter, setScannedFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(50) // Fixed page size for better performance
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchStats()
    if (isReadOnly) {
      fetchPaquetesClasificados(currentPage, searchTerm, vehicleFilter, scannedFilter)
    }
  }, [isReadOnly, currentPage, searchTerm, vehicleFilter, scannedFilter])

  useEffect(() => {
    if (scanning && inputRef.current) {
      inputRef.current.focus()
    }
  }, [scanning])

  // Event listeners para ocultar el flash con teclado o mouse
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const handleKeyDown = (e: KeyboardEvent) => {
      if (showFlash) {
        setShowFlash(false)
        setLastScanResult(null)
        // Limpiar y enfocar input después de ocultar flash
        setCurrentScan('')
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }
    }

    const handleClick = (e: MouseEvent) => {
      if (showFlash) {
        setShowFlash(false)
        setLastScanResult(null)
        // Limpiar y enfocar input después de ocultar flash
        setCurrentScan('')
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }
    }

    const handleAutoHide = () => {
      if (showFlash) {
        setShowFlash(false)
        setLastScanResult(null)
        // Limpiar y enfocar input después de ocultar flash
        setCurrentScan('')
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }
    }

    if (showFlash) {
      document.addEventListener('keydown', handleKeyDown)
      document.addEventListener('click', handleClick)
      // Auto-ocultar después de 3 segundos para errores
      if (lastScanResult && (lastScanResult.status === 'YA_ESCANEADO' || lastScanResult.status === 'NO_ENCONTRADO')) {
        timeoutId = setTimeout(handleAutoHide, 3000)
      }
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        document.removeEventListener('click', handleClick)
        if (timeoutId) clearTimeout(timeoutId)
      }
    }
  }, [showFlash, lastScanResult])

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/vms/clasificacion/${clasificacionId}/stats`)
      if (response.ok) {
        const data: StatsResponse = await response.json()
        setStats(data.stats)
        setVehicleStats(data.vehiculos)
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchPaquetesClasificados = async (page = 1, search = '', vehicle = '', scanned = '') => {
    setLoadingPaquetes(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...(search && { search }),
        ...(vehicle && { vehicle }),
        ...(scanned && { scanned })
      })

      const response = await fetch(`/api/vms/clasificacion/${clasificacionId}/paquetes?${params}`)
      if (response.ok) {
        const data = await response.json()
        setPaquetesClasificados(data.paquetes)
        setPagination(data.pagination)
        setClasificacionStats(data.stats)

        // Update filter options
        const vehicleOpts = data.stats.vehiculos.map((v: VehicleStats) => ({
          value: v.vehiculo,
          label: v.vehiculo,
          count: v.total
        }))
        setVehicleOptions(vehicleOpts)

        const scannedOpts = [
          { value: 'true', label: 'Escaneado', count: data.stats.paquetesEscaneados },
          { value: 'false', label: 'Pendiente', count: data.stats.paquetesPendientes }
        ]
        setScannedOptions(scannedOpts)
      }
    } catch (err) {
      console.error('Error fetching paquetes clasificados:', err)
    } finally {
      setLoadingPaquetes(false)
    }
  }

  const handleScan = async (trackingNumber: string) => {
    if (!trackingNumber.trim()) return

    // Ocultar flash del escaneo anterior
    setShowFlash(false)
    setError('')

    try {
      const response = await fetch('/api/vms/clasificacion/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clasificacionId,
          trackingNumber: trackingNumber.trim()
        })
      })

      const result = await response.json()

      const scanResult: ScanResult = {
        trackingNumber: trackingNumber.trim(),
        status: result.status,
        timestamp: new Date().toISOString(),
        vehiculo: result.data?.vehiculo,
        ordenVisita: result.data?.ordenVisita,
        ordenNumerico: result.data?.ordenNumerico
      }

      setScannedPackages(prev => [scanResult, ...prev])
      setLastScanResult(scanResult)
      setShowFlash(true)
      setCurrentScan('')

      // Actualizar estadísticas generales
      if (result.status === 'CLASIFICADO' && stats) {
        setStats({
          ...stats,
          escaneados: stats.escaneados + 1,
          pendientes: stats.pendientes - 1,
          porcentaje: Math.round(((stats.escaneados + 1) / stats.total) * 100)
        })

        // Actualizar estadísticas de vehículo
        if (scanResult.vehiculo) {
          setVehicleStats(prevVehicleStats => 
            prevVehicleStats.map(v => {
              if (v.vehiculo === scanResult.vehiculo) {
                const newEscaneados = v.escaneados + 1
                const newPendientes = v.pendientes - 1
                return {
                  ...v,
                  escaneados: newEscaneados,
                  pendientes: newPendientes,
                  porcentaje: Math.round((newEscaneados / v.total) * 100)
                }
              }
              return v
            })
          )
        }
      }

    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentScan.trim()) {
      handleScan(currentScan)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const response = await fetch(`/api/vms/clasificacion/${clasificacionId}/export`)
      if (!response.ok) throw new Error('Error al exportar')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `clasificacion_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      alert('Error al exportar: ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1) // Reset to first page when searching
  }

  const handleVehicleFilterChange = (value: string) => {
    setVehicleFilter(value)
    setCurrentPage(1) // Reset to first page when filtering
  }

  const handleScannedFilterChange = (value: string) => {
    setScannedFilter(value)
    setCurrentPage(1) // Reset to first page when filtering
  }

  const handleFinalize = async () => {
    if (!confirm('¿Finalizar la clasificación? No podrás escanear más paquetes después de esto.')) {
      return
    }

    setFinalizing(true)
    try {
      const response = await fetch(`/api/vms/clasificacion/${clasificacionId}/finalize`, {
        method: 'POST'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al finalizar')
      }

      const result = await response.json()
      alert(`Clasificación finalizada correctamente!\n\nEscaneados: ${result.stats.escaneados} de ${result.stats.totalPaquetes} (${result.stats.porcentaje}%)`)
      router.push('/vms')
    } catch (err: any) {
      alert('Error al finalizar: ' + err.message)
    } finally {
      setFinalizing(false)
    }
  }

  // Contar solo tracking numbers únicos - cada uno cuenta una sola vez según su PRIMER estado
  const trackingUnicos = scannedPackages.reduce((acc, scan) => {
    // Solo agregar si este tracking number no ha sido procesado antes
    if (!acc.has(scan.trackingNumber)) {
      acc.set(scan.trackingNumber, scan)
    }
    return acc
  }, new Map<string, ScanResult>())

  const scansUnicos = Array.from(trackingUnicos.values())
  const clasificados = scansUnicos.filter(p => p.status === 'CLASIFICADO').length
  const yaEscaneados = scansUnicos.filter(p => p.status === 'YA_ESCANEADO').length
  const noEncontrados = scansUnicos.filter(p => p.status === 'NO_ENCONTRADO').length

  return (
    <div className="p-8">
      {/* Flash Overlay */}
      {showFlash && lastScanResult && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity ${
          lastScanResult.status === 'CLASIFICADO' ? 'bg-green-500' :
          lastScanResult.status === 'YA_ESCANEADO' ? 'bg-yellow-500' :
          'bg-red-500'
        } bg-opacity-95 text-white`}>
          <div className="text-center max-w-2xl px-4 sm:px-8">
            <div className="mb-2 sm:mb-4 md:mb-6">
              {lastScanResult.status === 'CLASIFICADO' && <CheckCircle className="h-16 w-16 sm:h-24 sm:w-24 md:h-40 md:w-40 mx-auto animate-bounce" />}
              {lastScanResult.status === 'YA_ESCANEADO' && <AlertTriangle className="h-16 w-16 sm:h-24 sm:w-24 md:h-40 md:w-40 mx-auto animate-pulse" />}
              {lastScanResult.status === 'NO_ENCONTRADO' && <XCircle className="h-16 w-16 sm:h-24 sm:w-24 md:h-40 md:w-40 mx-auto animate-pulse" />}
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-7xl font-bold mb-2 sm:mb-4 md:mb-6 drop-shadow-lg">
              {lastScanResult.status === 'CLASIFICADO' ? 'CLASIFICADO ✓' :
               lastScanResult.status === 'YA_ESCANEADO' ? 'YA ESCANEADO' :
               'NO ENCONTRADO'}
            </h1>
            <p className="text-xl sm:text-2xl md:text-4xl font-semibold mb-2 sm:mb-4 font-mono">
              {lastScanResult.trackingNumber}
            </p>
            {(lastScanResult.status === 'CLASIFICADO' || lastScanResult.status === 'YA_ESCANEADO') && (
              <div className={`mt-4 sm:mt-6 md:mt-8 space-y-2 sm:space-y-4 md:space-y-6 rounded-xl p-2 sm:p-4 md:p-8 backdrop-blur-sm border-2 border-white ${
                lastScanResult.status === 'CLASIFICADO' ? 'bg-green-800 bg-opacity-40' : 'bg-yellow-800 bg-opacity-40'
              }`}>
                <div className="flex flex-col sm:flex-row items-center justify-center text-xl sm:text-2xl md:text-4xl font-bold text-white drop-shadow-lg">
                  <Truck className="h-6 w-6 sm:h-8 sm:w-8 md:h-12 md:w-12 mb-1 sm:mb-2 md:mb-0 sm:mr-2 md:mr-4" />
                  <span>Vehículo: {lastScanResult.vehiculo}</span>
                </div>
                <div className="flex flex-col items-center justify-center space-y-1 sm:space-y-2">
                  <div className="flex flex-col sm:flex-row items-center text-xl sm:text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                    <MapPin className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 mb-1 sm:mb-2 md:mb-0 sm:mr-2 md:mr-4" />
                    <span>Orden de Visita:</span>
                  </div>
                  <p className="text-3xl sm:text-6xl md:text-9xl font-black text-yellow-300 drop-shadow-2xl">
                    #{lastScanResult.ordenNumerico}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 space-y-4 lg:space-y-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {isReadOnly ? 'Clasificación Finalizada' : 'Escaneo de Clasificación'}
            </h2>
            <p className="text-gray-600 mt-1">
              {isReadOnly 
                ? 'Visualiza los paquetes clasificados y exporta el reporte'
                : 'Escanea los paquetes para confirmar vehículo y orden de entrega'}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 w-full sm:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting ? 'Exportando...' : 'Exportar Excel'}
            </button>
            
            <button
              onClick={() => router.push('/vms')}
              className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors w-full sm:w-auto"
            >
              <span className="hidden sm:inline">Volver a VMS</span>
              <span className="sm:hidden">Volver</span>
            </button>
          </div>
        </div>

        {/* Tabla de Detalle de Escaneo */}
        {isReadOnly && (
          <div className="mt-8 space-y-6">
            {/* Estadísticas */}
            {clasificacionStats && (
              <ClasificacionStats
                totalPaquetes={clasificacionStats.totalPaquetes}
                paquetesEscaneados={clasificacionStats.paquetesEscaneados}
                paquetesPendientes={clasificacionStats.paquetesPendientes}
                vehiculos={clasificacionStats.vehiculos}
              />
            )}

            {/* Tabla */}
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
                    {pagination?.totalItems || 0}
                  </span>
                  Detalle de Escaneo
                </h3>
                <p className="text-sm text-gray-600 mt-1">Paquetes clasificados en este lote</p>
              </div>

              {/* Filtros */}
              <TableFilters
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                vehicleFilter={vehicleFilter}
                onVehicleFilterChange={handleVehicleFilterChange}
                scannedFilter={scannedFilter}
                onScannedFilterChange={handleScannedFilterChange}
                vehicleOptions={vehicleOptions}
                scannedOptions={scannedOptions}
                totalResults={pagination?.totalItems || 0}
              />

              {/* Tabla */}
              <div className="overflow-x-auto">
                {loadingPaquetes ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando paquetes...</p>
                  </div>
                ) : paquetesClasificados.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No se encontraron paquetes con los filtros aplicados</p>
                    {(searchTerm || vehicleFilter || scannedFilter) && (
                      <p className="text-sm mt-1">Intenta ajustar los filtros de búsqueda</p>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Vista móvil: tarjetas */}
                    <div className="block md:hidden space-y-3">
                      {paquetesClasificados.map((paquete) => (
                        <div key={paquete.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-mono font-semibold text-lg text-gray-900 truncate">{paquete.trackingNumber}</p>
                              <div className="flex items-center mt-2 space-x-2">
                                <span className="inline-flex items-center bg-blue-100 px-2 py-1 rounded text-xs font-medium text-blue-800">
                                  <Truck className="h-3 w-3 mr-1" />
                                  {paquete.vehiculo}
                                </span>
                                <span className="inline-flex items-center bg-orange-100 px-2 py-1 rounded text-xs font-medium text-orange-800">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  #{paquete.ordenNumerico}
                                </span>
                              </div>
                            </div>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              paquete.escaneado 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {paquete.escaneado ? 'Escaneado' : 'Pendiente'}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Fecha escaneo:</span>
                              <p className="mt-1">
                                {paquete.escaneadoAt 
                                  ? new Date(paquete.escaneadoAt).toLocaleString('es-AR', { 
                                      timeZone: 'America/Argentina/Buenos_Aires',
                                      year: 'numeric',
                                      month: '2-digit',
                                      day: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                  : '-'
                                }
                              </p>
                            </div>
                            <div>
                              <span className="font-medium">Escaneado por:</span>
                              <p className="mt-1">{paquete.escaneadoPor || '-'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Vista desktop: tabla */}
                    <div className="hidden md:block">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Vehículo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Orden
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tracking Number
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Escaneado
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Fecha Escaneo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Escaneado Por
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {paquetesClasificados.map((paquete) => (
                            <tr key={paquete.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {paquete.vehiculo}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                #{paquete.ordenNumerico}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                                {paquete.trackingNumber}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  paquete.escaneado 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {paquete.escaneado ? 'SÍ' : 'NO'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {paquete.escaneadoAt 
                                  ? new Date(paquete.escaneadoAt).toLocaleString('es-AR', { 
                                      timeZone: 'America/Argentina/Buenos_Aires',
                                      year: 'numeric',
                                      month: '2-digit',
                                      day: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                  : '-'
                                }
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {paquete.escaneadoPor || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>

              {/* Paginación */}
              {pagination && pagination.totalPages > 1 && (
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.totalItems}
                  itemsPerPage={pagination.limit}
                  onPageChange={handlePageChange}
                />
              )}
            </div>
          </div>
        )}

        {/* Start/Stop Scanning */}
        {!scanning ? (
          <button
            onClick={() => setScanning(true)}
            disabled={isReadOnly}
            className="w-full py-12 sm:py-16 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl shadow-2xl hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <Play className="h-16 w-16 sm:h-20 sm:w-20 mx-auto mb-4" />
            <span className="text-2xl sm:text-3xl font-bold">
              {isReadOnly ? 'CLASIFICACIÓN FINALIZADA' : 'INICIAR ESCANEO'}
            </span>
            {isReadOnly && (
              <p className="text-base sm:text-lg mt-2 opacity-90">No se pueden escanear más paquetes</p>
            )}
          </button>
        ) : (
          <div className="space-y-6">
            {/* Stats Progress Bar */}
            {stats && !loading && (
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700">Progreso General</span>
                  <span className="text-2xl font-bold text-orange-600">{stats.porcentaje}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-orange-600 h-4 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${stats.porcentaje}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-sm text-gray-600">
                  <span>{stats.escaneados} de {stats.total} escaneados</span>
                  <span>{stats.pendientes} pendientes</span>
                </div>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-500 rounded-xl p-4 sm:p-6 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-green-700 truncate">Clasificados</p>
                    <p className="text-3xl sm:text-4xl font-bold text-green-800 mt-2">{clasificados}</p>
                  </div>
                  <CheckCircle className="h-10 w-10 sm:h-14 sm:w-14 text-green-500 opacity-80 flex-shrink-0 ml-3" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-500 rounded-xl p-4 sm:p-6 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-yellow-700 truncate">Ya Escaneados</p>
                    <p className="text-3xl sm:text-4xl font-bold text-yellow-800 mt-2">{yaEscaneados}</p>
                  </div>
                  <AlertTriangle className="h-10 w-10 sm:h-14 sm:w-14 text-yellow-500 opacity-80 flex-shrink-0 ml-3" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-500 rounded-xl p-4 sm:p-6 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-red-700 truncate">No Encontrados</p>
                    <p className="text-3xl sm:text-4xl font-bold text-red-800 mt-2">{noEncontrados}</p>
                  </div>
                  <XCircle className="h-10 w-10 sm:h-14 sm:w-14 text-red-500 opacity-80 flex-shrink-0 ml-3" />
                </div>
              </div>
            </div>

            {/* Vehicle Progress Tracker - Contador por vehículo */}
            {vehicleStats.length > 0 && (
              <VehicleProgressTracker vehiculos={vehicleStats} />
            )}

            {/* Scan Input */}
            <div className="bg-white border-2 border-orange-500 rounded-xl p-4 sm:p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <ScanLine className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 mr-3" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Escanear Código</h3>
              </div>
              <input
                ref={inputRef}
                type="text"
                value={currentScan}
                onChange={(e) => setCurrentScan(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escanea el código de barras o ingresa manualmente..."
                className="w-full text-lg sm:text-2xl px-4 sm:px-6 py-3 sm:py-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-orange-300 focus:border-orange-500 transition-all font-mono"
                autoFocus
              />
              {error && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  {error}
                </p>
              )}
            </div>

            {/* Pause Button */}
            <button
              onClick={() => setScanning(false)}
              className="w-full py-3 sm:py-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center font-semibold"
            >
              <Pause className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Pausar Escaneo
            </button>

            {/* Finalize Button */}
            {!isReadOnly && (
              <button
                onClick={handleFinalize}
                disabled={finalizing}
                className="w-full py-3 sm:py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                {finalizing ? 'Finalizando...' : 'Finalizar Clasificación'}
              </button>
            )}

            {/* History */}
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
                    {scannedPackages.length}
                  </span>
                  Historial de Escaneos
                </h3>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {scannedPackages.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <ScanLine className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No hay escaneos todavía</p>
                    <p className="text-sm mt-1">Los resultados aparecerán aquí</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {scannedPackages.map((pkg, idx) => (
                      <div key={idx} className={`p-3 sm:p-4 hover:bg-gray-50 transition-colors border-l-4 ${
                        pkg.status === 'CLASIFICADO' ? 'border-l-green-500 bg-green-50/30' :
                        pkg.status === 'YA_ESCANEADO' ? 'border-l-yellow-500 bg-yellow-50/30' :
                        'border-l-red-500 bg-red-50/30'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-mono font-semibold text-base sm:text-lg text-gray-900 truncate">{pkg.trackingNumber}</p>
                            {pkg.status === 'CLASIFICADO' && (
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-700">
                                <span className="inline-flex items-center bg-white px-2 py-1 rounded-lg border border-gray-200">
                                  <Truck className="h-3 w-3 mr-1 text-orange-600" />
                                  <span className="hidden sm:inline">Vehículo </span>
                                  <strong className="ml-1">{pkg.vehiculo}</strong>
                                </span>
                                <span className="inline-flex items-center bg-white px-2 py-1 rounded-lg border border-gray-200">
                                  <MapPin className="h-3 w-3 mr-1 text-orange-600" />
                                  <span className="hidden sm:inline">Orden </span>
                                  <strong className="ml-1">#{pkg.ordenNumerico}</strong>
                                </span>
                              </div>
                            )}
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold flex-shrink-0 ml-2 ${
                            pkg.status === 'CLASIFICADO' ? 'bg-green-200 text-green-900' :
                            pkg.status === 'YA_ESCANEADO' ? 'bg-yellow-200 text-yellow-900' :
                            'bg-red-200 text-red-900'
                          }`}>
                            {pkg.status === 'CLASIFICADO' ? '✓ Clasificado' :
                             pkg.status === 'YA_ESCANEADO' ? '⚠ Ya escaneado' :
                             '✗ No encontrado'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(pkg.timestamp).toLocaleTimeString('es-AR', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            second: '2-digit' 
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            ℹ️ Estados de Escaneo
          </h4>
          <ul className="text-sm text-blue-700 space-y-2">
            <li className="flex items-start">
              <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-green-600" />
              <span><strong>CLASIFICADO:</strong> Paquete OK del lote y en archivo de clasificación</span>
            </li>
            <li className="flex items-start">
              <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-yellow-600" />
              <span><strong>YA ESCANEADO:</strong> Este paquete ya fue clasificado anteriormente</span>
            </li>
            <li className="flex items-start">
              <XCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-red-600" />
              <span><strong>NO ENCONTRADO:</strong> Paquete no está OK en el lote o no está en clasificación</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
