import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import AppLayout from '@/app/components/AppLayout'
import { ClipboardList, Users, Truck, BarChart3, Package, Warehouse, MapPin, TrendingUp } from 'lucide-react'

async function getStats() {
  const [
    entryCount,
    loadCount,
    providerCount,
    truckCount,
    warehouseCount,
    locationCount,
    inventoryCount,
    storedInventory,
    shippedInventory
  ] = await Promise.all([
    prisma.entry.count(),
    prisma.load.count(),
    prisma.provider.count(),
    prisma.truck.count(),
    prisma.warehouse.count(),
    prisma.location.count(),
    prisma.inventory.count(),
    prisma.inventory.count({ where: { status: 'stored' } }),
    prisma.inventory.count({ where: { status: 'shipped' } })
  ])

  return {
    entryCount,
    loadCount,
    providerCount,
    truckCount,
    warehouseCount,
    locationCount,
    inventoryCount,
    storedInventory,
    shippedInventory
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const stats = await getStats()

  return (
    <AppLayout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">Bienvenido, {session.user?.name}</p>
        </div>

        {/* Operaciones */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-indigo-600" />
            Operaciones
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 sm:w-10 sm:h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <ClipboardList className="h-6 w-6 sm:h-6 sm:w-6 text-indigo-600" />
                    </div>
                  </div>
                  <div className="ml-4 sm:ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Entradas</dt>
                      <dd className="text-2xl sm:text-2xl font-semibold text-gray-900">{stats.entryCount}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Package className="h-6 w-6 sm:h-6 sm:w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4 sm:ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Cargas</dt>
                      <dd className="text-2xl sm:text-2xl font-semibold text-gray-900">{stats.loadCount}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 sm:h-6 sm:w-6 text-green-600" />
                    </div>
                  </div>
                  <div className="ml-4 sm:ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Proveedores</dt>
                      <dd className="text-2xl sm:text-2xl font-semibold text-gray-900">{stats.providerCount}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 sm:w-10 sm:h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Truck className="h-6 w-6 sm:h-6 sm:w-6 text-yellow-600" />
                    </div>
                  </div>
                  <div className="ml-4 sm:ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Camiones</dt>
                      <dd className="text-2xl sm:text-2xl font-semibold text-gray-900">{stats.truckCount}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Inventario */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Warehouse className="h-5 w-5 mr-2 text-purple-600" />
            Inventario
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Warehouse className="h-6 w-6 sm:h-6 sm:w-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="ml-4 sm:ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Almacenes</dt>
                      <dd className="text-2xl sm:text-2xl font-semibold text-gray-900">{stats.warehouseCount}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 sm:w-10 sm:h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <MapPin className="h-6 w-6 sm:h-6 sm:w-6 text-orange-600" />
                    </div>
                  </div>
                  <div className="ml-4 sm:ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Ubicaciones</dt>
                      <dd className="text-2xl sm:text-2xl font-semibold text-gray-900">{stats.locationCount}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 sm:w-10 sm:h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                      <Package className="h-6 w-6 sm:h-6 sm:w-6 text-teal-600" />
                    </div>
                  </div>
                  <div className="ml-4 sm:ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Inventario</dt>
                      <dd className="text-2xl sm:text-2xl font-semibold text-gray-900">{stats.inventoryCount}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 sm:w-10 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 sm:h-6 sm:w-6 text-gray-600" />
                    </div>
                  </div>
                  <div className="ml-4 sm:ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Almacenado vs Enviado</dt>
                      <dd className="text-sm font-semibold text-gray-900">
                        <span className="text-green-600">{stats.storedInventory}</span> / <span className="text-blue-600">{stats.shippedInventory}</span>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <a href="/entries/new" className="inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md">
              <ClipboardList className="h-5 w-5 mr-2" />
              Nueva Entrada
            </a>
            <a href="/loads/new" className="inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md">
              <Package className="h-5 w-5 mr-2" />
              Nueva Carga
            </a>
            <a href="/stocks" className="inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-sm hover:shadow-md">
              <Warehouse className="h-5 w-5 mr-2" />
              Gestionar Stock
            </a>
            <a href="/providers" className="inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm hover:shadow-md">
              <Users className="h-5 w-5 mr-2" />
              Proveedores
            </a>
            <a href="/trucks" className="inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-yellow-600 hover:bg-yellow-700 transition-colors shadow-sm hover:shadow-md">
              <Truck className="h-5 w-5 mr-2" />
              Camiones
            </a>
            <a href="/reports" className="inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-gray-600 hover:bg-gray-700 transition-colors shadow-sm hover:shadow-md">
              <BarChart3 className="h-5 w-5 mr-2" />
              Reportes
            </a>
          </div>
        </div>

        {/* Estado del Inventario */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-teal-600" />
            Estado del Inventario
          </h2>
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#E5E7EB"
                      strokeWidth="2"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="2"
                      strokeDasharray={`${(stats.storedInventory / Math.max(stats.inventoryCount, 1)) * 100}, 100`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">
                      {stats.inventoryCount > 0 ? Math.round((stats.storedInventory / stats.inventoryCount) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Almacenado</h3>
                <p className="text-sm text-gray-500">{stats.storedInventory} de {stats.inventoryCount} items</p>
              </div>

              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#E5E7EB"
                      strokeWidth="2"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="2"
                      strokeDasharray={`${(stats.shippedInventory / Math.max(stats.inventoryCount, 1)) * 100}, 100`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">
                      {stats.inventoryCount > 0 ? Math.round((stats.shippedInventory / stats.inventoryCount) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Enviado</h3>
                <p className="text-sm text-gray-500">{stats.shippedInventory} de {stats.inventoryCount} items</p>
              </div>

              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">{stats.locationCount}</div>
                    <div className="text-sm text-purple-500">ubicaciones</div>
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Capacidad</h3>
                <p className="text-sm text-gray-500">En {stats.warehouseCount} almacenes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actividad Reciente */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-orange-600" />
            Actividad Reciente
          </h2>
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">Sistema operativo</span>
                </div>
                <span className="text-sm text-gray-500">{new Date().toLocaleDateString('es-ES')}</span>
              </div>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-2 h-2 bg-indigo-500 rounded-full mt-2 mr-3"></div>
                  <div>
                    <p className="text-sm text-gray-900">Dashboard actualizado con nuevas métricas</p>
                    <p className="text-xs text-gray-500">Incluye operaciones de carga e inventario</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></div>
                  <div>
                    <p className="text-sm text-gray-900">Módulo de stock completamente funcional</p>
                    <p className="text-xs text-gray-500">Gestión de almacenes, ubicaciones e inventario</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2 mr-3"></div>
                  <div>
                    <p className="text-sm text-gray-900">Interfaz responsive y moderna</p>
                    <p className="text-xs text-gray-500">Optimizada para todos los dispositivos</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}