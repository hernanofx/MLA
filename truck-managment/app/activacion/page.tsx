'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import AppLayout from '@/app/components/AppLayout'
import ActionMenu from '@/app/components/ActionMenu'
import { FileSpreadsheet, Upload } from 'lucide-react'

interface Activacion {
  id: string
  trackingNumber: string
  provider: { name: string }
  etapa: string
  responsable: { name: string }
  notas: string | null
  verificado: boolean
  createdAt: string
}

interface Provider {
  id: string
  name: string
}

interface User {
  id: string
  name: string
}

export default function ActivacionPage() {
  const [activaciones, setActivaciones] = useState<Activacion[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit, setLimit] = useState(25)
  const router = useRouter()
  const { data: session } = useSession()

  // Filter states
  const [providers, setProviders] = useState<Provider[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedProvider, setSelectedProvider] = useState('')
  const [selectedResponsable, setSelectedResponsable] = useState('')
  const [selectedProviderName, setSelectedProviderName] = useState('')
  const [selectedResponsableName, setSelectedResponsableName] = useState('')
  const [selectedEtapa, setSelectedEtapa] = useState('')
  const [selectedVerificado, setSelectedVerificado] = useState('')
  const [availableEtapas, setAvailableEtapas] = useState<string[]>([])

  // Sorting states
  const [sortField, setSortField] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Modal state
  const [selectedActivacion, setSelectedActivacion] = useState<Activacion | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const filteredProviders = providers.filter(p =>
    p.name.toLowerCase().includes(selectedProviderName.toLowerCase())
  )
  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(selectedResponsableName.toLowerCase())
  )

  const fetchActivaciones = async (page: number = 1) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })

      if (selectedProvider) params.append('providerId', selectedProvider)
      if (selectedResponsable) params.append('responsableId', selectedResponsable)
      if (selectedEtapa) params.append('etapa', selectedEtapa)
      if (selectedVerificado) params.append('verificado', selectedVerificado)
      if (sortField) params.append('sortBy', sortField)
      if (sortOrder) params.append('sortOrder', sortOrder)

      const response = await fetch(`/api/activacion?${params}`)
      if (response.ok) {
        const data = await response.json()
        setActivaciones(data.activaciones)
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
        setCurrentPage(page)
      }
    } catch (error) {
      console.error('Error fetching activaciones:', error)
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

      // Fetch users
      const usersResponse = await fetch('/api/users')
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData.users || [])
      }

      // Fetch available etapas
      const etapasResponse = await fetch('/api/activacion/etapas')
      if (etapasResponse.ok) {
        const etapasData = await etapasResponse.json()
        setAvailableEtapas(etapasData.etapas || [])
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
    setSelectedResponsable('')
    setSelectedProviderName('')
    setSelectedResponsableName('')
    setSelectedEtapa('')
    setSelectedVerificado('')
    setCurrentPage(1)
    fetchActivaciones(1)
  }

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit)
    setCurrentPage(1)
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
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

  const deleteActivacion = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta activación? Esta acción no se puede deshacer.')) return

    try {
      const response = await fetch(`/api/activacion/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchActivaciones(currentPage)
      } else {
        const errorData = await response.json()
        alert(`Error al eliminar la activación: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error deleting activacion:', error)
      alert('Error al eliminar la activación')
    }
  }

  useEffect(() => {
    fetchFilterOptions()
  }, [])

  useEffect(() => {
    const providerId = providers.find(p => p.name.toLowerCase() === selectedProviderName.toLowerCase())?.id || ''
    const responsableId = users.find(u => u.name?.toLowerCase() === selectedResponsableName.toLowerCase())?.id || ''
    setSelectedProvider(providerId)
    setSelectedResponsable(responsableId)
  }, [selectedProviderName, selectedResponsableName, providers, users])

  useEffect(() => {
    fetchActivaciones(currentPage)
  }, [currentPage, selectedProvider, selectedResponsable, selectedEtapa, selectedVerificado, limit, sortField, sortOrder])

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
            <h1 className="text-2xl font-semibold text-gray-900">Activación</h1>
            <p className="mt-2 text-sm text-gray-700">
              Lista de todas las activaciones registradas.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-3">
            {(session?.user?.role === 'admin' || session?.user?.role === 'user' || session?.user?.role === 'operario') && (
              <>
                <button
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = '.xlsx,.xls'
                    input.onchange = async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0]
                      if (!file) return

                      const formData = new FormData()
                      formData.append('file', file)

                      try {
                        const response = await fetch('/api/activacion/import', {
                          method: 'POST',
                          body: formData
                        })

                        const result = await response.json()

                        if (response.ok) {
                          alert(result.message)
                          fetchActivaciones(currentPage) // Refresh the list
                        } else {
                          alert(`Error: ${result.error}`)
                        }
                      } catch (error) {
                        console.error('Error importing:', error)
                        alert('Error al importar el archivo')
                      }
                    }
                    input.click()
                  }}
                  className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Importar Excel
                </button>
                <Link
                  href="/activacion/new"
                  className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Nueva Activación
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <label htmlFor="responsable-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Responsable
              </label>
              <input
                type="text"
                id="responsable-filter"
                list="users-datalist"
                value={selectedResponsableName}
                onChange={(e) => setSelectedResponsableName(e.target.value)}
                placeholder="Buscar responsable..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
              />
              <datalist id="users-datalist">
                {filteredUsers.map((user) => (
                  <option key={user.id} value={user.name || user.id} />
                ))}
              </datalist>
            </div>

            <div>
              <label htmlFor="etapa-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Etapa
              </label>
              <select
                id="etapa-filter"
                value={selectedEtapa}
                onChange={(e) => setSelectedEtapa(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
              >
                <option value="">Todas las etapas</option>
                {availableEtapas.map((etapa) => (
                  <option key={etapa} value={etapa}>
                    {etapa}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="verificado-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Verificado
              </label>
              <select
                id="verificado-filter"
                value={selectedVerificado}
                onChange={(e) => setSelectedVerificado(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
              >
                <option value="">Todos</option>
                <option value="true">Verificado</option>
                <option value="false">No verificado</option>
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
                <table className="min-w-full divide-y divide-gray-300 table-fixed">
                  <colgroup>
                    <col style={{ width: '15%' }} /> {/* Tracking Number */}
                    <col style={{ width: '15%' }} /> {/* Proveedor */}
                    <col style={{ width: '10%' }} /> {/* Etapa */}
                    <col style={{ width: '15%' }} /> {/* Responsable */}
                    <col style={{ width: '20%' }} /> {/* Notas */}
                    <col style={{ width: '10%' }} /> {/* Verificado */}
                    <col style={{ width: '15%' }} /> {/* Actions */}
                  </colgroup>
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('trackingNumber')}
                      >
                        <div className="flex items-center">
                          Tracking Number
                          <SortIcon field="trackingNumber" />
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('provider')}
                      >
                        <div className="flex items-center">
                          Proveedor
                          <SortIcon field="provider" />
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('etapa')}
                      >
                        <div className="flex items-center">
                          Etapa
                          <SortIcon field="etapa" />
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('responsable')}
                      >
                        <div className="flex items-center">
                          Responsable
                          <SortIcon field="responsable" />
                        </div>
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Notas
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Verificado
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Acciones</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {activaciones.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-4 pl-4 pr-3 text-center text-sm text-gray-500 sm:pl-6">
                          No hay activaciones registradas
                        </td>
                      </tr>
                    ) : (
                      activaciones.map((activacion) => (
                        <tr
                          key={activacion.id}
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedActivacion(activacion)
                            setShowDetailModal(true)
                          }}
                        >
                          <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                            <div className="font-medium text-gray-900">{activacion.trackingNumber}</div>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500">
                            {activacion.provider.name}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500">
                            {activacion.etapa}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500">
                            {activacion.responsable.name}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500">
                            <div className="truncate" title={activacion.notas || ''}>
                              {activacion.notas || 'N/A'}
                            </div>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500">
                            <input
                              type="checkbox"
                              checked={activacion.verificado}
                              readOnly
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          </td>
                          <td
                            className="relative py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {(session?.user?.role === 'admin' || session?.user?.role === 'user' || session?.user?.role === 'operario') && (
                              <ActionMenu
                                editHref={`/activacion/${activacion.id}/edit`}
                                onDelete={() => deleteActivacion(activacion.id)}
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

        {/* Detail Modal */}
        {showDetailModal && selectedActivacion && (
          <div className="fixed inset-0 z-[9999] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                aria-hidden="true"
                onClick={() => setShowDetailModal(false)}
              ></div>

              <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div className="absolute top-0 right-0 pt-4 pr-4 z-10">
                  <button
                    type="button"
                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => setShowDetailModal(false)}
                  >
                    <span className="sr-only">Cerrar</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="w-full">
                  <div className="mt-3 text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                      Detalle de Activación
                    </h3>

                    <div className="mt-4 border-t border-gray-200">
                      <dl className="divide-y divide-gray-200">
                        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                          <dt className="text-sm font-medium text-gray-500">Tracking Number</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{selectedActivacion.trackingNumber}</dd>
                        </div>

                        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                          <dt className="text-sm font-medium text-gray-500">Proveedor</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{selectedActivacion.provider.name}</dd>
                        </div>

                        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                          <dt className="text-sm font-medium text-gray-500">Etapa</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{selectedActivacion.etapa}</dd>
                        </div>

                        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                          <dt className="text-sm font-medium text-gray-500">Responsable</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{selectedActivacion.responsable.name}</dd>
                        </div>

                        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                          <dt className="text-sm font-medium text-gray-500">Notas</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{selectedActivacion.notas || 'N/A'}</dd>
                        </div>

                        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                          <dt className="text-sm font-medium text-gray-500">Verificado</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {selectedActivacion.verificado ? 'Sí' : 'No'}
                          </dd>
                        </div>

                        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                          <dt className="text-sm font-medium text-gray-500">Fecha de registro</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {new Date(selectedActivacion.createdAt).toLocaleString('es-AR')}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    {(session?.user?.role === 'admin' || session?.user?.role === 'user' || session?.user?.role === 'operario') && (
                      <div className="mt-6 flex justify-end space-x-3">
                        <button
                          type="button"
                          className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                          onClick={() => setShowDetailModal(false)}
                        >
                          Cerrar
                        </button>
                        <Link
                          href={`/activacion/${selectedActivacion.id}/edit`}
                          className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                        >
                          Editar
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        <div className="mt-8 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="text-sm text-gray-700">
              Mostrando {activaciones.length > 0 ? ((currentPage - 1) * limit) + 1 : 0} a {Math.min(currentPage * limit, total)} de {total} resultados
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
                if (selectedResponsable) params.append('responsableId', selectedResponsable)
                if (selectedEtapa) params.append('etapa', selectedEtapa)
                if (selectedVerificado) params.append('verificado', selectedVerificado)
                const url = `/api/activacion/export?${params}`
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