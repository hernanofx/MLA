'use client'

import { useState } from 'react'
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react'
import * as XLSX from 'xlsx'

interface PreAlertaStepProps {
  onComplete: (step: 'pre-alerta', data: { shipmentId: string }) => void
}

export default function PreAlertaStep({ onComplete }: PreAlertaStepProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<any[]>([])
  const [errors, setErrors] = useState<string[]>([])

  const requiredColumns = [
    'Client', 'Country', 'Tracking Number', 'Weight', 'FOB',
    'Buyer ID', 'Buyer', 'Buyer Address1', 
    'Buyer Address1 Number', 'Buyer Address2', 'Buyer City',
    'Buyer State', 'Buyer Location', 'Buyer ZIP', 
    'Buyer Phone', 'Buyer Email'
  ]

  const validateColumns = (columns: string[]): string[] => {
    const errors: string[] = []
    const normalizedColumns = columns.map(c => c.trim())
    
    requiredColumns.forEach(required => {
      if (!normalizedColumns.includes(required)) {
        errors.push(`Falta la columna requerida: ${required}`)
      }
    })
    
    return errors
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validar tipo de archivo
    if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
      setErrors(['Por favor selecciona un archivo Excel válido (.xlsx o .xls)'])
      return
    }

    setFile(selectedFile)
    setErrors([])

    // Leer y previsualizar el archivo
    try {
      const data = await selectedFile.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      
      if (jsonData.length < 2) {
        setErrors(['El archivo está vacío o no tiene datos'])
        return
      }

      const headers = jsonData[0] as string[]
      const columnErrors = validateColumns(headers)
      
      if (columnErrors.length > 0) {
        setErrors(columnErrors)
        setPreview([])
        return
      }

      // Convertir a objetos
      const rows = jsonData.slice(1, 6).map((row: any) => {
        const obj: any = {}
        headers.forEach((header, index) => {
          obj[header] = row[index]
        })
        return obj
      })

      setPreview(rows)
    } catch (error) {
      console.error('Error reading file:', error)
      setErrors(['Error al leer el archivo. Verifica que sea un Excel válido.'])
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setErrors([])

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/vms/pre-alerta/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al cargar el archivo')
      }

      const result = await response.json()
      onComplete('pre-alerta', { shipmentId: result.shipmentId })
    } catch (error: any) {
      setErrors([error.message])
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors">
        <input
          type="file"
          id="pre-alerta-file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
        />
        <label
          htmlFor="pre-alerta-file"
          className="cursor-pointer flex flex-col items-center"
        >
          <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
            <FileSpreadsheet className="h-full w-full" />
          </div>
          <div className="flex text-sm text-gray-600">
            <span className="relative font-medium text-indigo-600 hover:text-indigo-500">
              Selecciona un archivo
            </span>
            <p className="pl-1">o arrastra y suelta</p>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Excel (.xlsx, .xls) hasta 10MB
          </p>
        </label>
      </div>

      {/* Selected File */}
      {file && (
        <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileSpreadsheet className="h-6 w-6 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setFile(null)
              setPreview([])
              setErrors([])
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Errores en el archivo
              </h3>
              <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      {preview.length > 0 && errors.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <h3 className="text-sm font-medium text-green-800">
              Vista previa (primeras 5 filas)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-green-200 text-xs">
              <thead>
                <tr className="bg-green-100">
                  <th className="px-2 py-2 text-left font-medium text-green-900">Tracking</th>
                  <th className="px-2 py-2 text-left font-medium text-green-900">Cliente</th>
                  <th className="px-2 py-2 text-left font-medium text-green-900">Ciudad</th>
                  <th className="px-2 py-2 text-left font-medium text-green-900">Peso</th>
                  <th className="px-2 py-2 text-left font-medium text-green-900">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-green-100">
                {preview.map((row, index) => (
                  <tr key={index}>
                    <td className="px-2 py-2 text-green-900">{row['Tracking Number']}</td>
                    <td className="px-2 py-2 text-green-900">{row['Buyer']}</td>
                    <td className="px-2 py-2 text-green-900">{row['Buyer City']}</td>
                    <td className="px-2 py-2 text-green-900">{row['Weight']}</td>
                    <td className="px-2 py-2 text-green-900">{row['FOB']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Button */}
      {file && preview.length > 0 && errors.length === 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Cargando...
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 mr-2" />
                Cargar Pre-Alerta
              </>
            )}
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          Formato del archivo
        </h4>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>El archivo debe ser formato Excel (.xlsx o .xls)</li>
          <li>La primera fila debe contener los encabezados exactos</li>
          <li>Columnas requeridas: Client, Country, Tracking Number, Weight, Value, etc.</li>
          <li>El Tracking Number debe ser único para cada paquete</li>
        </ul>
      </div>
    </div>
  )
}
