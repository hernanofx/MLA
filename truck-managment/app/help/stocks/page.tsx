'use client'

import Link from 'next/link'
import { ArrowLeft, Warehouse, BarChart3, Search, Edit, Package, AlertTriangle } from 'lucide-react'

export default function StocksHelpPage() {
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
            <Warehouse className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Ayuda - Stock</h1>
          </div>
          <p className="text-lg text-gray-600">
            Controla tu inventario en tiempo real, gestiona almacenes y recibe alertas sobre niveles de stock críticos.
          </p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Funcionalidades principales</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start">
                  <BarChart3 className="h-6 w-6 text-green-600 mr-3 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Vista de Inventario</h3>
                    <p className="text-gray-600">Visualiza el stock actual por producto y ubicación.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Search className="h-6 w-6 text-blue-600 mr-3 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Buscar Productos</h3>
                    <p className="text-gray-600">Encuentra productos por nombre, código o categoría.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Edit className="h-6 w-6 text-purple-600 mr-3 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Ajustes de Inventario</h3>
                    <p className="text-gray-600">Realiza ajustes manuales al stock cuando sea necesario.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <AlertTriangle className="h-6 w-6 text-red-600 mr-3 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Alertas de Stock</h3>
                    <p className="text-gray-600">Recibe notificaciones sobre productos con stock bajo o agotado.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cómo gestionar el inventario</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <ol className="list-decimal list-inside space-y-4 text-gray-700">
                <li>
                  <strong>Accede al módulo:</strong> Desde el menú lateral, haz clic en "Stock".
                </li>
                <li>
                  <strong>Explora las pestañas:</strong> Navega entre Inventario, Ubicaciones y Almacenes según necesites.
                </li>
                <li>
                  <strong>Ver stock por producto:</strong> En la pestaña Inventario, revisa cantidades disponibles y reservadas.
                </li>
                <li>
                  <strong>Filtrar por almacén:</strong> Usa los filtros para ver stock en almacenes específicos.
                </li>
                <li>
                  <strong>Configurar alertas:</strong> Establece niveles mínimos de stock para recibir notificaciones.
                </li>
                <li>
                  <strong>Realizar inventarios:</strong> Programa conteos físicos y registra discrepancias.
                </li>
                <li>
                  <strong>Generar reportes:</strong> Exporta informes de stock para análisis o auditorías.
                </li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Pestañas del módulo</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <Package className="h-5 w-5 mr-2 text-blue-600" />
                    Inventario
                  </h3>
                  <p className="text-gray-600 ml-7">Vista general de productos y sus cantidades en stock.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <Warehouse className="h-5 w-5 mr-2 text-green-600" />
                    Ubicaciones
                  </h3>
                  <p className="text-gray-600 ml-7">Gestión de espacios de almacenamiento y organización física.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
                    Almacenes
                  </h3>
                  <p className="text-gray-600 ml-7">Administración de diferentes centros de almacenamiento.</p>
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
                    <strong>Stock reservado:</strong> El sistema diferencia entre stock disponible y reservado para cargas programadas.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Actualización automática:</strong> El stock se actualiza automáticamente con cada entrada o salida registrada.
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