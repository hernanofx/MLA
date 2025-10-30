'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Upload, ScanLine, Package, ArrowLeft } from 'lucide-react'
import UploadClasificacionStep from './UploadClasificacionStep'
import EscaneoClasificacionStep from './EscaneoClasificacionStep'

type Step = 'upload' | 'escaneo'

const STEPS = [
  {
    id: 'upload' as const,
    title: 'Archivo de Clasificación',
    description: 'Sube el archivo orden.xls con vehículos y orden de visita',
    icon: Upload
  },
  {
    id: 'escaneo' as const,
    title: 'Escaneo y Clasificación',
    description: 'Escanea paquetes para asignar vehículo y orden',
    icon: ScanLine
  }
]

export default function ClasificacionWizard() {
  const params = useParams()
  const router = useRouter()
  const shipmentId = params.shipmentId as string
  
  const [currentStep, setCurrentStep] = useState<Step>('upload')
  const [clasificacionId, setClasificacionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isReadOnly, setIsReadOnly] = useState(false)

  useEffect(() => {
    checkExistingClasificacion()
  }, [])

  const checkExistingClasificacion = async () => {
    try {
      const response = await fetch(`/api/vms/shipments/${shipmentId}/clasificacion`)
      if (response.ok) {
        const data = await response.json()
        if (data.clasificacion) {
          setClasificacionId(data.clasificacion.id)
          setCurrentStep('escaneo')
          setIsReadOnly(data.clasificacion.finalizado)
        }
      }
    } catch (error) {
      console.error('Error checking clasificacion:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUploadComplete = (id: string) => {
    setClasificacionId(id)
    setCurrentStep('escaneo')
  }

  const handleGoBack = () => {
    if (currentStep === 'escaneo') {
      if (confirm('¿Volver al paso anterior? Podrás continuar el escaneo después.')) {
        setCurrentStep('upload')
      }
    } else {
      router.push('/vms')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleGoBack}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {currentStep === 'upload' ? 'Volver a VMS' : 'Paso anterior'}
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Package className="h-10 w-10 mr-4 text-orange-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {isReadOnly ? 'Ver Clasificación de Paquetes' : 'Clasificación de Paquetes'}
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  {isReadOnly 
                    ? 'Visualización de clasificación finalizada' 
                    : 'Organiza la entrega de paquetes por vehículo y orden de visita'}
                </p>
              </div>
            </div>
            {isReadOnly && (
              <span className="inline-flex items-center px-4 py-2 rounded-lg bg-green-100 text-green-800 border-2 border-green-500 font-semibold">
                ✓ Finalizado
              </span>
            )}
          </div>
        </div>

        {/* Steps Progress */}
        <div className="mb-8">
          <nav aria-label="Progress">
            <ol className="flex items-center">
              {STEPS.map((step, stepIdx) => {
                const Icon = step.icon
                const isCurrent = currentStep === step.id
                const isCompleted = stepIdx < STEPS.findIndex(s => s.id === currentStep)
                
                return (
                  <li 
                    key={step.id} 
                    className={`${stepIdx !== STEPS.length - 1 ? 'flex-1 flex items-center' : ''}`}
                  >
                    <div className={`flex items-center px-6 py-4 text-sm font-medium rounded-lg transition-all ${
                      isCurrent ? 'bg-orange-50 border-2 border-orange-600 shadow-md' :
                      isCompleted ? 'bg-green-50 border-2 border-green-600' :
                      'bg-white border-2 border-gray-200'
                    }`}>
                      <div className="flex items-center min-w-0">
                        <Icon className={`h-6 w-6 mr-3 flex-shrink-0 ${
                          isCurrent ? 'text-orange-600' :
                          isCompleted ? 'text-green-600' :
                          'text-gray-400'
                        }`} />
                        <div className="min-w-0">
                          <p className={`font-semibold truncate ${
                            isCurrent ? 'text-orange-600' :
                            isCompleted ? 'text-green-600' :
                            'text-gray-500'
                          }`}>
                            {step.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{step.description}</p>
                        </div>
                      </div>
                    </div>
                    {stepIdx !== STEPS.length - 1 && (
                      <div className={`flex-1 h-1 mx-4 rounded ${
                        isCompleted ? 'bg-green-600' : 'bg-gray-200'
                      }`} />
                    )}
                  </li>
                )
              })}
            </ol>
          </nav>
        </div>

        {/* Step Content */}
        <div className="bg-white shadow-lg rounded-lg border border-gray-200">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando...</p>
            </div>
          ) : (
            <>
              {currentStep === 'upload' && !isReadOnly && (
                <UploadClasificacionStep 
                  shipmentId={shipmentId}
                  onComplete={handleUploadComplete}
                />
              )}
              {currentStep === 'escaneo' && clasificacionId && (
                <EscaneoClasificacionStep 
                  clasificacionId={clasificacionId}
                  shipmentId={shipmentId}
                  isReadOnly={isReadOnly}
                />
              )}
            </>
          )}
        </div>

        {/* Info Footer */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            ℹ️ Información del Proceso
          </h4>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>Solo se clasifican paquetes que están <strong>OK</strong> en el lote finalizado</li>
            <li>El archivo debe contener: Tracking (col B), Vehículo (col F), Orden (col AF)</li>
            <li>Los paquetes se ordenan automáticamente por vehículo y visita</li>
            <li>Puedes exportar el reporte completo al finalizar el escaneo</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
