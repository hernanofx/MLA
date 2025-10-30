'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ScanLine, Truck, MapPin, CheckCircle, XCircle, AlertTriangle, Download, Play, Pause } from 'lucide-react'

interface EscaneoClasificacionStepProps {
  clasificacionId: string
  shipmentId: string
}

interface ScanResult {
  trackingNumber: string
  status: 'CLASIFICADO' | 'YA_ESCANEADO' | 'NO_ENCONTRADO'
  timestamp: string
  vehiculo?: string
  ordenVisita?: string
  ordenNumerico?: number
}

interface Stats {
  total: number
  escaneados: number
  pendientes: number
  porcentaje: number
}

export default function EscaneoClasificacionStep({ clasificacionId, shipmentId }: EscaneoClasificacionStepProps) {
  const router = useRouter()
  const [scanning, setScanning] = useState(false)
  const [scannedPackages, setScannedPackages] = useState<ScanResult[]>([])
  const [currentScan, setCurrentScan] = useState('')
  const [error, setError] = useState('')
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null)
  const [showFlash, setShowFlash] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    if (scanning && inputRef.current) {
      inputRef.current.focus()
    }
  }, [scanning])

  useEffect(() => {
    if (showFlash) {
      const timer = setTimeout(() => setShowFlash(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [showFlash])

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/vms/clasificacion/${clasificacionId}/stats`)
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleScan = async (trackingNumber: string) => {
    if (!trackingNumber.trim()) return

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

      // Actualizar estadísticas
      if (result.status === 'CLASIFICADO' && stats) {
        setStats({
          ...stats,
          escaneados: stats.escaneados + 1,
          pendientes: stats.pendientes - 1,
          porcentaje: Math.round(((stats.escaneados + 1) / stats.total) * 100)
        })
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

  const clasificados = scannedPackages.filter(p => p.status === 'CLASIFICADO').length
  const yaEscaneados = scannedPackages.filter(p => p.status === 'YA_ESCANEADO').length
  const noEncontrados = scannedPackages.filter(p => p.status === 'NO_ENCONTRADO').length

  return (
    <div className="p-8">
      {/* Flash Overlay */}
      {showFlash && lastScanResult && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity ${
          lastScanResult.status === 'CLASIFICADO' ? 'bg-green-500' :
          lastScanResult.status === 'YA_ESCANEADO' ? 'bg-yellow-500' :
          'bg-red-500'
        } bg-opacity-95 text-white`}>
          <div className="text-center max-w-2xl px-8">
            <div className="mb-6">
              {lastScanResult.status === 'CLASIFICADO' && <CheckCircle className="h-40 w-40 mx-auto animate-bounce" />}
              {lastScanResult.status === 'YA_ESCANEADO' && <AlertTriangle className="h-40 w-40 mx-auto animate-pulse" />}
              {lastScanResult.status === 'NO_ENCONTRADO' && <XCircle className="h-40 w-40 mx-auto animate-pulse" />}
            </div>
            <h1 className="text-7xl font-bold mb-6 drop-shadow-lg">
              {lastScanResult.status === 'CLASIFICADO' ? 'CLASIFICADO ✓' :
               lastScanResult.status === 'YA_ESCANEADO' ? 'YA ESCANEADO' :
               'NO ENCONTRADO'}
            </h1>
            <p className="text-4xl font-semibold mb-4 font-mono">
              {lastScanResult.trackingNumber}
            </p>
            {lastScanResult.status === 'CLASIFICADO' && (
              <div className="mt-8 space-y-4 bg-white bg-opacity-20 rounded-xl p-6 backdrop-blur-sm">
                <div className="flex items-center justify-center text-3xl font-bold">
                  <Truck className="h-10 w-10 mr-4" />
                  <span>Vehículo: {lastScanResult.vehiculo}</span>
                </div>
                <div className="flex items-center justify-center text-3xl font-bold">
                  <MapPin className="h-10 w-10 mr-4" />
                  <span>Orden: #{lastScanResult.ordenNumerico}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Escaneo de Clasificación
            </h2>
            <p className="text-gray-600 mt-1">
              Escanea los paquetes para confirmar vehículo y orden de entrega
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting ? 'Exportando...' : 'Exportar Excel'}
            </button>
            
            <button
              onClick={() => router.push('/vms')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Volver a VMS
            </button>
          </div>
        </div>

        {/* Start/Stop Scanning */}
        {!scanning ? (
          <button
            onClick={() => setScanning(true)}
            className="w-full py-16 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl shadow-2xl hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Play className="h-20 w-20 mx-auto mb-4" />
            <span className="text-3xl font-bold">INICIAR ESCANEO</span>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-500 rounded-xl p-6 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-green-700">Clasificados</p>
                    <p className="text-4xl font-bold text-green-800 mt-2">{clasificados}</p>
                  </div>
                  <CheckCircle className="h-14 w-14 text-green-500 opacity-80" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-500 rounded-xl p-6 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-yellow-700">Ya Escaneados</p>
                    <p className="text-4xl font-bold text-yellow-800 mt-2">{yaEscaneados}</p>
                  </div>
                  <AlertTriangle className="h-14 w-14 text-yellow-500 opacity-80" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-500 rounded-xl p-6 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-red-700">No Encontrados</p>
                    <p className="text-4xl font-bold text-red-800 mt-2">{noEncontrados}</p>
                  </div>
                  <XCircle className="h-14 w-14 text-red-500 opacity-80" />
                </div>
              </div>
            </div>

            {/* Scan Input */}
            <div className="bg-white border-2 border-orange-500 rounded-xl p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <ScanLine className="h-6 w-6 text-orange-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Escanear Código</h3>
              </div>
              <input
                ref={inputRef}
                type="text"
                value={currentScan}
                onChange={(e) => setCurrentScan(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escanea el código de barras o ingresa manualmente..."
                className="w-full text-2xl px-6 py-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-orange-300 focus:border-orange-500 transition-all font-mono"
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
              className="w-full py-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center font-semibold"
            >
              <Pause className="h-5 w-5 mr-2" />
              Pausar Escaneo
            </button>

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
                      <div key={idx} className={`p-4 hover:bg-gray-50 transition-colors border-l-4 ${
                        pkg.status === 'CLASIFICADO' ? 'border-l-green-500 bg-green-50/30' :
                        pkg.status === 'YA_ESCANEADO' ? 'border-l-yellow-500 bg-yellow-50/30' :
                        'border-l-red-500 bg-red-50/30'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-mono font-semibold text-lg text-gray-900">{pkg.trackingNumber}</p>
                            {pkg.status === 'CLASIFICADO' && (
                              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-700">
                                <span className="inline-flex items-center bg-white px-3 py-1 rounded-lg border border-gray-200">
                                  <Truck className="h-4 w-4 mr-1.5 text-orange-600" />
                                  Vehículo <strong className="ml-1">{pkg.vehiculo}</strong>
                                </span>
                                <span className="inline-flex items-center bg-white px-3 py-1 rounded-lg border border-gray-200">
                                  <MapPin className="h-4 w-4 mr-1.5 text-orange-600" />
                                  Orden <strong className="ml-1">#{pkg.ordenNumerico}</strong>
                                </span>
                              </div>
                            )}
                          </div>
                          <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
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
