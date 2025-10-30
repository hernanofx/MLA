'use client'

import { useState } from 'react'
import { Upload, AlertCircle, CheckCircle, FileSpreadsheet, Truck } from 'lucide-react'

interface UploadClasificacionStepProps {
  shipmentId: string
  onComplete: (clasificacionId: string) => void
}

interface Summary {
  totalPaquetes: number
  vehiculos: number
  paquetesPorVehiculo: Array<{ vehiculo: string; cantidad: number }>
  processingStats: {
    totalProcessed: number
    skippedNotOK: number
    skippedInvalid: number
  }
}

export default function UploadClasificacionStep({ shipmentId, onComplete }: UploadClasificacionStepProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState<Summary | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validar extensión
      const validExtensions = ['.xls', '.xlsx']
      const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase()
      
      if (!validExtensions.includes(fileExtension)) {
        setError('Por favor selecciona un archivo Excel (.xls o .xlsx)')
        return
      }

      setFile(selectedFile)
      setError('')
      setSummary(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Selecciona un archivo')
      return
    }

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('shipmentId', shipmentId)

      const response = await fetch('/api/vms/clasificacion/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al subir archivo')
      }

      setSummary(result.summary)
      
      // Auto-advance después de 2.5 segundos
      setTimeout(() => {
        onComplete(result.clasificacionId)
      }, 2500)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Subir Archivo de Clasificación
        </h2>
        <p className="text-gray-600 mb-8">
          Carga el archivo <code className="bg-gray-100 px-2 py-1 rounded text-sm">orden.xls</code> con la información de vehículos y orden de visitas
        </p>

        {/* File Input */}
        <div 
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
            file 
              ? 'border-orange-400 bg-orange-50' 
              : 'border-gray-300 bg-gray-50 hover:border-orange-400 hover:bg-orange-50'
          }`}
        >
          <input
            id="file-upload"
            name="file-upload"
            type="file"
            accept=".xls,.xlsx"
            className="sr-only"
            onChange={handleFileChange}
            disabled={uploading || !!summary}
          />
          
          <label 
            htmlFor="file-upload" 
            className={`cursor-pointer ${uploading || summary ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            {file ? (
              <FileSpreadsheet className="mx-auto h-16 w-16 text-orange-500 mb-4" />
            ) : (
              <Upload className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            )}
            
            <div className="mt-4">
              <span className="mt-2 block text-lg font-semibold text-gray-900">
                {file ? file.name : 'Seleccionar archivo orden.xls'}
              </span>
              {file && (
                <span className="mt-1 block text-sm text-gray-500">
                  {(file.size / 1024).toFixed(2)} KB
                </span>
              )}
            </div>
            
            {!file && (
              <p className="mt-2 text-sm text-gray-500">
                Click para seleccionar o arrastra el archivo aquí
              </p>
            )}
          </label>
          
          <p className="mt-4 text-xs text-gray-500">
            Formatos aceptados: .xls, .xlsx (máx 10MB)
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Error al procesar archivo</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Summary */}
        {summary && (
          <div className="mt-6 bg-green-50 border-l-4 border-green-500 rounded-lg p-6">
            <div className="flex items-start">
              <CheckCircle className="h-6 w-6 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-base font-semibold text-green-800 mb-3">
                  ✅ Archivo procesado correctamente
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <p className="text-sm text-gray-600">Total de paquetes</p>
                    <p className="text-2xl font-bold text-green-700">{summary.totalPaquetes}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <p className="text-sm text-gray-600">Vehículos</p>
                    <p className="text-2xl font-bold text-green-700">{summary.vehiculos}</p>
                  </div>
                </div>

                {summary.paquetesPorVehiculo && summary.paquetesPorVehiculo.length > 0 && (
                  <div className="bg-white rounded-lg p-4 border border-green-200 mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <Truck className="h-4 w-4 mr-2" />
                      Distribución por vehículo:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                      {summary.paquetesPorVehiculo.map((veh, idx) => (
                        <div key={idx} className="text-sm text-gray-600 flex justify-between bg-gray-50 px-2 py-1 rounded">
                          <span className="font-medium">{veh.vehiculo}:</span>
                          <span>{veh.cantidad}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {summary.processingStats && (
                  <div className="text-xs text-green-700 space-y-1 bg-white rounded-lg p-3 border border-green-200">
                    <p className="font-semibold mb-1">Estadísticas de procesamiento:</p>
                    <p>• Filas procesadas: {summary.processingStats.totalProcessed}</p>
                    {summary.processingStats.skippedNotOK > 0 && (
                      <p>• Omitidos (no estaban OK): {summary.processingStats.skippedNotOK}</p>
                    )}
                    {summary.processingStats.skippedInvalid > 0 && (
                      <p>• Omitidos (datos inválidos): {summary.processingStats.skippedInvalid}</p>
                    )}
                  </div>
                )}

                <p className="mt-4 font-medium text-green-800 animate-pulse">
                  Redirigiendo al escaneo...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Button */}
        <div className="mt-8">
          <button
            onClick={handleUpload}
            disabled={!file || uploading || !!summary}
            className="w-full inline-flex justify-center items-center px-6 py-4 border border-transparent shadow-sm text-lg font-semibold rounded-lg text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando archivo...
              </>
            ) : summary ? (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Completado ✓
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 mr-2" />
                Cargar y Continuar
              </>
            )}
          </button>
        </div>

        {/* Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Estructura esperada del archivo
          </h4>
          <ul className="text-sm text-blue-700 space-y-1.5 ml-2">
            <li className="flex items-start">
              <span className="font-mono bg-blue-100 px-2 py-0.5 rounded mr-2 text-xs">B</span>
              <span><strong>Tracking Number</strong> - Código del paquete (entrega)</span>
            </li>
            <li className="flex items-start">
              <span className="font-mono bg-blue-100 px-2 py-0.5 rounded mr-2 text-xs">F</span>
              <span><strong>Número de Vehículo</strong> - Identificador del vehículo</span>
            </li>
            <li className="flex items-start">
              <span className="font-mono bg-blue-100 px-2 py-0.5 rounded mr-2 text-xs">AF</span>
              <span><strong>Orden de Visita</strong> - "-" para primera visita, luego secuencial</span>
            </li>
          </ul>
          <p className="text-xs text-blue-600 mt-3 italic">
            Solo se procesarán paquetes que estén marcados como OK en el lote finalizado.
          </p>
        </div>
      </div>
    </div>
  )
}
