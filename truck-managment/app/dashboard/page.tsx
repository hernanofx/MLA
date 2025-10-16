import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import AppLayout from "@/app/components/AppLayout"
import { ClipboardList, Users, Truck, BarChart3, Package, Warehouse, MapPin, TrendingUp } from "lucide-react"

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
    shippedInventory,
  ] = await Promise.all([
    prisma.entry.count(),
    prisma.load.count(),
    prisma.provider.count(),
    prisma.truck.count(),
    prisma.warehouse.count(),
    prisma.location.count(),
    prisma.inventory.count(),
    prisma.inventory.count({ where: { status: "stored" } }),
    prisma.inventory.count({ where: { status: "shipped" } }),
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
    shippedInventory,
  }
}

async function getRecentActivities() {
  const [
    recentProviders,
    recentTrucks,
    recentEntries,
    recentLoads,
    recentWarehouses,
    recentLocations,
    recentInventory,
  ] = await Promise.all([
    prisma.provider.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, createdAt: true }
    }),
    prisma.truck.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, licensePlate: true, createdAt: true }
    }),
    prisma.entry.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { 
        id: true, 
        createdAt: true,
        provider: { select: { name: true } },
        truck: { select: { licensePlate: true } }
      }
    }),
    prisma.load.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { 
        id: true, 
        createdAt: true,
        provider: { select: { name: true } },
        truck: { select: { licensePlate: true } }
      }
    }),
    prisma.warehouse.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, createdAt: true }
    }),
    prisma.location.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { 
        id: true, 
        name: true, 
        createdAt: true,
        warehouse: { select: { name: true } }
      }
    }),
    prisma.inventory.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { 
        id: true, 
        quantity: true,
        status: true,
        createdAt: true,
        location: { 
          select: { 
            name: true,
            warehouse: { select: { name: true } }
          }
        }
      }
    }),
  ])

  // Combine all activities and sort by createdAt
  const activities = [
    ...recentProviders.map(p => ({
      id: p.id,
      type: 'provider' as const,
      title: `Nuevo proveedor: ${p.name}`,
      description: 'Proveedor registrado en el sistema',
      createdAt: p.createdAt,
      color: 'emerald'
    })),
    ...recentTrucks.map(t => ({
      id: t.id,
      type: 'truck' as const,
      title: `Nuevo camión: ${t.licensePlate}`,
      description: 'Camión registrado en el sistema',
      createdAt: t.createdAt,
      color: 'amber'
    })),
    ...recentEntries.map(e => ({
      id: e.id,
      type: 'entry' as const,
      title: `Nueva entrada: ${e.provider.name}`,
      description: `Camión ${e.truck.licensePlate}`,
      createdAt: e.createdAt,
      color: 'blue'
    })),
    ...recentLoads.map(l => ({
      id: l.id,
      type: 'load' as const,
      title: `Nueva carga: ${l.provider.name}`,
      description: `Camión ${l.truck.licensePlate}`,
      createdAt: l.createdAt,
      color: 'indigo'
    })),
    ...recentWarehouses.map(w => ({
      id: w.id,
      type: 'warehouse' as const,
      title: `Nuevo almacén: ${w.name}`,
      description: 'Almacén registrado en el sistema',
      createdAt: w.createdAt,
      color: 'violet'
    })),
    ...recentLocations.map(l => ({
      id: l.id,
      type: 'location' as const,
      title: `Nueva ubicación: ${l.name}`,
      description: `En almacén ${l.warehouse.name}`,
      createdAt: l.createdAt,
      color: 'orange'
    })),
    ...recentInventory.map(i => ({
      id: i.id,
      type: 'inventory' as const,
      title: `Nuevo inventario: ${i.quantity} items`,
      description: `${i.location.warehouse.name} - ${i.location.name} (${i.status})`,
      createdAt: i.createdAt,
      color: 'teal'
    })),
  ]

  // Sort by createdAt descending and take top 10
  return activities
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10)
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // Redirect VMS users to their dedicated page
  if (session.user?.role === 'vms') {
    redirect("/vms")
  }

  const stats = await getStats()
  const recentActivities = await getRecentActivities()

  return (
    <AppLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-500">
            Bienvenido, <span className="font-medium text-gray-700">{session.user?.name}</span>
          </p>
        </div>

        <div className="mb-10">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 ring-1 ring-slate-200/50">
              <TrendingUp className="h-4 w-4 text-slate-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Operaciones</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="group relative overflow-hidden rounded-xl border border-gray-200/60 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300/60">
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 ring-1 ring-blue-200/50 transition-transform duration-200 group-hover:scale-105">
                    <ClipboardList className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-500 mb-1">Entradas</p>
                    <p className="text-2xl font-semibold text-gray-900 tracking-tight">{stats.entryCount}</p>
                  </div>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            </div>

            <div className="group relative overflow-hidden rounded-xl border border-gray-200/60 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300/60">
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 ring-1 ring-indigo-200/50 transition-transform duration-200 group-hover:scale-105">
                    <Package className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-500 mb-1">Cargas</p>
                    <p className="text-2xl font-semibold text-gray-900 tracking-tight">{stats.loadCount}</p>
                  </div>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-indigo-500 to-indigo-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            </div>

            <div className="group relative overflow-hidden rounded-xl border border-gray-200/60 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300/60">
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 ring-1 ring-emerald-200/50 transition-transform duration-200 group-hover:scale-105">
                    <Users className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-500 mb-1">Proveedores</p>
                    <p className="text-2xl font-semibold text-gray-900 tracking-tight">{stats.providerCount}</p>
                  </div>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            </div>

            <div className="group relative overflow-hidden rounded-xl border border-gray-200/60 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300/60">
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 ring-1 ring-amber-200/50 transition-transform duration-200 group-hover:scale-105">
                    <Truck className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-500 mb-1">Camiones</p>
                    <p className="text-2xl font-semibold text-gray-900 tracking-tight">{stats.truckCount}</p>
                  </div>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-amber-500 to-amber-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            </div>
          </div>
        </div>

        <div className="mb-10">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-100 to-violet-50 ring-1 ring-violet-200/50">
              <Warehouse className="h-4 w-4 text-violet-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Inventario</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="group relative overflow-hidden rounded-xl border border-gray-200/60 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300/60">
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-50 to-violet-100/50 ring-1 ring-violet-200/50 transition-transform duration-200 group-hover:scale-105">
                    <Warehouse className="h-6 w-6 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-500 mb-1">Almacenes</p>
                    <p className="text-2xl font-semibold text-gray-900 tracking-tight">{stats.warehouseCount}</p>
                  </div>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-violet-500 to-violet-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            </div>

            <div className="group relative overflow-hidden rounded-xl border border-gray-200/60 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300/60">
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-50 to-orange-100/50 ring-1 ring-orange-200/50 transition-transform duration-200 group-hover:scale-105">
                    <MapPin className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-500 mb-1">Ubicaciones</p>
                    <p className="text-2xl font-semibold text-gray-900 tracking-tight">{stats.locationCount}</p>
                  </div>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-orange-500 to-orange-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            </div>

            <div className="group relative overflow-hidden rounded-xl border border-gray-200/60 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300/60">
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-50 to-teal-100/50 ring-1 ring-teal-200/50 transition-transform duration-200 group-hover:scale-105">
                    <Package className="h-6 w-6 text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Inventario</p>
                    <p className="text-2xl font-semibold text-gray-900 tracking-tight">{stats.inventoryCount}</p>
                  </div>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-teal-500 to-teal-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            </div>

            <div className="group relative overflow-hidden rounded-xl border border-gray-200/60 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300/60">
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 ring-1 ring-slate-200/50 transition-transform duration-200 group-hover:scale-105">
                    <BarChart3 className="h-6 w-6 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-500 mb-1">Almacenado / Enviado</p>
                    <p className="text-lg font-semibold text-gray-900 tracking-tight">
                      <span className="text-emerald-600">{stats.storedInventory}</span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className="text-blue-600">{stats.shippedInventory}</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-slate-400 to-slate-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            </div>
          </div>
        </div>

        <div className="mb-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <a
              href="/entries/new"
              className="group relative inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-blue-600 to-blue-700 px-4 py-3 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:shadow-md hover:from-blue-700 hover:to-blue-800 active:scale-[0.98]"
            >
              <ClipboardList className="h-4 w-4" />
              <span>Nueva Entrada</span>
            </a>
            <a
              href="/loads/new"
              className="group relative inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-indigo-600 to-indigo-700 px-4 py-3 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:shadow-md hover:from-indigo-700 hover:to-indigo-800 active:scale-[0.98]"
            >
              <Package className="h-4 w-4" />
              <span>Nueva Carga</span>
            </a>
            <a
              href="/stocks"
              className="group relative inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-violet-600 to-violet-700 px-4 py-3 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:shadow-md hover:from-violet-700 hover:to-violet-800 active:scale-[0.98]"
            >
              <Warehouse className="h-4 w-4" />
              <span>Gestionar Stock</span>
            </a>
            <a
              href="/providers"
              className="group relative inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 px-4 py-3 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:shadow-md hover:from-emerald-700 hover:to-emerald-800 active:scale-[0.98]"
            >
              <Users className="h-4 w-4" />
              <span>Proveedores</span>
            </a>
            <a
              href="/trucks"
              className="group relative inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-amber-600 to-amber-700 px-4 py-3 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:shadow-md hover:from-amber-700 hover:to-amber-800 active:scale-[0.98]"
            >
              <Truck className="h-4 w-4" />
              <span>Camiones</span>
            </a>
            <a
              href="/reports"
              className="group relative inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-slate-600 to-slate-700 px-4 py-3 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:shadow-md hover:from-slate-700 hover:to-slate-800 active:scale-[0.98]"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Reportes</span>
            </a>
          </div>
        </div>

        <div className="mb-10">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-100 to-teal-50 ring-1 ring-teal-200/50">
              <BarChart3 className="h-4 w-4 text-teal-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Estado del Inventario</h2>
          </div>
          <div className="rounded-xl border border-gray-200/60 bg-white p-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="relative w-36 h-36 mx-auto mb-4">
                  <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#F3F4F6"
                      strokeWidth="2.5"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="2.5"
                      strokeDasharray={`${(stats.storedInventory / Math.max(stats.inventoryCount, 1)) * 100}, 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-3xl font-bold text-gray-900 tracking-tight">
                        {stats.inventoryCount > 0
                          ? Math.round((stats.storedInventory / stats.inventoryCount) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">Almacenado</h3>
                <p className="text-sm text-gray-500">
                  {stats.storedInventory} de {stats.inventoryCount} items
                </p>
              </div>

              <div className="text-center">
                <div className="relative w-36 h-36 mx-auto mb-4">
                  <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#F3F4F6"
                      strokeWidth="2.5"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="2.5"
                      strokeDasharray={`${(stats.shippedInventory / Math.max(stats.inventoryCount, 1)) * 100}, 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-3xl font-bold text-gray-900 tracking-tight">
                        {stats.inventoryCount > 0
                          ? Math.round((stats.shippedInventory / stats.inventoryCount) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">Enviado</h3>
                <p className="text-sm text-gray-500">
                  {stats.shippedInventory} de {stats.inventoryCount} items
                </p>
              </div>

              <div className="text-center">
                <div className="w-36 h-36 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-100 via-violet-50 to-indigo-50 ring-1 ring-violet-200/50 flex items-center justify-center shadow-sm">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-violet-600 tracking-tight">{stats.locationCount}</div>
                    <div className="text-sm font-medium text-violet-500 mt-1">ubicaciones</div>
                  </div>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">Capacidad</h3>
                <p className="text-sm text-gray-500">En {stats.warehouseCount} almacenes</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-100 to-orange-50 ring-1 ring-orange-200/50">
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Actividad Reciente</h2>
          </div>
          <div className="rounded-xl border border-gray-200/60 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Sistema operativo</span>
                </div>
                <span className="text-sm text-gray-500">{new Date().toLocaleDateString("es-ES")}</span>
              </div>
            </div>
            <div className="px-6 py-5">
              {recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={`${activity.type}-${activity.id}`} className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ring-4 ${
                        activity.color === 'blue' ? 'bg-blue-500 ring-blue-100' :
                        activity.color === 'indigo' ? 'bg-indigo-500 ring-indigo-100' :
                        activity.color === 'emerald' ? 'bg-emerald-500 ring-emerald-100' :
                        activity.color === 'amber' ? 'bg-amber-500 ring-amber-100' :
                        activity.color === 'violet' ? 'bg-violet-500 ring-violet-100' :
                        activity.color === 'orange' ? 'bg-orange-500 ring-orange-100' :
                        'bg-teal-500 ring-teal-100'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{activity.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {activity.createdAt.toLocaleDateString("es-ES", {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">No hay actividades recientes</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
