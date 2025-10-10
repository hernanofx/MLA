'use client'

import Link from 'next/link'
import { ArrowLeft, Building2, Plus, Search, Edit, Phone, Mail } from 'lucide-react'

export default function ProvidersHelpPage() {
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
            <Building2 className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Ayuda - Proveedores</h1>
          </div>
          <p className="text-lg text-gray-600">
            Gestiona la información de tus proveedores y sus contactos para mantener una comunicación efectiva.
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
                    <h3 className="font-semibold text-gray-900">Crear Proveedor</h3>
                    <p className="text-gray-600">Registra nuevos proveedores con toda su información de contacto.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Search className="h-6 w-6 text-blue-600 mr-3 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Buscar y Filtrar</h3>
                    <p className="text-gray-600">Encuentra proveedores rápidamente usando filtros por nombre, tipo, etc.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Edit className="h-6 w-6 text-purple-600 mr-3 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Editar Información</h3>
                    <p className="text-gray-600">Actualiza los datos de contacto y detalles de los proveedores existentes.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Phone className="h-6 w-6 text-orange-600 mr-3 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Gestionar Contactos</h3>
                    <p className="text-gray-600">Agrega y administra múltiples contactos por proveedor.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cómo gestionar proveedores</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <ol className="list-decimal list-inside space-y-4 text-gray-700">
                <li>
                  <strong>Accede al módulo:</strong> Desde el menú lateral, haz clic en "Proveedores".
                </li>
                <li>
                  <strong>Crear un nuevo proveedor:</strong> Haz clic en el botón "Nuevo Proveedor" y completa el formulario con nombre, dirección, teléfono, email, etc.
                </li>
                <li>
                  <strong>Agregar contactos:</strong> Dentro del detalle del proveedor, usa la sección de contactos para agregar teléfonos y emails adicionales.
                </li>
                <li>
                  <strong>Buscar proveedores:</strong> Utiliza la barra de búsqueda en la parte superior para encontrar proveedores por nombre o código.
                </li>
                <li>
                  <strong>Editar información:</strong> Haz clic en el botón de editar (lápiz) en cualquier proveedor para modificar sus datos.
                </li>
                <li>
                  <strong>Eliminar proveedor:</strong> Solo si no tiene cargas asociadas, puedes eliminar un proveedor desde el menú de acciones.
                </li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Campos importantes</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <ul className="space-y-3 text-gray-700">
                <li><strong>Nombre:</strong> Nombre completo del proveedor o empresa.</li>
                <li><strong>Código:</strong> Identificador único para referencias internas.</li>
                <li><strong>Dirección:</strong> Ubicación física del proveedor.</li>
                <li><strong>Teléfono principal:</strong> Número de contacto principal.</li>
                <li><strong>Email:</strong> Dirección de correo electrónico para comunicaciones.</li>
                <li><strong>Tipo:</strong> Clasificación del proveedor (transporte, almacenamiento, etc.).</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Consejos útiles</h2>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Contactos múltiples:</strong> Puedes agregar varios contactos por proveedor para diferentes departamentos o personas.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Validación:</strong> Asegúrate de que los emails y teléfonos sean correctos para evitar problemas de comunicación.
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