'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import AppLayout from '@/app/components/AppLayout'

interface Provider {
  id: string
  name: string
}

interface User {
  id: string
  name: string
}

interface ActivacionData {
  id: string
  trackingNumber: string
  providerId: string
  etapa: string
  responsableId: string
  notas: string | null
  verificado: boolean
  provider: { name: string }
  responsable: { name: string }
}

export default function EditActivacionPage() {
  const [activacion, setActivacion] = useState<ActivacionData | null>(null)
  const [providers, setProviders] = useState<Provider[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedProvider, setSelectedProvider] = useState('')
  const [selectedResponsable, setSelectedResponsable] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [etapa, setEtapa] = useState('')
  const [notas, setNotas] = useState('')
  const [verificado, setVerificado] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'loading') return
    if (!session || !['admin', 'user', 'operario'].includes(session.user.role)) {
      router.push('/activacion')
      return
    }
    fetchActivacion()
    fetchProviders()
    fetchUsers()
  }, [id, session, status])

  const fetchActivacion = async () => {
    try {
      const response = await fetch(`/api/activacion/${id}`)
      if (response.ok) {
        const activacionData: ActivacionData = await response.json()
        setActivacion(activacionData)
        setSelectedProvider(activacionData.providerId)
        setSelectedResponsable(activacionData.responsableId)
        setTrackingNumber(activacionData.trackingNumber)
        setEtapa(activacionData.etapa)
        setNotas(activacionData.notas || '')
        setVerificado(activacionData.verificado)
      } else {
        setError('Activación no encontrada')
      }
    } catch (error) {
      setError('Error al cargar activación')
    } finally {
      setFetchLoading(false)
    }
  }

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/providers?page=1&limit=1000')
      if (response.ok) {
        const data = await response.json()
        setProviders(data.providers || [])
      }
    } catch (error) {
      console.error('Error fetching providers:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users?page=1&limit=1000')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/activacion/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          trackingNumber,
          providerId: selectedProvider,
          etapa,
          responsableId: selectedResponsable,
          notas: notas || null,
          verificado
        })
      })

      if (response.ok) {
        router.push('/activacion')
      } else {
        const data = await response.json()
        setError(data.error || 'Error al actualizar activación')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || fetchLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </AppLayout>
    )
  }

  if (!session || !['admin', 'user', 'operario'].includes(session.user.role)) {
    return null
  }

  if (error && !activacion) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
          <a href="/activacion" className="text-indigo-600 hover:text-indigo-900 mt-4 inline-block">
            ← Volver a Activaciones
          </a>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Editar Activación</h1>
          <p className="mt-2 text-sm text-gray-700">
            Modifica los datos de la activación.
          </p>
        </div>
        <div className="max-w-md mx-auto sm:max-w-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="trackingNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Tracking Number *
              </label>
              <input
                id="trackingNumber"
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10 px-3 text-gray-900"
              />
            </div>

            <div>
              <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-2">
                Proveedor *
              </label>
              <select
                id="provider"
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10 px-3 text-gray-900"
              >
                <option value="">Seleccionar proveedor</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="etapa" className="block text-sm font-medium text-gray-700 mb-2">
                Etapa *
              </label>
              <input
                id="etapa"
                type="text"
                value={etapa}
                onChange={(e) => setEtapa(e.target.value)}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10 px-3 text-gray-900"
              />
            </div>

            <div>
              <label htmlFor="responsable" className="block text-sm font-medium text-gray-700 mb-2">
                Responsable *
              </label>
              <select
                id="responsable"
                value={selectedResponsable}
                onChange={(e) => setSelectedResponsable(e.target.value)}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10 px-3 text-gray-900"
              >
                <option value="">Seleccionar responsable</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.id}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="notas" className="block text-sm font-medium text-gray-700 mb-2">
                Notas
              </label>
              <textarea
                id="notas"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verificado
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={verificado}
                  onChange={(e) => setVerificado(e.target.checked)}
                  className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-900">Marcar como verificado</span>
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 h-12"
              >
                {loading ? 'Actualizando...' : 'Actualizar Activación'}
              </button>
              <a
                href="/activacion"
                className="flex-1 flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 h-12 items-center"
              >
                Cancelar
              </a>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  )
}