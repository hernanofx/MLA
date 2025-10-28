'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import AppLayout from '@/app/components/AppLayout'
import ActionMenu from '@/app/components/ActionMenu'
import { FileSpreadsheet } from 'lucide-react'

interface Load {
  id: string
  arrivalTime: string | null
  departureTime: string | null
  week: number
  month: number
  durationMinutes: number | null
  quantity: string | null
  container: string | null
  precinto: string | null
  createdAt: string
  provider: { name: string }
  truck: { licensePlate: string }
}

interface Provider {
  id: string
  name: string
}

interface Truck {
  id: string
  licensePlate: string
}

export default function LoadsPage() {
  const [loads, setLoads] = useState<Load[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit, setLimit] = useState(25)
  const router = useRouter()
  const { data: session } = useSession()

  // Filter states
  const [providers, setProviders] = useState<Provider[]>([])
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [selectedProvider, setSelectedProvider] = useState('')
  const [selectedTruck, setSelectedTruck] = useState('')
  const [selectedProviderName, setSelectedProviderName] = useState('')
  const [selectedTruckName, setSelectedTruckName] = useState('')
  const [selectedContainer, setSelectedContainer] = useState('')
  const [selectedWeek, setSelectedWeek] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [availableWeeks, setAvailableWeeks] = useState<number[]>([])
  const [availableMonths, setAvailableMonths] = useState<number[]>([])
  
  // Sorting states
  const [sortField, setSortField] = useState<string>('arrivalTime')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const filteredProviders = providers.filter(p => 
    p.name.toLowerCase().includes(selectedProviderName.toLowerCase())
  )
  const filteredTrucks = trucks.filter(t => 
    t.licensePlate.toLowerCase().includes(selectedTruckName.toLowerCase())
  )

  const fetchLoads = async (page: number = 1) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })

      if (selectedProvider) params.append('providerId', selectedProvider)
      if (selectedTruck) params.append('truckId', selectedTruck)
      if (selectedContainer) params.append('container', selectedContainer)
      if (selectedWeek) params.append('week', selectedWeek)
      if (selectedMonth) params.append('month', selectedMonth)
      if (sortField) params.append('sortBy', sortField)
      if (sortOrder) params.append('sortOrder', sortOrder)

      const response = await fetch(`/api/loads?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLoads(data.loads)
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
        setCurrentPage(page)
      }
    } catch (error) {
      console.error('Error fetching loads:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFilterOptions = async () => {
    try {
      // Fetch providers
      const providersResponse = await fetch('/api/providers')
      if (providersResponse.ok) {
        const providersData = await providersResponse.json()
        setProviders(providersData.providers || [])
      }

      // Fetch trucks
      const trucksResponse = await fetch('/api/trucks')
      if (trucksResponse.ok) {
        const trucksData = await trucksResponse.json()
        setTrucks(trucksData.trucks || [])
      }

      // Fetch available weeks and months
      const filterOptionsResponse = await fetch('/api/loads/filter-options')
      if (filterOptionsResponse.ok) {
        const filterData = await filterOptionsResponse.json()
        setAvailableWeeks(filterData.weeks || [])
        setAvailableMonths(filterData.months || [])
      }
    } catch (error) {
      console.error('Error fetching filter options:', error)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const clearFilters = () => {
    setSelectedProvider('')
    setSelectedTruck('')
    setSelectedProviderName('')
    setSelectedTruckName('')
    setSelectedContainer('')
    setSelectedWeek('')
    setSelectedMonth('')
    setCurrentPage(1)
    fetchLoads(1)
  }

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit)
    setCurrentPage(1)
  }
  
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle sort order
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // New field, default to ascending
      setSortField(field)
      setSortOrder('asc')
    }
    setCurrentPage(1)
  }
  
  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) {
      return <span className="ml-1 text-gray-400">↕</span>
    }
    return <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
  }

  const deleteLoad = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta carga? Esta acción no se puede deshacer.')) return

    try {
      const response = await fetch(`/api/loads/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Refetch current page to update pagination if needed
        fetchLoads(currentPage)
      } else {
        const errorData = await response.json()
        alert(`Error al eliminar la carga: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error deleting load:', error)
      alert('Error al eliminar la carga')
    }
  }

  useEffect(() => {
    fetchFilterOptions()
  }, [])

  useEffect(() => {
    const providerId = providers.find(p => p.name.toLowerCase() === selectedProviderName.toLowerCase())?.id || ''
    const truckId = trucks.find(t => t.licensePlate.toLowerCase() === selectedTruckName.toLowerCase())?.id || ''
    setSelectedProvider(providerId)
    setSelectedTruck(truckId)
  }, [selectedProviderName, selectedTruckName, providers, trucks])

  useEffect(() => {
    fetchLoads(currentPage)
  }, [currentPage, selectedProvider, selectedTruck, selectedContainer, selectedWeek, selectedMonth, limit, sortField, sortOrder])

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
      <div className="px-4 py-6 sm:px-0">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Cargas</h1>
            <p className="mt-2 text-sm text-gray-700">
              Lista de todas las cargas registradas.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            {(session?.user?.role === 'admin' || session?.user?.role === 'operario') && (
              <Link
                href="/loads/new"
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Nueva Carga
              </Link>
            )}
          </div>
        </div>
        
        {/* Filters */}
        <div className="mt-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label htmlFor="provider-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Proveedor
              </label>
              <input
                type="text"
                id="provider-filter"
                list="providers-datalist"
                value={selectedProviderName}
                onChange={(e) => setSelectedProviderName(e.target.value)}
                placeholder="Buscar proveedor..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
              />
              <datalist id="providers-datalist">
                {filteredProviders.map((provider) => (
                  <option key={provider.id} value={provider.name} />
                ))}
              </datalist>
            </div>

            <div>
              <label htmlFor="truck-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Camión
              </label>
              <input
                type="text"
                id="truck-filter"
                list="trucks-datalist"
                value={selectedTruckName}
                onChange={(e) => setSelectedTruckName(e.target.value)}
                placeholder="Buscar camión..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
              />
              <datalist id="trucks-datalist">
                {filteredTrucks.map((truck) => (
                  <option key={truck.id} value={truck.licensePlate} />
                ))}
              </datalist>
            </div>

            <div>
              <label htmlFor="container-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Contenedora
              </label>
              <input
                type="text"
                id="container-filter"
                value={selectedContainer}
                onChange={(e) => setSelectedContainer(e.target.value)}
                placeholder="Buscar contenedora..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
              />
            </div>

            <div>
              <label htmlFor="week-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Semana
              </label>
              <select
                id="week-filter"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
              >
                <option value="">Todas las semanas</option>
                {availableWeeks.map((week) => (
                  <option key={week} value={week}>
                    Semana {week}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="month-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Mes
              </label>
              <select
                id="month-filter"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
              >
                <option value="">Todos los meses</option>
                {availableMonths.map((month) => (
                  <option key={month} value={month}>
                    {new Date(2024, month - 1).toLocaleString('es-ES', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="shadow ring-1 ring-black ring-opacity-5 md:rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300 table-fixed"
                  style={{ width: '100%' }}
                >
                  <colgroup>
                    <col style={{ width: '12%' }} /> {/* Proveedor */}
                    <col className="hidden sm:table-column" style={{ width: '10%' }} /> {/* Camión */}
                    <col className="hidden md:table-column" style={{ width: '10%' }} /> {/* Llegada */}
                    <col className="hidden md:table-column" style={{ width: '10%' }} /> {/* Salida */}
                    <col className="hidden lg:table-column" style={{ width: '8%' }} /> {/* Duración */}
                    <col className="hidden xl:table-column" style={{ width: '6%' }} /> {/* Cantidad */}
                    <col className="hidden xl:table-column" style={{ width: '18%' }} /> {/* Contenedora */}
                    <col className="hidden xl:table-column" style={{ width: '12%' }} /> {/* Precinto */}
                    <col className="hidden xl:table-column" style={{ width: '6%' }} /> {/* Semana */}
                    <col className="hidden xl:table-column" style={{ width: '6%' }} /> {/* Mes */}
                    <col style={{ width: '2%' }} /> {/* Actions */}
                  </colgroup>
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        scope="col" 
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('provider')}
                      >
                        <div className="flex items-center">
                          Proveedor
                          <SortIcon field="provider" />
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden sm:table-cell cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('truck')}
                      >
                        <div className="flex items-center">
                          Camión
                          <SortIcon field="truck" />
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden md:table-cell cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('arrivalTime')}
                      >
                        <div className="flex items-center">
                          Llegada
                          <SortIcon field="arrivalTime" />
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden md:table-cell cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('departureTime')}
                      >
                        <div className="flex items-center">
                          Salida
                          <SortIcon field="departureTime" />
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden lg:table-cell cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('durationMinutes')}
                      >
                        <div className="flex items-center">
                          Duración
                          <SortIcon field="durationMinutes" />
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden xl:table-cell cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('quantity')}
                      >
                        <div className="flex items-center">
                          Cantidad
                          <SortIcon field="quantity" />
                        </div>
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden xl:table-cell">
                        Contenedora
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden xl:table-cell">
                        Precinto
                      </th>
                      <th 
                        scope="col" 
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden xl:table-cell cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('week')}
                      >
                        <div className="flex items-center">
                          Semana
                          <SortIcon field="week" />
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden xl:table-cell cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('month')}
                      >
                        <div className="flex items-center">
                          Mes
                          <SortIcon field="month" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {loads.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-4 pl-4 pr-3 text-center text-sm text-gray-500 sm:pl-6 md:col-span-9 lg:col-span-10 xl:col-span-10">
                          No hay cargas registradas
                        </td>
                      </tr>
                    ) : (
                      loads.map((load) => (
                        <tr key={load.id}>
                          <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                            <div className="font-medium text-gray-900">{load.provider.name}</div>
                            <div className="text-gray-500 sm:hidden">{load.truck.licensePlate}</div>
                            <div className="text-gray-400 text-xs sm:hidden mt-1">
                              {load.arrivalTime ? new Date(load.arrivalTime).toLocaleDateString() : 'Sin llegada'}
                            </div>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 hidden sm:table-cell">
                            {load.truck.licensePlate}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 hidden md:table-cell">
                            {load.arrivalTime ? new Date(load.arrivalTime).toLocaleString() : 'No registrada'}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 hidden md:table-cell">
                            {load.departureTime ? new Date(load.departureTime).toLocaleString() : 'No registrada'}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 hidden lg:table-cell">
                            {load.durationMinutes ? `${load.durationMinutes} min` : 'N/A'}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 hidden xl:table-cell">
                            {load.quantity || 'N/A'}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 hidden xl:table-cell">
                            <div className="truncate" title={load.container || 'N/A'}>
                              {load.container ? load.container.replace(/\s+/g, ' ').trim() : 'N/A'}
                            </div>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 hidden xl:table-cell">
                            <div className="truncate" title={load.precinto || 'N/A'}>
                              {load.precinto ? load.precinto.replace(/\s+/g, ' ').trim() : 'N/A'}
                            </div>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 hidden xl:table-cell">
                            {load.week}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 hidden xl:table-cell">
                            {load.month}
                          </td>
                          <td className="relative py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            {(session?.user?.role === 'admin' || session?.user?.role === 'operario') && (
                              <ActionMenu
                                editHref={`/loads/${load.id}/edit`}
                                onDelete={() => deleteLoad(load.id)}
                              />
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-8 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="text-sm text-gray-700">
              Mostrando {loads.length > 0 ? ((currentPage - 1) * limit) + 1 : 0} a {Math.min(currentPage * limit, total)} de {total} resultados
            </div>
            <div className="flex items-center space-x-2">
              <label htmlFor="limit-select" className="text-sm text-gray-700">
                Mostrar:
              </label>
              <select
                id="limit-select"
                value={limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
          <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const params = new URLSearchParams()
                  if (selectedProvider) params.append('providerId', selectedProvider)
                  if (selectedTruck) params.append('truckId', selectedTruck)
                  if (selectedContainer) params.append('container', selectedContainer)
                  if (selectedWeek) params.append('week', selectedWeek)
                  if (selectedMonth) params.append('month', selectedMonth)
                  const url = `/api/loads/export?${params}`
                  window.open(url, '_blank')
                }}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              title="Exportar a Excel"
            >
              <FileSpreadsheet className="h-4 w-4 mr-1" />
              Excel
            </button>
            {totalPages > 1 && (
              <div className="flex flex-wrap justify-center sm:justify-end gap-1">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  ← Anterior
                </button>
                
                {/* Mobile pagination - show current page and nearby pages */}
                <div className="hidden sm:flex items-center space-x-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                    if (pageNum > totalPages) return null
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-md border transition-colors ${
                          pageNum === currentPage
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                {/* Mobile current page indicator */}
                <div className="sm:hidden flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md">
                  {currentPage} / {totalPages}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}