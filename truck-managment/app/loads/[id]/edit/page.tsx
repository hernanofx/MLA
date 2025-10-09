'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AppLayout from '@/app/components/AppLayout'

interface Provider {
  id: string
  name: string
}

interface Truck {
  id: string
  licensePlate: string
}

interface Load {
  id: string
  providerId: string
  truckId: string
  arrivalTime: string | null
  departureTime: string | null
  week: number
  month: number
  durationMinutes: number | null
  quantity: string | null
  container: string | null
  provider: { name: string }
  truck: { licensePlate: string }
}

export default function EditLoadPage() {
  const [load, setLoad] = useState<Load | null>(null)
  const [providers, setProviders] = useState<Provider[]>([])
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [selectedProvider, setSelectedProvider] = useState('')
  const [selectedTruck, setSelectedTruck] = useState('')
  const [arrivalChecked, setArrivalChecked] = useState(false)
  const [departureChecked, setDepartureChecked] = useState(false)
  const [arrivalTime, setArrivalTime] = useState<string | null>(null)
  const [departureTime, setDepartureTime] = useState<string | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const [quantity, setQuantity] = useState('')
  const [container, setContainer] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  useEffect(() => {
    fetchLoad()
    fetchProviders()
    fetchTrucks()
  }, [id])

  useEffect(() => {
    if (arrivalTime && departureTime) {
      const arrival = new Date(arrivalTime)
      const departure = new Date(departureTime)
      const diffMinutes = Math.round((departure.getTime() - arrival.getTime()) / (1000 * 60))
      setDuration(diffMinutes > 0 ? diffMinutes : 0)
    } else {
      setDuration(null)
    }
  }, [arrivalTime, departureTime])

  const fetchLoad = async () => {
    try {
      const response = await fetch(`/api/loads/${id}`)
      if (response.ok) {
        const loadData: Load = await response.json()
        setLoad(loadData)
        setSelectedProvider(loadData.providerId)
        setSelectedTruck(loadData.truck.licensePlate)
        setArrivalTime(loadData.arrivalTime)
        setDepartureTime(loadData.departureTime)
        setArrivalChecked(!!loadData.arrivalTime)
        setDepartureChecked(!!loadData.departureTime)
        setQuantity(loadData.quantity || '')
        setContainer(loadData.container || '')
      } else {
        setError('Carga no encontrada')
      }
    } catch (error) {
      setError('Error al cargar carga')
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

  const fetchTrucks = async () => {
    try {
      const response = await fetch('/api/trucks?page=1&limit=1000')
      if (response.ok) {
        const data = await response.json()
        setTrucks(data.trucks || [])
      }
    } catch (error) {
      console.error('Error fetching trucks:', error)
    }
  }

  const handleArrivalCheck = () => {
    if (!arrivalChecked) {
      const now = new Date().toISOString()
      setArrivalTime(now)
    } else {
      setArrivalTime(null)
    }
    setArrivalChecked(!arrivalChecked)
  }

  const handleDepartureCheck = () => {
    if (!departureChecked) {
      const now = new Date().toISOString()
      setDepartureTime(now)
    } else {
      setDepartureTime(null)
    }
    setDepartureChecked(!departureChecked)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Find or create truck by license plate
      let truck = trucks.find(t => t.licensePlate === selectedTruck)
      if (!truck) {
        // Create new truck
        const createResponse = await fetch('/api/trucks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            licensePlate: selectedTruck
          })
        })
        if (createResponse.ok) {
          const newTruck = await createResponse.json() as Truck
          truck = newTruck
          setTrucks([...trucks, newTruck])
        } else {
          throw new Error('Error creating truck')
        }
      }

      if (!truck) {
        throw new Error('Truck not found')
      }

      const response = await fetch(`/api/loads/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          providerId: selectedProvider,
          truckId: truck.id,
          arrivalTime,
          departureTime,
          quantity: quantity || null,
          container: container || null
        })
      })

      if (response.ok) {
        router.push('/loads')
      } else {
        const data = await response.json()
        setError(data.error || 'Error al actualizar carga')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
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

  if (error && !load) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
          <a href="/loads" className="text-indigo-600 hover:text-indigo-900 mt-4 inline-block">
            ← Volver a Cargas
          </a>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Editar Carga</h1>
          <p className="mt-2 text-sm text-gray-700">
            Modifica los datos de la carga.
          </p>
        </div>
        <div className="max-w-md mx-auto sm:max-w-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-2">
                Proveedor
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
              <label htmlFor="truck" className="block text-sm font-medium text-gray-700 mb-2">
                Camión (Patente)
              </label>
              <input
                id="truck"
                type="text"
                value={selectedTruck}
                onChange={(e) => setSelectedTruck(e.target.value)}
                list="truck-list"
                placeholder="Escribe o selecciona patente"
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10 px-3 text-gray-900"
              />
              <datalist id="truck-list">
                {trucks.map((truck) => (
                  <option key={truck.id} value={truck.licensePlate} />
                ))}
              </datalist>
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad
              </label>
              <input
                id="quantity"
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Ej: 1000 kg, 50 unidades"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10 px-3 text-gray-900"
              />
            </div>

            <div>
              <label htmlFor="container" className="block text-sm font-medium text-gray-700 mb-2">
                Contenedora
              </label>
              <input
                id="container"
                type="text"
                value={container}
                onChange={(e) => setContainer(e.target.value)}
                placeholder="Ej: ABC123, CONT-456"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10 px-3 text-gray-900"
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Horario de Llegada
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={arrivalChecked}
                    onChange={handleArrivalCheck}
                    className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-900 font-medium">
                    Marcar llegada
                  </span>
                </div>
                {arrivalTime && (
                  <p className="mt-2 text-sm text-gray-500 ml-8">
                    {new Date(arrivalTime).toLocaleString()}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Horario de Salida
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={departureChecked}
                    onChange={handleDepartureCheck}
                    className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-900 font-medium">
                    Marcar salida
                  </span>
                </div>
                {departureTime && (
                  <p className="mt-2 text-sm text-gray-500 ml-8">
                    {new Date(departureTime).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {duration !== null && (
              <div className="bg-gray-50 p-4 rounded-md">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiempo Total (minutos)
                </label>
                <p className="text-lg font-semibold text-gray-900">{duration} minutos</p>
              </div>
            )}

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
                {loading ? 'Actualizando...' : 'Actualizar Carga'}
              </button>
              <a
                href="/loads"
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