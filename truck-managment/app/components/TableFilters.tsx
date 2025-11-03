'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, X } from 'lucide-react'

interface FilterOption {
  value: string
  label: string
  count?: number
}

interface TableFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  vehicleFilter: string
  onVehicleFilterChange: (value: string) => void
  scannedFilter: string
  onScannedFilterChange: (value: string) => void
  vehicleOptions: FilterOption[]
  scannedOptions: FilterOption[]
  totalResults: number
  className?: string
}

export default function TableFilters({
  searchTerm,
  onSearchChange,
  vehicleFilter,
  onVehicleFilterChange,
  scannedFilter,
  onScannedFilterChange,
  vehicleOptions,
  scannedOptions,
  totalResults,
  className = ''
}: TableFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)

  const activeFiltersCount = [vehicleFilter, scannedFilter].filter(Boolean).length

  const clearAllFilters = () => {
    onVehicleFilterChange('')
    onScannedFilterChange('')
  }

  return (
    <div className={`bg-white border-b border-gray-200 ${className}`}>
      <div className="px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar por tracking number..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>

          {/* Filters Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium transition-colors ${
                showFilters || activeFiltersCount > 0
                  ? 'bg-orange-50 border-orange-500 text-orange-700'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {activeFiltersCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-orange-600 text-white rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Vehicle Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehículo
                </label>
                <select
                  value={vehicleFilter}
                  onChange={(e) => onVehicleFilterChange(e.target.value)}
                  className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Todos los vehículos</option>
                  {vehicleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} {option.count !== undefined && `(${option.count})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Scanned Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado de Escaneo
                </label>
                <select
                  value={scannedFilter}
                  onChange={(e) => onScannedFilterChange(e.target.value)}
                  className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Todos los estados</option>
                  {scannedOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} {option.count !== undefined && `(${option.count})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Results Count */}
              <div className="flex items-end">
                <div className="text-sm text-gray-600">
                  <span className="font-medium text-gray-900">{totalResults}</span> resultado{totalResults !== 1 ? 's' : ''} encontrado{totalResults !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}