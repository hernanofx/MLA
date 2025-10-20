'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Bell, Save, CheckCircle, XCircle, Settings, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Sidebar from '@/app/components/Sidebar'

interface Notification {
  id: string
  type: string
  message: string
  createdAt: string
}

interface Preferences {
  newProvider: boolean
  newTruck: boolean
  newEntry: boolean
  newLoad: boolean
  newInventory: boolean
  newZone: boolean
  editZone: boolean
  assignProvider: boolean
  unassignProvider: boolean
  newShipment: boolean
}

export default function NotificationsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [preferences, setPreferences] = useState<Preferences>({
    newProvider: false,
    newTruck: false,
    newEntry: false,
    newLoad: false,
    newInventory: false,
    newZone: false,
    editZone: false,
    assignProvider: false,
    unassignProvider: false,
    newShipment: false
  })
  const [activeTab, setActiveTab] = useState<'notifications' | 'preferences'>('notifications')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (session) {
      fetchNotifications()
    }
  }, [session])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
        setPreferences(data.preferences)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'markAsRead' })
      })

      if (response.ok) {
        setNotifications([])
        setSuccess('Todas las notificaciones han sido eliminadas')
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (error) {
      setError('Error al eliminar notificaciones')
    }
  }

  const updatePreferences = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      })

      if (response.ok) {
        setSuccess('Preferencias actualizadas exitosamente')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError('Error al actualizar preferencias')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'NEW_PROVIDER':
        return '🏢'
      case 'NEW_TRUCK':
        return '🚛'
      case 'NEW_ENTRY':
        return '📥'
      case 'NEW_LOAD':
        return '📦'
      case 'NEW_INVENTORY':
        return '📋'
      case 'NEW_ZONE':
        return '🗺️'
      case 'EDIT_ZONE':
        return '✏️'
      case 'ASSIGN_PROVIDER':
        return '➕'
      case 'UNASSIGN_PROVIDER':
        return '➖'
      case 'NEW_SHIPMENT':
        return '📦'
      default:
        return '🔔'
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      })

      if (response.ok) {
        setSuccess('Preferencias guardadas exitosamente')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const data = await response.json()
        setError(data.error || 'Error al guardar las preferencias')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <Link
                href="/dashboard"
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Notificaciones</h1>
              <p className="mt-2 text-gray-600">Gestiona tus notificaciones y preferencias</p>
            </div>

            {/* Tabs */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex">
                  <button
                    onClick={() => setActiveTab('notifications')}
                    className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'notifications'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Bell className="h-4 w-4 inline mr-2" />
                    Notificaciones ({notifications.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('preferences')}
                    className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'preferences'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Settings className="h-4 w-4 inline mr-2" />
                    Preferencias
                  </button>
                </nav>
              </div>

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="p-6">
                  {notifications.length > 0 && (
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-medium text-gray-900">Notificaciones Recientes</h3>
                      <button
                        onClick={markAllAsRead}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Marcar todas como leídas
                      </button>
                    </div>
                  )}

                  {notifications.length === 0 ? (
                    <div className="text-center py-12">
                      <Bell className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No hay notificaciones</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Todas las notificaciones han sido revisadas.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="flex items-start p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex-shrink-0">
                            <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                          </div>
                          <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(notification.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <form onSubmit={updatePreferences} className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Tipos de Notificaciones</h3>
                    <p className="text-sm text-gray-600 mb-6">
                      Selecciona qué eventos quieres recibir como notificaciones.
                    </p>

                    <div className="space-y-4">
                      <div className="flex items-center">
                        <input
                          id="newProvider"
                          type="checkbox"
                          checked={preferences.newProvider}
                          onChange={(e) => setPreferences({ ...preferences, newProvider: e.target.checked })}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="newProvider" className="ml-3 text-sm font-medium text-gray-700">
                          🏢 Nuevos Proveedores
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          id="newTruck"
                          type="checkbox"
                          checked={preferences.newTruck}
                          onChange={(e) => setPreferences({ ...preferences, newTruck: e.target.checked })}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="newTruck" className="ml-3 text-sm font-medium text-gray-700">
                          🚛 Nuevos Camiones
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          id="newEntry"
                          type="checkbox"
                          checked={preferences.newEntry}
                          onChange={(e) => setPreferences({ ...preferences, newEntry: e.target.checked })}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="newEntry" className="ml-3 text-sm font-medium text-gray-700">
                          📥 Nuevas Entradas
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          id="newLoad"
                          type="checkbox"
                          checked={preferences.newLoad}
                          onChange={(e) => setPreferences({ ...preferences, newLoad: e.target.checked })}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="newLoad" className="ml-3 text-sm font-medium text-gray-700">
                          📦 Nuevas Cargas
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          id="newShipment"
                          type="checkbox"
                          checked={preferences.newShipment}
                          onChange={(e) => setPreferences({ ...preferences, newShipment: e.target.checked })}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="newShipment" className="ml-3 text-sm font-medium text-gray-700">
                          📦 Nuevos Lotes VMS
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          id="newInventory"
                          type="checkbox"
                          checked={preferences.newInventory}
                          onChange={(e) => setPreferences({ ...preferences, newInventory: e.target.checked })}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="newInventory" className="ml-3 text-sm font-medium text-gray-700">
                          📋 Nuevos Registros de Inventario
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          id="newZone"
                          type="checkbox"
                          checked={preferences.newZone}
                          onChange={(e) => setPreferences({ ...preferences, newZone: e.target.checked })}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="newZone" className="ml-3 text-sm font-medium text-gray-700">
                          🗺️ Nuevas Zonas
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          id="editZone"
                          type="checkbox"
                          checked={preferences.editZone}
                          onChange={(e) => setPreferences({ ...preferences, editZone: e.target.checked })}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="editZone" className="ml-3 text-sm font-medium text-gray-700">
                          ✏️ Ediciones de Zonas
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          id="assignProvider"
                          type="checkbox"
                          checked={preferences.assignProvider}
                          onChange={(e) => setPreferences({ ...preferences, assignProvider: e.target.checked })}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="assignProvider" className="ml-3 text-sm font-medium text-gray-700">
                          ➕ Asignaciones de Proveedores a Zonas
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          id="unassignProvider"
                          type="checkbox"
                          checked={preferences.unassignProvider}
                          onChange={(e) => setPreferences({ ...preferences, unassignProvider: e.target.checked })}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="unassignProvider" className="ml-3 text-sm font-medium text-gray-700">
                          ➖ Desasignaciones de Proveedores de Zonas
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Status Messages */}
                  {error && (
                    <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}

                  {success && (
                    <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-md">
                      <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                      <p className="text-sm text-green-800">{success}</p>
                    </div>
                  )}

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Settings className="h-4 w-4 mr-2" />
                          Guardar Preferencias
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}