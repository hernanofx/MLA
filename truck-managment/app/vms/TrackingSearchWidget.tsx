'use client'

import { useState } from 'react'
import { Search, Package, Truck, Calendar, MapPin, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface TrackingSearchResult {
  found: boolean
  message?: string
  trackingNumber?: string
  lote?: {
    id: string
    fecha: string
    fechaFormateada: string
  }
  transporte?: {
    vehiculo: string
    orden: number
    ordenVisita: string
  }
  proveedor?: string
  clasificacion?: {
    id: string
    uploadedAt: string
    finalizado: boolean
  }
  escaneo?: {
    escaneado: boolean
    escaneadoAt: string | null
    escaneadoPor: string | null
  }
}

export default function TrackingSearchWidget() {
  const [trackingNumber, setTrackingNumber] = useState('')
  const [searching, setSearching] = useState(false)
  const [result, setResult] = useState<TrackingSearchResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!trackingNumber.trim()) {
      setError('Ingresa un tracking number')
      return
    }

    setSearching(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(`/api/vms/search-tracking?tracking=${encodeURIComponent(trackingNumber.trim())}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al buscar tracking')
      }

      const data = await response.json()
      setResult(data)
      
      if (!data.found) {
        setError(data.message || 'Tracking number no encontrado')
      }
    } catch (err: any) {
      setError(err.message || 'Error al buscar tracking number')
      setResult(null)
    } finally {
      setSearching(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(e as any)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-6 py-5">
        <div className="flex items-center mb-4">
          <Search className="h-5 w-5 text-indigo-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">
            Buscar Tracking Number
          </h2>
        </div>

        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ej: MLAR123456"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              disabled={searching}
            />
            <button
              type="submit"
              disabled={searching || !trackingNumber.trim()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {searching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Success result */}
        {result && result.found && (
          <div className="space-y-4">
            {/* Header con tracking */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Package className="h-6 w-6 text-indigo-600 mr-3" />
                  <div>
                    <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide">
                      Tracking Number
                    </p>
                    <p className="text-lg font-bold text-gray-900 font-mono">
                      {result.trackingNumber}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-1" />
                  <span className="text-sm font-medium text-green-700">
                    Encontrado
                  </span>
                </div>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Lote */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-gray-600 mr-3 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                      Lote
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {result.lote?.fechaFormateada}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      ID: {result.lote?.id.substring(0, 8)}...
                    </p>
                  </div>
                </div>
              </div>

              {/* Transporte */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-start">
                  <Truck className="h-5 w-5 text-gray-600 mr-3 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                      Transporte
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {result.transporte?.vehiculo}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Orden de visita: #{result.transporte?.orden}
                    </p>
                  </div>
                </div>
              </div>

              {/* Proveedor */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-600 mr-3 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                      Proveedor
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {result.proveedor}
                    </p>
                  </div>
                </div>
              </div>

              {/* Estado de Escaneo */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-start">
                  {result.escaneo?.escaneado ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-orange-600 mr-3 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                      Estado de Escaneo
                    </p>
                    <p className={`text-sm font-semibold ${
                      result.escaneo?.escaneado ? 'text-green-700' : 'text-orange-700'
                    }`}>
                      {result.escaneo?.escaneado ? 'Escaneado' : 'Pendiente de Escaneo'}
                    </p>
                    {result.escaneo?.escaneado && result.escaneo.escaneadoAt && (
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(result.escaneo.escaneadoAt).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Clasificación info */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>
                  Clasificación: {result.clasificacion?.finalizado ? 'Finalizada' : 'En progreso'}
                </span>
                <span>
                  Cargado: {new Date(result.clasificacion?.uploadedAt || '').toLocaleDateString('es-AR')}
                </span>
              </div>
            </div>

            {/* Ver detalle del lote */}
            <div className="pt-2">
              <a
                href={`/vms/shipments/${result.lote?.id}`}
                className="inline-flex items-center justify-center w-full px-4 py-2 border border-indigo-600 text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 transition-colors"
              >
                Ver Detalle del Lote
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
