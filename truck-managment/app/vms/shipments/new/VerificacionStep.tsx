'use client'

import { useState, useEffect, useRef } from 'react'
import { ScanLine, CheckCircle2, AlertTriangle, XCircle, Clock, ArrowRight } from 'lucide-react'
import { formatArgentinaTime, getArgentinaDate } from '@/lib/date-utils'

interface VerificacionStepProps {
  shipmentId: string
  onComplete: (step: 'verificacion') => void
}

interface ScanResult {
  trackingNumber: string
  status: 'OK' | 'SOBRANTE' | 'FUERA_COBERTURA' | 'PREVIO' | 'YA_ESCANEADO' | 'NO_MLA'
  timestamp: string
  details?: any
}

export default function VerificacionStep({ shipmentId, onComplete }: VerificacionStepProps) {
  const [scanning, setScanning] = useState(false)
  const [scannedPackages, setScannedPackages] = useState<ScanResult[]>([])
  const [currentScan, setCurrentScan] = useState('')
  const [error, setError] = useState('')
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null)
  const [showFlash, setShowFlash] = useState(false)
  const [stats, setStats] = useState({
    ok: 0,
    sobrante: 0,
    fueraCobertura: 0,
    previo: 0,
  })
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Enfocar el input automáticamente para escaneo
    if (scanning && inputRef.current) {
      inputRef.current.focus()
    }
  }, [scanning])

  // 🔥 NUEVO: Polling para actualizar estadísticas cada 5 segundos cuando está escaneando
  useEffect(() => {
    if (!scanning) return

    const fetchUpdatedStats = async () => {
      try {
        const response = await fetch(`/api/vms/shipments/${shipmentId}/report`)
        if (response.ok) {
          const data = await response.json()
          // Actualizar solo las estadísticas, no los paquetes escaneados localmente
          const newStats = {
            ok: data.ok || 0,
            sobrante: data.sobrante || 0,
            fueraCobertura: data.fueraCobertura || 0,
            previo: data.previo || 0,
          }
          
          // Solo actualizar si hay cambios para evitar re-renders innecesarios
          if (JSON.stringify(newStats) !== JSON.stringify(stats)) {
            setStats(newStats)
          }
        }
      } catch (error) {
        console.error('Error refreshing stats:', error)
      }
    }

    // Ejecutar inmediatamente y luego cada 5 segundos
    fetchUpdatedStats()
    const interval = setInterval(fetchUpdatedStats, 5000)

    return () => clearInterval(interval)
  }, [scanning, shipmentId])

  // Event listener para ocultar el fullscreen con cualquier tecla
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showFlash) {
        setShowFlash(false)
        setLastScanResult(null)
      }
    }

    if (showFlash) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showFlash])

  const handleScan = async (trackingNumber: string) => {
    if (!trackingNumber.trim()) return

    setError('')
    
    try {
      const response = await fetch('/api/vms/verification/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipmentId,
          trackingNumber: trackingNumber.trim(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        
        // Manejar errores especiales con mensajes full screen
        if (error.error === 'PAQUETE_YA_ESCANEADO') {
          const scanResult: ScanResult = {
            trackingNumber: trackingNumber.trim(),
            status: 'YA_ESCANEADO',
            timestamp: getArgentinaDate().toISOString(),
          }
          setLastScanResult(scanResult)
          setShowFlash(true)
          setCurrentScan('')
          return
        }
        
        if (error.error === 'PAQUETE_NO_MLA') {
          const scanResult: ScanResult = {
            trackingNumber: trackingNumber.trim(),
            status: 'NO_MLA',
            timestamp: getArgentinaDate().toISOString(),
          }
          setLastScanResult(scanResult)
          setShowFlash(true)
          setCurrentScan('')
          return
        }
        
        throw new Error(error.error || 'Error al escanear')
      }

      const result = await response.json()
      
      // Agregar al historial
      const scanResult: ScanResult = {
        trackingNumber: trackingNumber.trim(),
        status: result.status,
        timestamp: getArgentinaDate().toISOString(),
        details: result.details,
      }
      
      setScannedPackages(prev => [scanResult, ...prev])
      
      // Actualizar estadísticas (no contar PREVIO en el total)
      if (result.status !== 'PREVIO') {
        setStats(prev => ({
          ...prev,
          [result.status.toLowerCase()]: prev[result.status.toLowerCase() as keyof typeof prev] + 1,
        }))
      } else {
        setStats(prev => ({
          ...prev,
          previo: prev.previo + 1,
        }))
      }

      // Mostrar mensaje flash grande persistente
      setLastScanResult(scanResult)
      setShowFlash(true)
      // No ocultar automáticamente - permanece hasta siguiente escaneo o tecla presionada

      // Limpiar input
      setCurrentScan('')
      
    } catch (error: any) {
      setError(error.message)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCurrentScan(value)
    
    // Si detecta un Enter o el scanner envía automáticamente
    if (value.includes('\n') || value.includes('\r')) {
      const cleanValue = value.replace(/[\n\r]/g, '').trim()
      if (cleanValue) {
        handleScan(cleanValue)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleScan(currentScan)
    }
  }

  const handleFinalize = async () => {
    try {
      const response = await fetch('/api/vms/verification/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentId }),
      })

      if (!response.ok) {
        throw new Error('Error al finalizar verificación')
      }

      onComplete('verificacion')
    } catch (error: any) {
      setError(error.message)
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      OK: 'bg-green-100 text-green-800 border-green-200',
      SOBRANTE: 'bg-red-100 text-red-800 border-red-200',
      FUERA_COBERTURA: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      PREVIO: 'bg-blue-100 text-blue-800 border-blue-200',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
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
        return null
    }
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      OK: 'OK - En ambos archivos',
      SOBRANTE: 'Sobrante - No está en ninguno',
      FUERA_COBERTURA: 'Fuera de Cobertura',
      PREVIO: 'Previo - Paquete anterior',
    }
    return labels[status as keyof typeof labels] || status
  }

  return (
    <div className="space-y-6">
      {/* Flash Message Full Screen */}
      {showFlash && lastScanResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 animate-fade-in">
          <div className={`text-center transform scale-110 animate-bounce-once ${
            lastScanResult.status === 'OK' ? 'text-green-400' :
            lastScanResult.status === 'SOBRANTE' ? 'text-red-400' :
            lastScanResult.status === 'FUERA_COBERTURA' ? 'text-yellow-400' :
            lastScanResult.status === 'YA_ESCANEADO' ? 'text-orange-400' :
            lastScanResult.status === 'NO_MLA' ? 'text-purple-400' :
            'text-blue-400'
          }`}>
            <div className="mb-8">
              {lastScanResult.status === 'OK' && <CheckCircle2 className="h-48 w-48 mx-auto" />}
              {lastScanResult.status === 'SOBRANTE' && <XCircle className="h-48 w-48 mx-auto" />}
              {lastScanResult.status === 'FUERA_COBERTURA' && <AlertTriangle className="h-48 w-48 mx-auto" />}
              {lastScanResult.status === 'PREVIO' && <Clock className="h-48 w-48 mx-auto" />}
              {lastScanResult.status === 'YA_ESCANEADO' && <AlertTriangle className="h-48 w-48 mx-auto" />}
              {lastScanResult.status === 'NO_MLA' && <XCircle className="h-48 w-48 mx-auto" />}
            </div>
            <h1 className="text-8xl font-bold mb-6">
              {lastScanResult.status === 'YA_ESCANEADO' ? 'PAQUETE YA ESCANEADO' :
               lastScanResult.status === 'NO_MLA' ? 'PAQUETE NO DE MLA' :
               lastScanResult.status}
            </h1>
            <p className="text-4xl font-semibold mb-4">
              {lastScanResult.trackingNumber}
            </p>
            {lastScanResult.status === 'OK' && lastScanResult.details && (
              <div className="text-2xl text-white space-y-4 mt-8">
                {lastScanResult.details.preRuteo && (
                  <p className="text-6xl font-bold text-yellow-300">
                    � RUTA: {lastScanResult.details.preRuteo.ruta || 'N/A'}
                  </p>
                )}
                {lastScanResult.details.preRuteo && lastScanResult.details.preRuteo.chofer && (
                  <p className="text-3xl">
                    Chofer: {lastScanResult.details.preRuteo.chofer}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scanner Input */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 border-2 border-indigo-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <ScanLine className="h-6 w-6 text-indigo-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">
              {scanning ? 'Escaneando...' : 'Listo para escanear'}
            </h3>
          </div>
          {!scanning && (
            <button
              onClick={() => setScanning(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Iniciar Escaneo
            </button>
          )}
        </div>

        {scanning && (
          <div>
            <input
              ref={inputRef}
              type="text"
              value={currentScan}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Escanea o ingresa el tracking number..."
              className="w-full px-4 py-3 text-lg border-2 border-indigo-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              autoFocus
            />
            <p className="text-sm text-gray-600 mt-2">
              Presiona Enter después de ingresar el número o usa el lector de códigos
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3 flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">OK</p>
              <p className="text-2xl font-bold text-green-600">{stats.ok}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white border-2 border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sobrantes</p>
              <p className="text-2xl font-bold text-red-600">{stats.sobrante}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-400" />
          </div>
        </div>

        <div className="bg-white border-2 border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Fuera Cobertura</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.fueraCobertura}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-white border-2 border-blue-200 rounded-lg p-4 opacity-75">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Previos (no cuenta)</p>
              <p className="text-2xl font-bold text-blue-600">{stats.previo}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Scanned History */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-900">
            Paquetes Escaneados ({scannedPackages.length})
          </h3>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {scannedPackages.length === 0 ? (
            <div className="text-center py-12">
              <ScanLine className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">
                No hay paquetes escaneados aún
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {scannedPackages.map((scan, index) => (
                <li key={index} className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className={`p-2 rounded-full ${getStatusColor(scan.status)}`}>
                        {getStatusIcon(scan.status)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {scan.trackingNumber}
                        </p>
                        <p className={`text-xs ${getStatusColor(scan.status).split(' ')[1]}`}>
                          {getStatusLabel(scan.status)}
                        </p>
                        
                        {/* Mostrar datos de ruta si es OK */}
                        {scan.status === 'OK' && scan.details && (
                          <div className="mt-2 pl-4 border-l-2 border-green-300 space-y-1">
                            {scan.details.preAlerta && (
                              <div className="text-xs text-gray-600">
                                <span className="font-medium text-green-700">📦 Pre-Alerta:</span> {scan.details.preAlerta.buyer} • {scan.details.preAlerta.city} • {(scan.details.preAlerta.weight / 1000).toFixed(2)}kg
                              </div>
                            )}
                            {scan.details.preRuteo && (
                              <div className="text-xs text-gray-600">
                                <span className="font-medium text-blue-700">🚚 Pre-Ruteo:</span> 
                                {scan.details.preRuteo.ruta && <span className="font-semibold"> Ruta {scan.details.preRuteo.ruta}</span>}
                                {scan.details.preRuteo.chofer && <span> • {scan.details.preRuteo.chofer}</span>}
                                {scan.details.preRuteo.razonSocial && <span> • {scan.details.preRuteo.razonSocial}</span>}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatArgentinaTime(scan.timestamp)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Finalize Button */}
      {scannedPackages.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleFinalize}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Finalizar Escaneo
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          Instrucciones de Escaneo
        </h4>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li><strong>OK:</strong> El paquete está en ambos archivos (Pre-Alerta y Pre-Ruteo)</li>
          <li><strong>Sobrante:</strong> No está en ninguno de los dos archivos</li>
          <li><strong>Fuera de Cobertura:</strong> Está en Pre-Alerta pero NO en Pre-Ruteo</li>
          <li><strong>Previo:</strong> Está en Pre-Ruteo pero NO en Pre-Alerta (no se cuenta en el total)</li>
          <li className="mt-2"><strong className="text-orange-700">Paquetes duplicados:</strong> Ya fueron escaneados en este lote</li>
          <li><strong className="text-purple-700">Paquetes no MLA:</strong> Solo se aceptan paquetes MLAR, SEKA o RR</li>
        </ul>
      </div>
    </div>
  )
}
