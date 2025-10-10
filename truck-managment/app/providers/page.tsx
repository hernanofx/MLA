'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AppLayout from '@/app/components/AppLayout'
import ActionMenu from '@/app/components/ActionMenu'

interface Provider {
  id: string
  name: string
  createdAt: string
  responsibleId?: string | null
  responsible?: {
    id: string
    name: string
    email: string
  } | null
  _count?: {
    contacts: number
  }
}

interface Contact {
  id: string
  name: string
  email: string
  phone?: string
  createdAt: string
}

interface User {
  id: string
  name: string
  email: string
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit, setLimit] = useState(25)
  const [editingResponsible, setEditingResponsible] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [viewingContactsProvider, setViewingContactsProvider] = useState<Provider | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [contactsLoading, setContactsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchProviders(currentPage)
    fetchUsers()
  }, [currentPage, limit])

  useEffect(() => {
    if (viewingContactsProvider) {
      fetchContacts(viewingContactsProvider.id)
    }
  }, [viewingContactsProvider])

  const fetchProviders = async (page: number = 1) => {
    try {
      const response = await fetch(`/api/providers?page=${page}&limit=${limit}`)
      if (response.ok) {
        const data = await response.json()
        setProviders(data.providers)
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
        setCurrentPage(page)
      }
    } catch (error) {
      console.error('Error fetching providers:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteProvider = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este proveedor?')) return

    try {
      const response = await fetch(`/api/providers/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Refetch current page to update pagination if needed
        fetchProviders(currentPage)
      } else {
        const errorData = await response.json()
        alert(`Error al eliminar el proveedor: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error deleting provider:', error)
      alert('Error de conexión al eliminar el proveedor')
    }
  }

  const fetchContacts = async (providerId: string) => {
    try {
      setContactsLoading(true)
      const response = await fetch(`/api/contacts?providerId=${providerId}`)
      if (response.ok) {
        const data = await response.json()
        setContacts(data)
      }
    } catch (error) {
      console.error('Error fetching contacts:', error)
    } finally {
      setContactsLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      setUsersLoading(true)
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setUsersLoading(false)
    }
  }

  const updateProviderResponsible = async (providerId: string, responsibleId: string | null) => {
    try {
      const response = await fetch(`/api/providers/${providerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ responsibleId })
      })

      if (response.ok) {
        const updatedProvider = await response.json()
        // Update the provider in the local state with the full updated data
        setProviders(providers.map(provider =>
          provider.id === providerId
            ? {
                ...provider,
                ...updatedProvider
              }
            : provider
        ))
        setEditingResponsible(null)
      } else {
        const errorData = await response.json()
        console.error('Error updating provider responsible:', errorData.error)
        alert(`Error al actualizar el responsable: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error updating provider responsible:', error)
      alert('Error de conexión al actualizar el responsable')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
      console.log('Copied to clipboard:', text)
    })
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
            <h1 className="text-2xl font-semibold text-gray-900">Proveedores</h1>
            <p className="mt-2 text-sm text-gray-700">
              Gestiona los proveedores registrados en el sistema.
            </p>
          </div>
          <div className="flex justify-center sm:justify-end">
            <Link
              href="/providers/new"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 h-10"
            >
              Nuevo Proveedor
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
                        Nombre
                      </th>
                      <th scope="col" className="hidden sm:table-cell px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Responsable
                      </th>
                      <th scope="col" className="hidden sm:table-cell px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Contactos
                      </th>
                      <th scope="col" className="hidden md:table-cell px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Fecha de Creación
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {providers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-2 pl-4 pr-3 text-center text-sm text-gray-500 sm:pl-6">
                          No hay proveedores registrados
                        </td>
                      </tr>
                    ) : (
                      providers.map((provider) => (
                        <tr key={provider.id} className="h-12">
                          <td className="whitespace-nowrap py-2 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">
                            {provider.name}
                          </td>
                          <td className="hidden sm:table-cell whitespace-nowrap px-3 py-2 text-sm text-gray-500">
                            {editingResponsible === provider.id ? (
                              <select
                                value={provider.responsibleId || ''}
                                onChange={(e) => updateProviderResponsible(provider.id, e.target.value || null)}
                                onBlur={() => setEditingResponsible(null)}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                                autoFocus
                              >
                                <option value="">Sin asignar</option>
                                {users.map((user) => (
                                  <option key={user.id} value={user.id}>
                                    {user.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span
                                className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                                onClick={() => setEditingResponsible(provider.id)}
                              >
                                {provider.responsible ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    {provider.responsible.name}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    Sin asignar
                                  </span>
                                )}
                              </span>
                            )}
                          </td>
                          <td className="hidden sm:table-cell whitespace-nowrap px-3 py-2 text-sm text-gray-500">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {provider._count?.contacts || 0} contacto{provider._count?.contacts !== 1 ? 's' : ''}
                            </span>
                          </td>
                          <td className="hidden md:table-cell whitespace-nowrap px-3 py-2 text-sm text-gray-500">
                            {new Date(provider.createdAt).toLocaleDateString()}
                          </td>
                          <td className="relative whitespace-nowrap py-2 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <ActionMenu
                              onViewContacts={() => setViewingContactsProvider(provider)}
                              editHref={`/providers/${provider.id}/edit`}
                              onDelete={() => deleteProvider(provider.id)}
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
              Mostrando {providers.length > 0 ? ((currentPage - 1) * limit) + 1 : 0} a {Math.min(currentPage * limit, total)} de {total} resultados
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

      {/* Contacts Modal */}
      {viewingContactsProvider && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
          <div className="relative top-4 mx-auto max-w-md w-full border shadow-lg rounded-lg bg-white">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Contactos de {viewingContactsProvider.name}
                </h3>
                <button
                  onClick={() => setViewingContactsProvider(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Cerrar</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {contactsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                </div>
              ) : contacts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay contactos registrados para este proveedor.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="border border-gray-200 rounded-md p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{contact.name}</h4>
                          <p className="text-sm text-gray-500">{contact.email}</p>
                          {contact.phone && (
                            <p className="text-sm text-gray-500">{contact.phone}</p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => copyToClipboard(contact.name)}
                            className="text-xs text-indigo-600 hover:text-indigo-500"
                            title="Copiar nombre"
                          >
                            Copiar nombre
                          </button>
                          <button
                            onClick={() => copyToClipboard(contact.email)}
                            className="text-xs text-indigo-600 hover:text-indigo-500"
                            title="Copiar email"
                          >
                            Copiar email
                          </button>
                          {contact.phone && (
                            <button
                              onClick={() => copyToClipboard(contact.phone!)}
                              className="text-xs text-indigo-600 hover:text-indigo-500"
                              title="Copiar teléfono"
                            >
                              Copiar teléfono
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setViewingContactsProvider(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}