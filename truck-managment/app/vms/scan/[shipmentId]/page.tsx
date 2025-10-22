'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppLayout from '@/app/components/AppLayout'
import VerificacionStep from '@/app/vms/shipments/new/VerificacionStep'
import { Loader2, ArrowLeft, Package, Calendar, AlertCircle } from 'lucide-react'
import { formatArgentinaDateTime } from '@/lib/date-utils'

interface ShipmentDetails {
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

export default function ScanShipmentPage() {
  const params = useParams()
  const router = useRouter()
  const shipmentId = params.shipmentId as string
  const [loading, setLoading] = useState(true)
  const [shipment, setShipment] = useState<ShipmentDetails | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (shipmentId) {
      fetchShipmentDetails()
    }
  }, [shipmentId])

  const fetchShipmentDetails = async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch(`/api/vms/shipments/${shipmentId}/report`)
      if (response.ok) {
        const data = await response.json()
        // Transformar datos del reporte a formato ShipmentDetails
        setShipment({
          id: shipmentId,
          shipmentDate: new Date().toISOString(), // Esto debería venir del reporte
          status: 'VERIFICACION',
          createdAt: new Date().toISOString(),
          _count: {
            scannedPackages: data.totalScanned || 0,
            preAlertas: (data.ok || 0) + (data.faltantes || 0),
            preRuteos: 0
          }
        })
      } else {
        setError('No se pudo cargar el lote')
      }
    } catch (error) {
      console.error('Error fetching shipment:', error)
      setError('Error al cargar el lote')
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = () => {
    router.push('/vms/scan')
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto" />
            <p className="mt-4 text-gray-600">Cargando lote...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (error || !shipment) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">
              {error || 'Lote no encontrado'}
            </h3>
            <button
              onClick={() => router.push('/vms/scan')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a lista de lotes
            </button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push('/vms/scan')}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a lista de lotes
        </button>

        {/* Shipment Info Card */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200 p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Package className="h-6 w-6 text-indigo-600" />
                <h1 className="text-2xl font-bold text-gray-900">
                  Lote {formatArgentinaDateTime(shipment.shipmentDate).split(' ')[0]}
                </h1>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <div>
                  <span className="text-sm text-gray-600">Creado:</span>
                  <p className="font-medium text-gray-900">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    {formatArgentinaDateTime(shipment.createdAt)}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Escaneados:</span>
                  <p className="text-xl font-bold text-indigo-600">
                    {shipment._count.scannedPackages}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Esperados:</span>
                  <p className="text-xl font-bold text-gray-900">
                    {shipment._count.preAlertas}
                  </p>
                </div>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              {shipment.status === 'VERIFICACION' ? 'En Verificación' : shipment.status}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Progreso de escaneo</span>
              <span className="text-sm font-semibold text-indigo-600">
                {shipment._count.preAlertas > 0
                  ? Math.round((shipment._count.scannedPackages / shipment._count.preAlertas) * 100)
                  : 0}%
              </span>
            </div>
            <div className="w-full bg-white rounded-full h-3 shadow-inner">
              <div
                className="bg-gradient-to-r from-indigo-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                style={{
                  width: `${
                    shipment._count.preAlertas > 0
                      ? Math.min(
                          (shipment._count.scannedPackages / shipment._count.preAlertas) * 100,
                          100
                        )
                      : 0
                  }%`
                }}
              />
            </div>
          </div>
        </div>

        {/* Verification Step Component */}
        <VerificacionStep
          shipmentId={shipmentId}
          onComplete={handleComplete}
        />

        {/* Multi-user Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
            <Package className="h-4 w-4 mr-2" />
            Escaneo Colaborativo Activo
          </h3>
          <p className="text-sm text-blue-700">
            Otros usuarios pueden estar escaneando en este mismo lote. Las estadísticas se actualizan automáticamente cada 5 segundos.
          </p>
        </div>
      </div>
    </AppLayout>
  )
}
