'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import AppLayout from '@/app/components/AppLayout'
import { CheckCircle2, Upload, ScanLine, FileText, ArrowLeft } from 'lucide-react'
import PreAlertaStep from './PreAlertaStep'
import PreRuteoStep from './PreRuteoStep'
import VerificacionStep from './VerificacionStep'
import ReporteStep from './ReporteStep'

type WizardStep = 'pre-alerta' | 'pre-ruteo' | 'verificacion' | 'reporte'

interface StepConfig {
  id: WizardStep
  title: string
  description: string
  icon: any
}

const steps: StepConfig[] = [
  {
    id: 'pre-alerta',
    title: 'Pre-Alerta',
    description: 'Carga el archivo Excel con las pre-alertas de paquetes',
    icon: Upload
  },
  {
    id: 'pre-ruteo',
    title: 'Pre-Ruteo',
    description: 'Carga el archivo Excel con el ruteo planificado',
    icon: Upload
  },
  {
    id: 'verificacion',
    title: 'Verificación',
    description: 'Escanea los paquetes para verificar coincidencias',
    icon: ScanLine
  },
  {
    id: 'reporte',
    title: 'Reporte Final',
    description: 'Revisa y descarga el reporte de verificación',
    icon: FileText
  }
]

export default function NewShipmentWizard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<WizardStep>('pre-alerta')
  const [shipmentId, setShipmentId] = useState<string | null>(null)
  const [completedSteps, setCompletedSteps] = useState<Set<WizardStep>>(new Set())

  const currentStepIndex = steps.findIndex(s => s.id === currentStep)

  const handleStepComplete = (step: WizardStep, data?: any) => {
    setCompletedSteps(prev => new Set([...prev, step]))
    
    // Si completamos pre-alerta, guardamos el shipmentId
    if (step === 'pre-alerta' && data?.shipmentId) {
      setShipmentId(data.shipmentId)
    }
    
    // Avanzar al siguiente paso
    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id)
    }
  }

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id)
    } else {
      router.push('/vms')
    }
  }

  const renderStepContent = () => {
    if (!shipmentId && currentStep !== 'pre-alerta') {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">Por favor completa el paso de Pre-Alerta primero</p>
        </div>
      )
    }

    switch (currentStep) {
      case 'pre-alerta':
        return <PreAlertaStep onComplete={handleStepComplete} />
      case 'pre-ruteo':
        return <PreRuteoStep shipmentId={shipmentId!} onComplete={handleStepComplete} />
      case 'verificacion':
        return <VerificacionStep shipmentId={shipmentId!} onComplete={handleStepComplete} />
      case 'reporte':
        return <ReporteStep shipmentId={shipmentId!} />
      default:
        return null
    }
  }

  return (
    <AppLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </button>
          <h1 className="text-3xl font-semibold text-gray-900">Nuevo Lote</h1>
          <p className="mt-2 text-sm text-gray-600">
            Sigue los pasos para registrar y verificar un nuevo lote
          </p>
        </div>

        {/* Progress Steps */}
        <nav aria-label="Progress" className="mb-8">
          <ol className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isCompleted = completedSteps.has(step.id)
              const isCurrent = step.id === currentStep
              const isAccessible = index === 0 || completedSteps.has(steps[index - 1].id)

              return (
                <li key={step.id} className="relative flex-1">
                  {index !== 0 && (
                    <div className="absolute left-0 top-5 -ml-px h-0.5 w-full bg-gray-200">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          isCompleted ? 'bg-indigo-600' : 'bg-gray-200'
                        }`}
                        style={{ width: isCompleted ? '100%' : '0%' }}
                      />
                    </div>
                  )}
                  
                  <div className="group relative flex flex-col items-center">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                        isCompleted
                          ? 'border-indigo-600 bg-indigo-600'
                          : isCurrent
                          ? 'border-indigo-600 bg-white'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-white" />
                      ) : (
                        <Icon className={`h-5 w-5 ${isCurrent ? 'text-indigo-600' : 'text-gray-400'}`} />
                      )}
                    </span>
                    <span className="mt-2 text-xs font-medium text-center">
                      <span className={isCurrent ? 'text-indigo-600' : 'text-gray-500'}>
                        {step.title}
                      </span>
                    </span>
                  </div>
                </li>
              )
            })}
          </ol>
        </nav>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {steps[currentStepIndex].title}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {steps[currentStepIndex].description}
              </p>
            </div>

            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          {currentStep !== 'reporte' && (
            <div className="border-t border-gray-200 px-6 py-4 sm:px-8 flex justify-between">
              <button
                onClick={handleBack}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {currentStepIndex === 0 ? 'Cancelar' : 'Anterior'}
              </button>

              <div className="text-sm text-gray-500">
                Paso {currentStepIndex + 1} de {steps.length}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
