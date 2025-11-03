'use client'

import { Package, Truck, CheckCircle, XCircle, Clock } from 'lucide-react'

interface VehicleStats {
  vehiculo: string
  total: number
  escaneados: number
  pendientes: number
  porcentaje: number
}

interface ClasificacionStatsProps {
  totalPaquetes: number
  paquetesEscaneados: number
  paquetesPendientes: number
  vehiculos: VehicleStats[]
  className?: string
}

export default function ClasificacionStats({
  totalPaquetes,
  paquetesEscaneados,
  paquetesPendientes,
  vehiculos,
  className = ''
}: ClasificacionStatsProps) {
  const porcentajeGeneral = totalPaquetes > 0 ? Math.round((paquetesEscaneados / totalPaquetes) * 100) : 0

  return (
    <div className={`space-y-6 ${className}`}>
      {/* General Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-500 rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700">Total Paquetes</p>
              <p className="text-3xl font-bold text-blue-800 mt-2">{totalPaquetes}</p>
            </div>
            <Package className="h-12 w-12 text-blue-500 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-500 rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-700">Escaneados</p>
              <p className="text-3xl font-bold text-green-800 mt-2">{paquetesEscaneados}</p>
              <p className="text-xs text-green-600 mt-1">{porcentajeGeneral}% del total</p>
            </div>
            <CheckCircle className="h-12 w-12 text-green-500 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-500 rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-orange-700">Pendientes</p>
              <p className="text-3xl font-bold text-orange-800 mt-2">{paquetesPendientes}</p>
              <p className="text-xs text-orange-600 mt-1">{totalPaquetes > 0 ? Math.round((paquetesPendientes / totalPaquetes) * 100) : 0}% del total</p>
            </div>
            <Clock className="h-12 w-12 text-orange-500 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-500 rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-700">Vehículos</p>
              <p className="text-3xl font-bold text-purple-800 mt-2">{vehiculos.length}</p>
              <p className="text-xs text-purple-600 mt-1">asignados</p>
            </div>
            <Truck className="h-12 w-12 text-purple-500 opacity-80" />
          </div>
        </div>
      </div>

      {/* Vehicle-specific Stats */}
      {vehiculos.length > 0 && (
        <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <Truck className="h-5 w-5 mr-2 text-gray-600" />
              Estadísticas por Vehículo
            </h3>
          </div>

          <div className="divide-y divide-gray-200">
            {vehiculos
              .sort((a, b) => b.total - a.total) // Ordenar por total de paquetes descendente
              .map((vehiculo) => (
                <div key={vehiculo.vehiculo} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Truck className="h-6 w-6 text-orange-600 mr-3" />
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{vehiculo.vehiculo}</h4>
                        <p className="text-sm text-gray-600">
                          {vehiculo.total} paquete{vehiculo.total !== 1 ? 's' : ''} asignado{vehiculo.total !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-orange-600">{vehiculo.porcentaje}%</div>
                      <div className="text-sm text-gray-500">completado</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">{vehiculo.total}</div>
                      <div className="text-xs text-gray-500">Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">{vehiculo.escaneados}</div>
                      <div className="text-xs text-gray-500">Escaneados</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-orange-600">{vehiculo.pendientes}</div>
                      <div className="text-xs text-gray-500">Pendientes</div>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${vehiculo.porcentaje}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}