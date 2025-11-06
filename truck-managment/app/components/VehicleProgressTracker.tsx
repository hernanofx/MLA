'use client'

import { Truck, CheckCircle, Package } from 'lucide-react'
import { useState, useMemo } from 'react'

interface VehicleStats {
  vehiculo: string
  total: number
  escaneados: number
  pendientes: number
  porcentaje: number
}

interface VehicleProgressTrackerProps {
  vehiculos: VehicleStats[]
  className?: string
}

type ViewMode = 'compact' | 'detailed'

export default function VehicleProgressTracker({
  vehiculos,
  className = ''
}: VehicleProgressTrackerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('compact')
  const [searchFilter, setSearchFilter] = useState('')
  const [showCompletedOnly, setShowCompletedOnly] = useState(false)

  // Filtrar y ordenar vehículos
  const filteredVehiculos = useMemo(() => {
    let filtered = vehiculos.filter(v => 
      v.vehiculo.toLowerCase().includes(searchFilter.toLowerCase())
    )
    
    if (showCompletedOnly) {
      filtered = filtered.filter(v => v.porcentaje === 100)
    }
    
    // Ordenar: primero los que tienen paquetes escaneados, luego por % descendente
    return filtered.sort((a, b) => {
      if (a.escaneados > 0 && b.escaneados === 0) return -1
      if (a.escaneados === 0 && b.escaneados > 0) return 1
      return b.porcentaje - a.porcentaje
    })
  }, [vehiculos, searchFilter, showCompletedOnly])

  const vehiculosCompletados = vehiculos.filter(v => v.porcentaje === 100).length
  const totalVehiculos = vehiculos.length

  // Determinar el mejor layout según la cantidad de vehículos
  const getGridCols = () => {
    const count = filteredVehiculos.length
    if (count <= 3) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
    if (count <= 8) return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
    if (count <= 15) return 'grid-cols-2 md:grid-cols-4 lg:grid-cols-5'
    return 'grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8'
  }

  if (vehiculos.length === 0) return null

  return (
    <div className={`bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-6 py-4 border-b border-orange-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Truck className="h-6 w-6 text-orange-600" />
            <div>
              <h3 className="font-semibold text-gray-900">
                Progreso por Vehículo
              </h3>
              <p className="text-sm text-gray-600">
                {vehiculosCompletados} de {totalVehiculos} vehículos completados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Filtro de búsqueda - solo si hay muchos vehículos */}
            {vehiculos.length > 8 && (
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Buscar vehículo..."
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-40"
              />
            )}

            {/* Toggle para mostrar solo completados */}
            {vehiculos.length > 5 && (
              <button
                onClick={() => setShowCompletedOnly(!showCompletedOnly)}
                className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                  showCompletedOnly
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {showCompletedOnly ? 'Mostrar todos' : 'Solo completos'}
              </button>
            )}

            {/* Toggle de vista */}
            <button
              onClick={() => setViewMode(viewMode === 'compact' ? 'detailed' : 'compact')}
              className="px-3 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              {viewMode === 'compact' ? 'Vista detallada' : 'Vista compacta'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {filteredVehiculos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No se encontraron vehículos</p>
          </div>
        ) : viewMode === 'compact' ? (
          // Vista compacta - ideal para muchos vehículos
          <div className={`grid ${getGridCols()} gap-3`}>
            {filteredVehiculos.map((vehiculo) => (
              <div
                key={vehiculo.vehiculo}
                className={`relative rounded-lg p-3 border-2 transition-all hover:shadow-md ${
                  vehiculo.porcentaje === 100
                    ? 'bg-green-50 border-green-500'
                    : vehiculo.escaneados > 0
                    ? 'bg-orange-50 border-orange-400'
                    : 'bg-gray-50 border-gray-300'
                }`}
              >
                {/* Badge de completado */}
                {vehiculo.porcentaje === 100 && (
                  <div className="absolute -top-2 -right-2">
                    <CheckCircle className="h-6 w-6 text-green-600 bg-white rounded-full" />
                  </div>
                )}

                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Truck className={`h-5 w-5 mr-1.5 ${
                      vehiculo.porcentaje === 100 ? 'text-green-600' :
                      vehiculo.escaneados > 0 ? 'text-orange-600' : 'text-gray-400'
                    }`} />
                    <h4 className="text-sm font-bold text-gray-900 truncate" title={vehiculo.vehiculo}>
                      {vehiculo.vehiculo}
                    </h4>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-center gap-2 text-xs">
                      <span className="font-semibold text-green-700">
                        {vehiculo.escaneados}
                      </span>
                      <span className="text-gray-500">/</span>
                      <span className="font-semibold text-gray-700">
                        {vehiculo.total}
                      </span>
                    </div>

                    {/* Barra de progreso */}
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          vehiculo.porcentaje === 100
                            ? 'bg-green-600'
                            : 'bg-gradient-to-r from-orange-500 to-orange-600'
                        }`}
                        style={{ width: `${vehiculo.porcentaje}%` }}
                      />
                    </div>

                    <div className={`text-lg font-bold ${
                      vehiculo.porcentaje === 100 ? 'text-green-700' : 'text-orange-600'
                    }`}>
                      {vehiculo.porcentaje}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Vista detallada - mejor para pocos vehículos
          <div className="space-y-3">
            {filteredVehiculos.map((vehiculo) => (
              <div
                key={vehiculo.vehiculo}
                className={`rounded-lg p-4 border-2 transition-all hover:shadow-md ${
                  vehiculo.porcentaje === 100
                    ? 'bg-green-50 border-green-500'
                    : vehiculo.escaneados > 0
                    ? 'bg-orange-50 border-orange-400'
                    : 'bg-gray-50 border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      vehiculo.porcentaje === 100 ? 'bg-green-200' :
                      vehiculo.escaneados > 0 ? 'bg-orange-200' : 'bg-gray-200'
                    }`}>
                      <Truck className={`h-5 w-5 ${
                        vehiculo.porcentaje === 100 ? 'text-green-700' :
                        vehiculo.escaneados > 0 ? 'text-orange-700' : 'text-gray-500'
                      }`} />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">{vehiculo.vehiculo}</h4>
                      <p className="text-sm text-gray-600">
                        {vehiculo.total} paquete{vehiculo.total !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-3xl font-bold ${
                      vehiculo.porcentaje === 100 ? 'text-green-700' : 'text-orange-600'
                    }`}>
                      {vehiculo.porcentaje}%
                    </div>
                    {vehiculo.porcentaje === 100 && (
                      <div className="flex items-center justify-end text-green-700 text-sm font-semibold">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Completo
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-center bg-white rounded-lg p-2">
                    <div className="text-xl font-bold text-gray-900">{vehiculo.total}</div>
                    <div className="text-xs text-gray-500">Total</div>
                  </div>
                  <div className="text-center bg-white rounded-lg p-2">
                    <div className="text-xl font-bold text-green-600">{vehiculo.escaneados}</div>
                    <div className="text-xs text-gray-500">Escaneados</div>
                  </div>
                  <div className="text-center bg-white rounded-lg p-2">
                    <div className="text-xl font-bold text-orange-600">{vehiculo.pendientes}</div>
                    <div className="text-xs text-gray-500">Pendientes</div>
                  </div>
                </div>

                {/* Barra de progreso */}
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      vehiculo.porcentaje === 100
                        ? 'bg-green-600'
                        : 'bg-gradient-to-r from-orange-500 to-orange-600'
                    }`}
                    style={{ width: `${vehiculo.porcentaje}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
