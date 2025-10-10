'use client'

import Link from 'next/link'
import { ArrowLeft, LayoutDashboard, BarChart3, Truck, Package, AlertTriangle } from 'lucide-react'

export default function DashboardHelpPage() {
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
            <LayoutDashboard className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Ayuda - Dashboard</h1>
          </div>
          <p className="text-lg text-gray-600">
            El Dashboard es la vista principal del sistema, donde puedes obtener una visión general del estado de tu operación.
          </p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">¿Qué puedes hacer en el Dashboard?</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start">
                  <BarChart3 className="h-6 w-6 text-green-600 mr-3 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Ver Estadísticas</h3>
                    <p className="text-gray-600">Monitorea métricas clave como número de camiones activos, cargas pendientes y rendimiento general.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Truck className="h-6 w-6 text-blue-600 mr-3 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Estado de Flota</h3>
                    <p className="text-gray-600">Revisa el estado actual de todos los camiones registrados en el sistema.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Package className="h-6 w-6 text-purple-600 mr-3 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Cargas Recientes</h3>
                    <p className="text-gray-600">Visualiza las últimas cargas procesadas y su estado actual.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <AlertTriangle className="h-6 w-6 text-red-600 mr-3 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Alertas y Notificaciones</h3>
                    <p className="text-gray-600">Recibe alertas sobre problemas críticos o eventos importantes.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cómo navegar el Dashboard</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <ol className="list-decimal list-inside space-y-4 text-gray-700">
                <li>
                  <strong>Accede al Dashboard:</strong> Desde el menú lateral, haz clic en "Dashboard" o accede directamente a la URL principal del sistema.
                </li>
                <li>
                  <strong>Revisa las tarjetas de estadísticas:</strong> En la parte superior, encontrarás tarjetas con métricas clave como total de camiones, cargas activas, etc.
                </li>
                <li>
                  <strong>Explora los gráficos:</strong> Los gráficos muestran tendencias y distribuciones importantes para tu operación.
                </li>
                <li>
                  <strong>Revisa listas recientes:</strong> Al final de la página, encontrarás listas de actividades recientes como cargas nuevas o camiones actualizados.
                </li>
                <li>
                  <strong>Utiliza los filtros:</strong> Si están disponibles, usa los filtros para personalizar la vista según fechas o categorías específicas.
                </li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Consejos útiles</h2>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Actualización automática:</strong> El Dashboard se actualiza automáticamente cada cierto tiempo para mostrar la información más reciente.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Permisos:</strong> Algunos datos pueden estar restringidos según tu rol de usuario. Contacta al administrador si necesitas acceso adicional.
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