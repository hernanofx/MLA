'use client'

import Link from 'next/link'
import { ArrowLeft, ClipboardList, Plus, Search, Edit, CheckCircle, XCircle } from 'lucide-react'

export default function EntriesHelpPage() {
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
            <ClipboardList className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Ayuda - Entradas/Salidas</h1>
          </div>
          <p className="text-lg text-gray-600">
            Registra y controla todas las entradas y salidas de mercancías en tus almacenes y puntos de operación.
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
                    <h3 className="font-semibold text-gray-900">Nueva Entrada/Salida</h3>
                    <p className="text-gray-600">Registra movimientos de mercancías con detalles completos.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Search className="h-6 w-6 text-blue-600 mr-3 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Buscar Registros</h3>
                    <p className="text-gray-600">Encuentra entradas y salidas por fecha, producto o ubicación.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Edit className="h-6 w-6 text-purple-600 mr-3 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Editar Registros</h3>
                    <p className="text-gray-600">Modifica información de movimientos existentes.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-600 mr-3 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Confirmar Movimientos</h3>
                    <p className="text-gray-600">Valida y confirma entradas y salidas completadas.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cómo registrar entradas y salidas</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <ol className="list-decimal list-inside space-y-4 text-gray-700">
                <li>
                  <strong>Accede al módulo:</strong> Desde el menú lateral, haz clic en "Entradas/Salidas".
                </li>
                <li>
                  <strong>Crear nuevo registro:</strong> Haz clic en "Nueva Entrada" o "Nueva Salida" según corresponda.
                </li>
                <li>
                  <strong>Seleccionar tipo:</strong> Elige si es entrada (recepción) o salida (envío).
                </li>
                <li>
                  <strong>Completar información básica:</strong> Ingresa fecha, hora, ubicación y responsable del movimiento.
                </li>
                <li>
                  <strong>Agregar productos:</strong> Selecciona los productos y cantidades involucradas en el movimiento.
                </li>
                <li>
                  <strong>Especificar origen/destino:</strong> Indica de dónde viene o hacia dónde va la mercancía.
                </li>
                <li>
                  <strong>Confirmar registro:</strong> Revisa la información y confirma para guardar el movimiento.
                </li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Campos importantes</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <ul className="space-y-3 text-gray-700">
                <li><strong>Tipo:</strong> Entrada o Salida.</li>
                <li><strong>Fecha/Hora:</strong> Momento exacto del movimiento.</li>
                <li><strong>Ubicación:</strong> Almacén o punto donde ocurre el movimiento.</li>
                <li><strong>Productos:</strong> Lista de items con cantidades y descripciones.</li>
                <li><strong>Origen/Destino:</strong> Procedencia o destino de la mercancía.</li>
                <li><strong>Responsable:</strong> Persona que registra o autoriza el movimiento.</li>
                <li><strong>Estado:</strong> Pendiente, Confirmado, Cancelado.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Consejos útiles</h2>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Precisión en cantidades:</strong> Verifica las cantidades antes de confirmar para mantener el inventario actualizado.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Documentación:</strong> Adjunta documentos de respaldo como facturas o órdenes de compra cuando sea necesario.
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