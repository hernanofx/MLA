'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AppLayout from '@/app/components/AppLayout'

interface Entry {
  id: string
  arrivalTime: string | null
  departureTime: string | null
  week: number
  month: number
  durationMinutes: number | null
  createdAt: string
  provider: { name: string }
  truck: { licensePlate: string }
}

export default function EntriesPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 10

  const fetchEntries = async (page: number = 1) => {
    try {
      const response = await fetch(`/api/entries?page=${page}&limit=${limit}`)
      if (response.ok) {
        const data = await response.json()
        setEntries(data.entries)
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
        setCurrentPage(page)
      }
    } catch (error) {
      console.error('Error fetching entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  useEffect(() => {
    fetchEntries(currentPage)
  }, [currentPage])

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
            <h1 className="text-2xl font-semibold text-gray-900">Entradas y Salidas</h1>
            <p className="mt-2 text-sm text-gray-700">
              Lista de todas las entradas y salidas registradas.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <Link
              href="/entries/new"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Nueva Entrada
            </Link>
          </div>
        </div>
        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Proveedor
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden sm:table-cell">
                        Camión
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden md:table-cell">
                        Llegada
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden md:table-cell">
                        Salida
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden lg:table-cell">
                        Duración
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden xl:table-cell">
                        Semana
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden xl:table-cell">
                        Mes
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Acciones</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {entries.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-4 pl-4 pr-3 text-center text-sm text-gray-500 sm:pl-6 md:col-span-6 lg:col-span-7 xl:col-span-8">
                          No hay entradas registradas
                        </td>
                      </tr>
                    ) : (
                      entries.map((entry) => (
                        <tr key={entry.id}>
                          <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                            <div className="font-medium text-gray-900">{entry.provider.name}</div>
                            <div className="text-gray-500 sm:hidden">{entry.truck.licensePlate}</div>
                            <div className="text-gray-400 text-xs sm:hidden mt-1">
                              {entry.arrivalTime ? new Date(entry.arrivalTime).toLocaleDateString() : 'Sin llegada'}
                            </div>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 hidden sm:table-cell">
                            {entry.truck.licensePlate}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 hidden md:table-cell">
                            {entry.arrivalTime ? new Date(entry.arrivalTime).toLocaleString() : 'No registrada'}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 hidden md:table-cell">
                            {entry.departureTime ? new Date(entry.departureTime).toLocaleString() : 'No registrada'}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 hidden lg:table-cell">
                            {entry.durationMinutes ? `${entry.durationMinutes} min` : 'N/A'}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 hidden xl:table-cell">
                            {entry.week}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 hidden xl:table-cell">
                            {entry.month}
                          </td>
                          <td className="relative py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <Link
                              href={`/entries/${entry.id}/edit`}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Editar
                            </Link>
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
        {totalPages > 1 && (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-700 text-center sm:text-left">
              Mostrando {entries.length > 0 ? ((currentPage - 1) * limit) + 1 : 0} a {Math.min(currentPage * limit, total)} de {total} resultados
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
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
          </div>
        )}
      </div>
    </AppLayout>
  )
}