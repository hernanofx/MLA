'use client'

import Link from 'next/link'
import { ArrowLeft, Package, Plus, Search, Edit, Truck, MapPin } from 'lucide-react'

export default function LoadsHelpPage() {
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
            <Package className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Ayuda - Cargas/Descargas</h1>
          </div>
          <p className="text-lg text-gray-600">
            Gestiona las cargas asignadas a tus camiones, programa rutas y controla el estado de entrega de mercancías.
          </p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Funcionalidades principales</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start">
                  <Plus className="h-6 w-6 text-green-600 mr-3 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Crear Nueva Carga</h3>
                    <p className="text-gray-600">Programa y asigna nuevas cargas a camiones disponibles.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Search className="h-6 w-6 text-blue-600 mr-3 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Buscar Cargas</h3>
                    <p className="text-gray-600">Encuentra cargas por estado, destino, camión o fecha.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Truck className="h-6 w-6 text-purple-600 mr-3 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Asignar Camiones</h3>
                    <p className="text-gray-600">Vincula cargas a camiones específicos y conductores.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="h-6 w-6 text-orange-600 mr-3 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Rastrear Rutas</h3>
                    <p className="text-gray-600">Monitorea el progreso de las cargas en tiempo real.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cómo gestionar cargas</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <ol className="list-decimal list-inside space-y-4 text-gray-700">
                <li>
                  <strong>Accede al módulo:</strong> Desde el menú lateral, haz clic en "Cargas/Descargas".
                </li>
                <li>
                  <strong>Crear nueva carga:</strong> Haz clic en "Nueva Carga" para iniciar el proceso.
                </li>
                <li>
                  <strong>Definir detalles básicos:</strong> Ingresa origen, destino, fecha de carga y productos.
                </li>
                <li>
                  <strong>Seleccionar camión:</strong> Elige un camión disponible con capacidad suficiente.
                </li>
                <li>
                  <strong>Asignar conductor:</strong> Vincula un conductor calificado para la ruta.
                </li>
                <li>
                  <strong>Especificar productos:</strong> Lista detallada de mercancías con pesos y volúmenes.
                </li>
                <li>
                  <strong>Confirmar y programar:</strong> Revisa toda la información y confirma la carga.
                </li>
                <li>
                  <strong>Actualizar estado:</strong> Cambia el estado según el progreso (cargando, en ruta, descargando, completada).
                </li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Estados de carga</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <ul className="space-y-3 text-gray-700">
                <li><strong className="text-blue-600">● Programada:</strong> Carga creada pero no iniciada.</li>
                <li><strong className="text-yellow-600">● Cargando:</strong> En proceso de carga en origen.</li>
                <li><strong className="text-green-600">● En Ruta:</strong> Camión en tránsito hacia destino.</li>
                <li><strong className="text-purple-600">● Descargando:</strong> En proceso de descarga en destino.</li>
                <li><strong className="text-gray-600">● Completada:</strong> Carga entregada exitosamente.</li>
                <li><strong className="text-red-600">● Cancelada:</strong> Carga cancelada por algún motivo.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Consejos útiles</h2>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Optimización de rutas:</strong> Considera múltiples paradas y factores como tráfico y restricciones de horario.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Capacidad del camión:</strong> Verifica que la carga no exceda el peso máximo permitido del vehículo.
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