'use client'

import Link from 'next/link'
import { ArrowLeft, BarChart3, FileText, Download, Calendar, Filter, TrendingUp } from 'lucide-react'

export default function ReportsHelpPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/help"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Centro de Ayuda
          </Link>
          <div className="flex items-center mb-4">
            <BarChart3 className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Ayuda - Reportes</h1>
          </div>
          <p className="text-lg text-gray-600">
            Genera reportes detallados sobre el rendimiento de tu operación, análisis de datos y métricas clave.
          </p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Tipos de reportes disponibles</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start">
                  <TrendingUp className="h-6 w-6 text-green-600 mr-3 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Rendimiento de Flota</h3>
                    <p className="text-gray-600">Análisis de eficiencia, kilometraje y costos por camión.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <FileText className="h-6 w-6 text-blue-600 mr-3 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Reportes de Cargas</h3>
                    <p className="text-gray-600">Historial de entregas, tiempos de tránsito y volúmenes transportados.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <BarChart3 className="h-6 w-6 text-purple-600 mr-3 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Análisis de Inventario</h3>
                    <p className="text-gray-600">Movimientos de stock, rotación de productos y niveles de inventario.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Calendar className="h-6 w-6 text-orange-600 mr-3 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Reportes Financieros</h3>
                    <p className="text-gray-600">Costos operativos, ingresos y análisis de rentabilidad.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cómo generar reportes</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <ol className="list-decimal list-inside space-y-4 text-gray-700">
                <li>
                  <strong>Accede al módulo:</strong> Desde el menú lateral, haz clic en "Reportes".
                </li>
                <li>
                  <strong>Selecciona tipo de reporte:</strong> Elige el reporte que necesitas de la lista disponible.
                </li>
                <li>
                  <strong>Configura filtros:</strong> Ajusta el período de tiempo, ubicaciones o criterios específicos.
                </li>
                <li>
                  <strong>Aplica filtros adicionales:</strong> Filtra por camión, conductor, producto o proveedor según el reporte.
                </li>
                <li>
                  <strong>Previsualiza resultados:</strong> Revisa los datos antes de generar el reporte final.
                </li>
                <li>
                  <strong>Exporta el reporte:</strong> Descarga en formato PDF, Excel o CSV según tus necesidades.
                </li>
                <li>
                  <strong>Programa reportes automáticos:</strong> Configura envíos periódicos por email si está disponible.
                </li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Filtros comunes</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <ul className="space-y-3 text-gray-700">
                <li><strong>Rango de fechas:</strong> Desde/Hasta para limitar el período analizado.</li>
                <li><strong>Ubicaciones:</strong> Filtrar por almacenes, rutas o destinos específicos.</li>
                <li><strong>Camiones:</strong> Analizar rendimiento de vehículos individuales o grupos.</li>
                <li><strong>Productos:</strong> Enfocarse en categorías o items específicos.</li>
                <li><strong>Estados:</strong> Incluir solo cargas completadas, pendientes, etc.</li>
                <li><strong>Proveedores:</strong> Analizar operaciones con proveedores específicos.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Formatos de exportación</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <FileText className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <h3 className="font-semibold">PDF</h3>
                  <p className="text-sm text-gray-600">Para presentaciones y archivos imprimibles</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Download className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-semibold">Excel</h3>
                  <p className="text-sm text-gray-600">Para análisis detallado y manipulación de datos</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold">CSV</h3>
                  <p className="text-sm text-gray-600">Para integración con otros sistemas</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Consejos útiles</h2>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Reportes programados:</strong> Configura reportes automáticos semanales o mensuales para seguimiento continuo.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Datos históricos:</strong> Los reportes pueden incluir datos de hasta 2 años atrás, dependiendo de la configuración del sistema.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}