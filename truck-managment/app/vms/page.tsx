import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import AppLayout from "@/app/components/AppLayout"
import { Truck, MapPin, BarChart3, Settings, Users, Calendar } from "lucide-react"

export default async function VMSPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // Check if user has permission to access VMS
  if (session.user?.role !== 'vms' && session.user?.role !== 'admin') {
    redirect("/dashboard")
  }

  return (
    <AppLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">VMS - Vehicle Management System</h1>
          <p className="mt-2 text-sm text-gray-500">
            Sistema de Gestión de Vehículos - Bienvenido, <span className="font-medium text-gray-700">{session.user?.name}</span>
          </p>
        </div>

        <div className="mb-10">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 ring-1 ring-blue-200/50">
              <Truck className="h-4 w-4 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Gestión de Vehículos</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="group relative overflow-hidden rounded-xl border border-gray-200/60 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300/60">
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 ring-1 ring-blue-200/50 transition-transform duration-200 group-hover:scale-105">
                    <Truck className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-500 mb-1">Vehículos Activos</p>
                    <p className="text-2xl font-semibold text-gray-900 tracking-tight">0</p>
                  </div>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            </div>

            <div className="group relative overflow-hidden rounded-xl border border-gray-200/60 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300/60">
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 ring-1 ring-green-200/50 transition-transform duration-200 group-hover:scale-105">
                    <MapPin className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-500 mb-1">Rutas Asignadas</p>
                    <p className="text-2xl font-semibold text-gray-900 tracking-tight">0</p>
                  </div>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-green-500 to-green-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            </div>

            <div className="group relative overflow-hidden rounded-xl border border-gray-200/60 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300/60">
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-50 to-orange-100/50 ring-1 ring-orange-200/50 transition-transform duration-200 group-hover:scale-105">
                    <Calendar className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-500 mb-1">Mantenimientos</p>
                    <p className="text-2xl font-semibold text-gray-900 tracking-tight">0</p>
                  </div>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-orange-500 to-orange-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            </div>

            <div className="group relative overflow-hidden rounded-xl border border-gray-200/60 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300/60">
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 ring-1 ring-purple-200/50 transition-transform duration-200 group-hover:scale-105">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-500 mb-1">Reportes</p>
                    <p className="text-2xl font-semibold text-gray-900 tracking-tight">0</p>
                  </div>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-purple-500 to-purple-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            </div>
          </div>
        </div>

        <div className="mb-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <a
              href="/vms/vehicles"
              className="group relative inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-blue-600 to-blue-700 px-4 py-3 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:shadow-md hover:from-blue-700 hover:to-blue-800 active:scale-[0.98]"
            >
              <Truck className="h-4 w-4" />
              <span>Gestionar Vehículos</span>
            </a>
            <a
              href="/vms/routes"
              className="group relative inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-green-600 to-green-700 px-4 py-3 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:shadow-md hover:from-green-700 hover:to-green-800 active:scale-[0.98]"
            >
              <MapPin className="h-4 w-4" />
              <span>Rutas</span>
            </a>
            <a
              href="/vms/maintenance"
              className="group relative inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-orange-600 to-orange-700 px-4 py-3 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:shadow-md hover:from-orange-700 hover:to-orange-800 active:scale-[0.98]"
            >
              <Settings className="h-4 w-4" />
              <span>Mantenimiento</span>
            </a>
            <a
              href="/vms/reports"
              className="group relative inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-purple-600 to-purple-700 px-4 py-3 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:shadow-md hover:from-purple-700 hover:to-purple-800 active:scale-[0.98]"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Reportes VMS</span>
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200/60 bg-white p-8 shadow-sm">
          <div className="text-center">
            <Truck className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Sistema VMS</h3>
            <p className="mt-1 text-sm text-gray-500">
              Gestión integral de vehículos y flotas. Funcionalidades próximamente disponibles.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}