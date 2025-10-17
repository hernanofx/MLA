'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Download, CheckCircle2, AlertTriangle, XCircle, Clock, FileText, ArrowLeft } from 'lucide-react'

interface ReporteStepProps {
  shipmentId: string
}

interface ReportData {
  totalScanned: number
  ok: number
  sobrante: number
  fueraCobertura: number
  previo: number
  details: any[]
}

export default function ReporteStep({ shipmentId }: ReporteStepProps) {
  const router = useRouter()
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    fetchReport()
  }, [shipmentId])

  const fetchReport = async () => {
    try {
      const response = await fetch(`/api/vms/shipments/${shipmentId}/report`)
      if (response.ok) {
        const data = await response.json()
        setReport(data)
      }
    } catch (error) {
      console.error('Error fetching report:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadExcel = async () => {
    setDownloading(true)
    try {
      const response = await fetch(`/api/vms/reports/export?shipmentId=${shipmentId}`)
      
      if (!response.ok) {
        throw new Error('Error al generar el reporte')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte-verificacion-${shipmentId}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading report:', error)
      alert('Error al descargar el reporte')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-sm text-gray-500">Generando reporte...</p>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-yellow-400" />
        <p className="mt-4 text-sm text-gray-500">No se pudo cargar el reporte</p>
      </div>
    )
  }

  const getPercentage = (value: number) => {
    // Calcular el total de paquetes únicos (OK + Sobrante + Fuera Cobertura + Previo)
    const totalPackages = report.ok + report.sobrante + report.fueraCobertura + report.previo
    if (totalPackages === 0) return 0
    return ((value / totalPackages) * 100).toFixed(1)
  }

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Verificación Completada
        </h3>
        <p className="text-gray-600">
          Se escanearon un total de <span className="font-bold">{report.totalScanned}</span> paquetes
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-sm font-medium text-green-600">
              {getPercentage(report.ok)}%
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{report.ok}</p>
          <p className="text-sm text-gray-600">OK - En ambos archivos</p>
          <div className="mt-2 w-full bg-green-100 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: `${getPercentage(report.ok)}%` }}
            />
          </div>
        </div>

        <div className="bg-white border-2 border-red-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <span className="text-sm font-medium text-red-600">
              {getPercentage(report.sobrante)}%
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{report.sobrante}</p>
          <p className="text-sm text-gray-600">Sobrantes</p>
          <div className="mt-2 w-full bg-red-100 rounded-full h-2">
            <div
              className="bg-red-600 h-2 rounded-full transition-all"
              style={{ width: `${getPercentage(report.sobrante)}%` }}
            />
          </div>
        </div>

        <div className="bg-white border-2 border-yellow-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <span className="text-sm font-medium text-yellow-600">
              {getPercentage(report.fueraCobertura)}%
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{report.fueraCobertura}</p>
          <p className="text-sm text-gray-600">Fuera de Cobertura</p>
          <div className="mt-2 w-full bg-yellow-100 rounded-full h-2">
            <div
              className="bg-yellow-600 h-2 rounded-full transition-all"
              style={{ width: `${getPercentage(report.fueraCobertura)}%` }}
            />
          </div>
        </div>

        <div className="bg-white border-2 border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-blue-600">
              {getPercentage(report.previo)}%
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{report.previo}</p>
          <p className="text-sm text-gray-600">Paquetes Previos</p>
          <div className="mt-2 w-full bg-blue-100 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${getPercentage(report.previo)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Resumen de Verificación</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Porcentaje
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    OK
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {report.ok}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getPercentage(report.ok)}%
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  Paquetes que están en ambos archivos
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                    Sobrante
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {report.sobrante}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getPercentage(report.sobrante)}%
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  No están en ninguno de los archivos
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    Fuera Cobertura
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {report.fueraCobertura}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getPercentage(report.fueraCobertura)}%
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  En Pre-Alerta pero no en Pre-Ruteo
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    Previo
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {report.previo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getPercentage(report.previo)}%
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  En Pre-Ruteo pero no en Pre-Alerta (paquetes anteriores)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          onClick={() => router.push('/vms')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al Inicio
        </button>

        <button
          onClick={handleDownloadExcel}
          disabled={downloading}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {downloading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Generando...
            </>
          ) : (
            <>
              <Download className="h-5 w-5 mr-2" />
              Descargar Reporte Excel
            </>
          )}
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <FileText className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              Sobre el Reporte
            </h4>
            <p className="text-sm text-blue-700">
              El reporte descargable incluye el detalle completo de todos los paquetes escaneados,
              con su información de Pre-Alerta, Pre-Ruteo y estado de verificación. 
              Puedes usar este archivo para análisis adicionales o reportes a otros departamentos.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
