'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/app/components/AppLayout'
import { Loader2, Package, Calendar, ArrowRight, Plus, RefreshCw } from 'lucide-react'
import { formatArgentinaDateTime } from '@/lib/date-utils'

interface ActiveShipment {
  id: string
  shipmentDate: string
  status: string
  createdAt: string
  _count: {
    scannedPackages: number
    preAlertas: number
    preRuteos: number
  }
}

export default function SelectShipmentPage() {
  const router = useRouter()
  const [shipments, setShipments] = useState<ActiveShipment[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchActiveShipments()
  }, [])

  const fetchActiveShipments = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)
      
      const response = await fetch('/api/vms/shipments/active')
      if (response.ok) {
        const data = await response.json()
        setShipments(data)
      } else {
        console.error('Error fetching shipments')
      }
    } catch (error) {
      console.error('Error fetching shipments:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleSelectShipment = (shipmentId: string) => {
    router.push(`/vms/scan/${shipmentId}`)
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PRE_ALERTA: 'bg-blue-100 text-blue-800',
      PRE_RUTEO: 'bg-purple-100 text-purple-800',
      VERIFICACION: 'bg-yellow-100 text-yellow-800',
      FINALIZADO: 'bg-green-100 text-green-800',
    }
    const labels: Record<string, string> = {
      PRE_ALERTA: 'Pre-Alerta',
      PRE_RUTEO: 'Pre-Ruteo',
      VERIFICACION: 'Verificación',
      FINALIZADO: 'Finalizado',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    )
  }

  const getProgress = (shipment: ActiveShipment) => {
    const total = shipment._count.preAlertas
    const scanned = shipment._count.scannedPackages
    return total > 0 ? Math.round((scanned / total) * 100) : 0
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto" />
            <p className="mt-4 text-gray-600">Cargando lotes...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Escanear Paquetes</h1>
            <p className="text-gray-600 mt-2">
              Selecciona un lote activo para comenzar a escanear
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => fetchActiveShipments(true)}
              disabled={refreshing}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            <button
              onClick={() => router.push('/vms/shipments/new')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Lote
            </button>
          </div>
        </div>

        {/* Shipments List */}
        {shipments.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay lotes activos
            </h3>
            <p className="text-gray-600 mb-6">
              Crea un nuevo lote para comenzar a escanear paquetes
            </p>
            <button
              onClick={() => router.push('/vms/shipments/new')}
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Crear Nuevo Lote
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {shipments.map((shipment) => {
              const progress = getProgress(shipment)
              return (
                <div
                  key={shipment.id}
                  onClick={() => handleSelectShipment(shipment.id)}
                  className="bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer overflow-hidden"
                >
                  {/* Header */}
                  <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Lote {formatArgentinaDateTime(shipment.shipmentDate).split(' ')[0]}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {formatArgentinaDateTime(shipment.createdAt)}
                        </p>
                      </div>
                      {getStatusBadge(shipment.status)}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Escaneados:</span>
                        <span className="text-lg font-bold text-indigo-600">
                          {shipment._count.scannedPackages}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Esperados:</span>
                        <span className="text-lg font-bold text-gray-900">
                          {shipment._count.preAlertas}
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-gray-600">Progreso</span>
                          <span className="text-xs font-semibold text-indigo-600">
                            {progress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-indigo-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelectShipment(shipment.id)
                      }}
                      className="w-full mt-6 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Escanear en este lote
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            💡 Escaneo Multi-Usuario
          </h3>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>Varios usuarios pueden escanear en el mismo lote simultáneamente</li>
            <li>Los paquetes duplicados son detectados automáticamente</li>
            <li>Las estadísticas se actualizan en tiempo real</li>
            <li>Solo se muestran lotes de las últimas 48 horas</li>
          </ul>
        </div>
      </div>
    </AppLayout>
  )
}
