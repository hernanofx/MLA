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
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">VMS - Vendor Management System</h1>
          <p className="mt-2 text-sm text-gray-500">
            Gestión de proveedores y entregas asignadas - Bienvenido, <span className="font-medium text-gray-700">{session.user?.name}</span>
          </p>
        </div>

        <div className="rounded-xl border border-gray-200/60 bg-white p-8 shadow-sm">
          <div className="text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Sistema VMS</h3>
            <p className="mt-1 text-sm text-gray-500">
              Gestión de proveedores y sus entregas asignadas. Funcionalidades próximamente disponibles.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}