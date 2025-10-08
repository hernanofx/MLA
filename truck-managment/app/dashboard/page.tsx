import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import AppLayout from '@/app/components/AppLayout'
import { ClipboardList, Users, Truck, BarChart3 } from 'lucide-react'

async function getStats() {
  const [entryCount, providerCount, truckCount] = await Promise.all([
    prisma.entry.count(),
    prisma.provider.count(),
    prisma.truck.count()
  ])

  return { entryCount, providerCount, truckCount }
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

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Entradas</dt>
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

        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <a href="/entries/new" className="inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md">
              <ClipboardList className="h-5 w-5 mr-2" />
              Nueva Entrada
            </a>
            <a href="/providers" className="inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm hover:shadow-md">
              <Users className="h-5 w-5 mr-2" />
              Proveedores
            </a>
            <a href="/trucks" className="inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-yellow-600 hover:bg-yellow-700 transition-colors shadow-sm hover:shadow-md">
              <Truck className="h-5 w-5 mr-2" />
              Camiones
            </a>
            <a href="/reports" className="inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-sm hover:shadow-md">
              <BarChart3 className="h-5 w-5 mr-2" />
              Reportes
            </a>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}