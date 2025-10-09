'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AppLayout from '@/app/components/AppLayout'
import ActionMenu from '@/app/components/ActionMenu'

interface Truck {
  id: string
  licensePlate: string
  createdAt: string
}

export default function TrucksPage() {
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit, setLimit] = useState(25)
  const router = useRouter()

  useEffect(() => {
    fetchTrucks(currentPage)
  }, [currentPage, limit])

  const fetchTrucks = async (page: number = 1) => {
    try {
      const response = await fetch(`/api/trucks?page=${page}&limit=${limit}`)
      if (response.ok) {
        const data = await response.json()
        setTrucks(data.trucks)
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
        setCurrentPage(page)
      }
    } catch (error) {
      console.error('Error fetching trucks:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteTruck = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este camión?')) return

    try {
      const response = await fetch(`/api/trucks/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Refetch current page to update pagination if needed
        fetchTrucks(currentPage)
      }
    } catch (error) {
      console.error('Error deleting truck:', error)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit)
    setCurrentPage(1)
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
        <div className="sm:flex sm:items-center sm:justify-between">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl font-semibold text-gray-900">Camiones</h1>
            <p className="mt-2 text-sm text-gray-700">
              Gestiona los camiones registrados en el sistema.
            </p>
          </div>
          <div className="flex justify-center sm:justify-end">
            <Link
              href="/trucks/new"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 h-10"
            >
              Nuevo Camión
            </Link>
          </div>
        </div>
        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Placa
                      </th>
                      <th scope="col" className="hidden sm:table-cell px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Fecha de Creación
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {trucks.length === 0 ? (
                      <tr>
                                        <td colSpan={4} className="px-6 py-10 text-center text-sm leading-6 text-gray-500">
                          No hay camiones registrados
                        </td>
                      </tr>
                    ) : (
                      trucks.map((truck) => (
                        <tr key={truck.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            {truck.licensePlate}
                          </td>
                          <td className="hidden sm:table-cell whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {new Date(truck.createdAt).toLocaleDateString()}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <ActionMenu
                              editHref={`/trucks/${truck.id}/edit`}
                              onDelete={() => deleteTruck(truck.id)}
                            />
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
              Mostrando {trucks.length > 0 ? ((currentPage - 1) * limit) + 1 : 0} a {Math.min(currentPage * limit, total)} de {total} resultados
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
          {totalPages > 1 && (
            <div className="flex flex-wrap justify-center sm:justify-end gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed h-10"
              >
                Anterior
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium h-10 ${
                    page === currentPage
                      ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed h-10"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}