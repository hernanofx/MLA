'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import AppLayout from '@/app/components/AppLayout'
import { Package, TrendingUp, CheckCircle2, AlertTriangle, Eye } from 'lucide-react'
import Link from 'next/link'

interface Shipment {
  id: string
  status: string
  createdAt: string
  provider: {
    name: string
  }
  _count: {
    preAlertas: number
    preRuteos: number
    scannedPackages: number
  }
}

interface Stats {
  totalShipments: number
  activeShipments: number
  completedShipments: number
  totalPackages: number
  okPackages: number
  issuesPackages: number
}

export default function VMSMonitoringPage() {
  const { data: session } = useSession()
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchVMSData()
    }
  }, [session])

  const fetchVMSData = async () => {
    try {
      const response = await fetch('/api/vms/shipments')
      if (response.ok) {
        const data = await response.json()
        setShipments(data.shipments || [])
        setStats({
          totalShipments: data.shipments?.length || 0,
          activeShipments: data.shipments?.filter((s: Shipment) => s.status === 'PRE_ALERTA' || s.status === 'PRE_RUTEO').length || 0,
          completedShipments: data.shipments?.filter((s: Shipment) => s.status === 'COMPLETED').length || 0,
          totalPackages: data.totalPackages || 0,
          okPackages: data.okPackages || 0,
          issuesPackages: data.issuesPackages || 0
        })
      }
    } catch (error) {
      console.error('Error fetching VMS data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!session || (session.user.role !== 'admin' && session.user.role !== 'user')) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-red-600">Acceso denegado. Solo administradores y usuarios regulares pueden ver esta página.</div>
        </div>
      </AppLayout>
    )
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Monitoreo VMS</h1>
          <p className="mt-2 text-sm text-gray-700">
            Vista general de las actividades de proveedores en el módulo VMS.
          </p>
        </div>

        {/* Estadísticas */}
        {stats && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-gray-700" />
                <div className="ml-4">
                  <dt className="text-sm font-medium text-gray-600">Total Envíos</dt>
                  <dd className="text-2xl font-bold text-gray-900">{stats.totalShipments}</dd>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 border border-amber-200 shadow-sm">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-amber-600" />
                <div className="ml-4">
                  <dt className="text-sm font-medium text-gray-600">Envíos Activos</dt>
                  <dd className="text-2xl font-bold text-gray-900">{stats.activeShipments}</dd>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 border border-green-200 shadow-sm">
              <div className="flex items-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <dt className="text-sm font-medium text-gray-600">Paquetes OK</dt>
                  <dd className="text-2xl font-bold text-gray-900">{stats.okPackages}</dd>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 border border-red-200 shadow-sm">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <dt className="text-sm font-medium text-gray-600">Paquetes con Issues</dt>
                  <dd className="text-2xl font-bold text-gray-900">{stats.issuesPackages}</dd>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Envíos */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Envíos Recientes</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Lista de envíos cargados por proveedores.</p>
          </div>
          <ul className="divide-y divide-gray-200">
            {shipments.slice(0, 10).map((shipment) => (
              <li key={shipment.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Package className="h-5 w-5 text-gray-400" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Envío {shipment.id.slice(-8)}</p>
                        <p className="text-sm text-gray-500">Proveedor: {shipment.provider.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-900">{shipment._count.scannedPackages} paquetes escaneados</p>
                        <p className="text-sm text-gray-500">{new Date(shipment.createdAt).toLocaleDateString()}</p>
                      </div>
                      <Link
                        href={`/vms/shipments/${shipment.id}`}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalle
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppLayout>
  )
}