'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import AppLayout from '@/app/components/AppLayout'

export default function NewTruckPage() {
  const [licensePlate, setLicensePlate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'admin') {
      router.push('/trucks')
      return
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </AppLayout>
    )
  }

  if (!session || session.user.role !== 'admin') {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/trucks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ licensePlate })
      })

      if (response.ok) {
        router.push('/trucks')
      } else {
        const data = await response.json()
        setError(data.error || 'Error al crear camión')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Nuevo Camión</h1>
          <p className="mt-2 text-sm text-gray-700">
            Agrega un nuevo camión al sistema.
          </p>
        </div>
        <div className="max-w-md mx-auto sm:max-w-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="licensePlate" className="block text-sm font-medium text-gray-700 mb-2">
                Patente del Camión
              </label>
              <input
                type="text"
                id="licensePlate"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10 px-3 text-gray-900"
              />
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
                {loading ? 'Creando...' : 'Crear Camión'}
              </button>
              <a
                href="/trucks"
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