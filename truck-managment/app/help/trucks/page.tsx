'use client'

import Link from 'next/link'
import { ArrowLeft, Truck, Plus, Search, Edit, Settings, MapPin } from 'lucide-react'

export default function TrucksHelpPage() {
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
            <Truck className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Ayuda - Camiones</h1>
          </div>
          <p className="text-lg text-gray-600">
            Administra tu flota de camiones, registra nuevos vehículos y mantén un seguimiento de su estado y ubicación.
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
                    <h3 className="font-semibold text-gray-900">Registrar Camión</h3>
                    <p className="text-gray-600">Agrega nuevos camiones a tu flota con toda su información técnica.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Search className="h-6 w-6 text-blue-600 mr-3 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Buscar y Filtrar</h3>
                    <p className="text-gray-600">Encuentra camiones por placa, modelo, estado o capacidad.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Edit className="h-6 w-6 text-purple-600 mr-3 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Editar Información</h3>
                    <p className="text-gray-600">Actualiza datos técnicos, estado y asignaciones de camiones.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="h-6 w-6 text-orange-600 mr-3 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Seguimiento GPS</h3>
                    <p className="text-gray-600">Monitorea la ubicación y rutas de tus camiones en tiempo real.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cómo gestionar camiones</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <ol className="list-decimal list-inside space-y-4 text-gray-700">
                <li>
                  <strong>Accede al módulo:</strong> Desde el menú lateral, haz clic en "Camiones".
                </li>
                <li>
                  <strong>Registrar un nuevo camión:</strong> Haz clic en "Nuevo Camión" y completa los campos requeridos como placa, modelo, capacidad, etc.
                </li>
                <li>
                  <strong>Configurar características:</strong> Especifica el tipo de camión, capacidad de carga, dimensiones y características especiales.
                </li>
                <li>
                  <strong>Asignar conductor:</strong> Vincula el camión a un conductor registrado en el sistema.
                </li>
                <li>
                  <strong>Actualizar estado:</strong> Cambia el estado del camión (disponible, en ruta, mantenimiento, etc.).
                </li>
                <li>
                  <strong>Ver historial:</strong> Revisa el historial de cargas y mantenimientos del camión.
                </li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Campos importantes</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <ul className="space-y-3 text-gray-700">
                <li><strong>Placa:</strong> Identificación única del vehículo.</li>
                <li><strong>Modelo/Marca:</strong> Información del fabricante y modelo.</li>
                <li><strong>Capacidad:</strong> Capacidad máxima de carga en toneladas.</li>
                <li><strong>Tipo:</strong> Clasificación del camión (camión, trailer, etc.).</li>
                <li><strong>Estado:</strong> Condición actual (activo, mantenimiento, fuera de servicio).</li>
                <li><strong>Conductor asignado:</strong> Persona responsable del vehículo.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Consejos útiles</h2>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Mantenimiento preventivo:</strong> Registra fechas de mantenimiento para evitar problemas mecánicos.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Documentación:</strong> Mantén actualizada la documentación legal del vehículo (seguros, permisos, etc.).
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