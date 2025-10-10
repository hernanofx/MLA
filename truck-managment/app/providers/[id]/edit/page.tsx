'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AppLayout from '@/app/components/AppLayout'
import ActionMenu from '@/app/components/ActionMenu'
import { Plus, User, Mail, Phone } from 'lucide-react'

interface Provider {
  id: string
  name: string
  responsibleId?: string
  responsible?: {
    id: string
    name: string
    email: string
  }
}

interface User {
  id: string
  name: string
  email: string
}

interface Contact {
  id: string
  name: string
  email: string
  phone?: string
  createdAt: string
}

export default function EditProviderPage() {
  const [name, setName] = useState('')
  const [responsibleId, setResponsibleId] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [contactsLoading, setContactsLoading] = useState(false)
  const [usersLoading, setUsersLoading] = useState(false)
  const [error, setError] = useState('')
  const [showContactForm, setShowContactForm] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  useEffect(() => {
    fetchProvider()
    fetchContacts()
    fetchUsers()
  }, [id])

  const fetchProvider = async () => {
    try {
      const response = await fetch(`/api/providers/${id}`)
      if (response.ok) {
        const provider: Provider = await response.json()
        setName(provider.name)
        setResponsibleId(provider.responsibleId || '')
      } else {
        setError('Proveedor no encontrado')
      }
    } catch (error) {
      setError('Error al cargar proveedor')
    } finally {
      setFetchLoading(false)
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

  const fetchContacts = async () => {
    try {
      setContactsLoading(true)
      const response = await fetch(`/api/contacts?providerId=${id}`)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/providers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          name,
          responsibleId: responsibleId || null
        })
      })

      if (response.ok) {
        router.push('/providers')
      } else {
        const data = await response.json()
        setError(data.error || 'Error al actualizar proveedor')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este contacto?')) return

    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setContacts(contacts.filter(contact => contact.id !== contactId))
      } else {
        alert('Error al eliminar el contacto')
      }
    } catch (error) {
      console.error('Error deleting contact:', error)
      alert('Error al eliminar el contacto')
    }
  }

  if (fetchLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </AppLayout>
    )
  }

  if (error && !name) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
          <a href="/providers" className="text-indigo-600 hover:text-indigo-900 mt-4 inline-block">
            ← Volver a Proveedores
          </a>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Editar Proveedor</h1>
          <p className="mt-2 text-sm text-gray-700">
            Modifica los datos del proveedor y gestiona sus contactos.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Provider Form */}
          <div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Información del Proveedor</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Proveedor
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10 px-3 text-gray-900"
                  />
                </div>

                <div>
                  <label htmlFor="responsible" className="block text-sm font-medium text-gray-700 mb-2">
                    Responsable
                  </label>
                  <select
                    id="responsible"
                    value={responsibleId}
                    onChange={(e) => setResponsibleId(e.target.value)}
                    disabled={usersLoading}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10 px-3 text-gray-900"
                  >
                    <option value="">Sin asignar</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                  {usersLoading && (
                    <p className="mt-1 text-sm text-gray-500">Cargando usuarios...</p>
                  )}
                </div>

                {error && (
                  <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 h-12"
                >
                  {loading ? 'Actualizando...' : 'Actualizar Proveedor'}
                </button>
              </form>
            </div>
          </div>

          {/* Contacts Section */}
          <div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Contactos</h2>
                <button
                  onClick={() => setShowContactForm(true)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Contacto
                </button>
              </div>

              {contactsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                </div>
              ) : contacts.length === 0 ? (
                <div className="text-center py-8">
                  <User className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No hay contactos</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Comienza agregando un contacto para este proveedor.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-indigo-600" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                          <p className="text-sm text-gray-500 flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {contact.email}
                          </p>
                          {contact.phone && (
                            <p className="text-sm text-gray-500 flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {contact.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      <ActionMenu
                        onEdit={() => setEditingContact(contact)}
                        onDelete={() => handleDeleteContact(contact.id)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Form Modal */}
        {(showContactForm || editingContact) && (
          <ContactForm
            contact={editingContact}
            providerId={id}
            onClose={() => {
              setShowContactForm(false)
              setEditingContact(null)
            }}
            onSuccess={() => {
              setShowContactForm(false)
              setEditingContact(null)
              fetchContacts()
            }}
          />
        )}

        <div className="mt-8 flex justify-start">
          <a
            href="/providers"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            ← Volver a Proveedores
          </a>
        </div>
      </div>
    </AppLayout>
  )
}

interface ContactFormProps {
  contact?: Contact | null
  providerId: string
  onClose: () => void
  onSuccess: () => void
}

function ContactForm({ contact, providerId, onClose, onSuccess }: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: contact?.name || '',
    email: contact?.email || '',
    phone: contact?.phone || ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const url = contact ? `/api/contacts/${contact.id}` : '/api/contacts'
      const method = contact ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          providerId
        }),
      })

      if (response.ok) {
        onSuccess()
      } else {
        const data = await response.json()
        setError(data.error || 'Error al guardar el contacto')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
      <div className="relative top-4 mx-auto max-w-md w-full border shadow-lg rounded-lg bg-white">
        <div className="p-4 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {contact ? 'Editar Contacto' : 'Crear Contacto'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700">
                Nombre
              </label>
              <input
                type="text"
                id="contact-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 h-10 px-3"
                required
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="contact-email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 h-10 px-3"
                required
              />
            </div>
            <div>
              <label htmlFor="contact-phone" className="block text-sm font-medium text-gray-700">
                Teléfono
              </label>
              <input
                type="tel"
                id="contact-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 h-10 px-3"
                placeholder="+1234567890"
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Guardando...' : (contact ? 'Actualizar' : 'Crear')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}