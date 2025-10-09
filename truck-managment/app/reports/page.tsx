'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/app/components/AppLayout'
import { BarChart3, Users, Clock, Filter, Truck, Package } from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Bar, Pie } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface Stats {
  entriesByMonth: { month: number; count: number }[]
  loadsByMonth: { month: number; count: number }[]
  entriesByProvider: { provider: string; count: number }[]
  loadsByProvider: { provider: string; count: number }[]
  trucksByMonth: { month: number; count: number }[]
  trucksByMonthLoads: { month: number; count: number }[]
  avgDuration: number | null
  avgDurationLoads: number | null
}

interface FilterOptions {
  weeks: number[]
  months: number[]
  providers: { id: string; name: string }[]
}

export default function ReportsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null)
  const [filters, setFilters] = useState({
    week: '',
    month: '',
    providerId: ''
  })

  useEffect(() => {
    fetchFilterOptions()
    fetchStats()
  }, [])

  useEffect(() => {
    fetchStats()
  }, [filters])

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch('/api/stats/filter-options')
      if (response.ok) {
        const data = await response.json()
        setFilterOptions(data)
      }
    } catch (error) {
      console.error('Error fetching filter options:', error)
    }
  }

  const fetchStats = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.week) params.append('week', filters.week)
      if (filters.month) params.append('month', filters.month)
      if (filters.providerId) params.append('providerId', filters.providerId)

      const url = `/api/stats${params.toString() ? '?' + params.toString() : ''}`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      week: '',
      month: '',
      providerId: ''
    })
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

  if (!stats) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-gray-700">Error al cargar datos</p>
        </div>
      </AppLayout>
    )
  }

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const barData = {
    labels: stats.entriesByMonth.map(item => monthNames[item.month - 1]),
    datasets: [
      {
        label: 'Entradas por Mes',
        data: stats.entriesByMonth.map(item => item.count),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  }

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Distribución de Entradas por Mes',
      },
    },
  }

  const pieData = {
    labels: stats.entriesByProvider.map(item => item.provider),
    datasets: [
      {
        data: stats.entriesByProvider.map(item => item.count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  }

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Entradas por Proveedor',
      },
    },
  }

  const trucksBarData = {
    labels: stats.trucksByMonth.map(item => monthNames[item.month - 1]),
    datasets: [
      {
        label: 'Camiones por Mes (Entradas)',
        data: stats.trucksByMonth.map(item => item.count),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      },
    ],
  }

  const trucksBarOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Tendencia de Camiones por Mes (Entradas)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  }

  const loadsBarData = {
    labels: stats.loadsByMonth.map(item => monthNames[item.month - 1]),
    datasets: [
      {
        label: 'Cargas por Mes',
        data: stats.loadsByMonth.map(item => item.count),
        backgroundColor: 'rgba(168, 85, 247, 0.8)',
        borderColor: 'rgba(168, 85, 247, 1)',
        borderWidth: 1,
      },
    ],
  }

  const loadsBarOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Distribución de Cargas por Mes',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  }

  const loadsPieData = {
    labels: stats.loadsByProvider.map(item => item.provider),
    datasets: [
      {
        data: stats.loadsByProvider.map(item => item.count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  }

  const loadsPieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Cargas por Proveedor',
      },
    },
  }

  return (
    <AppLayout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Reportes y Analytics</h1>
          <p className="mt-2 text-sm text-gray-600">
            Visualiza estadísticas y tendencias de las entradas y salidas.
          </p>
        </div>

        {/* Filters Section */}
        <div className="bg-gray-50 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-300 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Filter className="h-5 w-5 text-gray-500 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Filtros</h2>
            </div>
            {(filters.week || filters.month || filters.providerId) && (
              <button
                onClick={clearFilters}
                className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Week Filter */}
            <div>
              <label htmlFor="week-filter" className="block text-sm font-medium text-gray-900 mb-1">
                Semana del Año
              </label>
              <select
                id="week-filter"
                value={filters.week}
                onChange={(e) => handleFilterChange('week', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white text-gray-900"
              >
                <option value="">Todas las semanas</option>
                {filterOptions?.weeks.map((week) => (
                  <option key={week} value={week}>
                    Semana {week}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Filter */}
            <div>
              <label htmlFor="month-filter" className="block text-sm font-medium text-gray-900 mb-1">
                Mes del Año
              </label>
              <select
                id="month-filter"
                value={filters.month}
                onChange={(e) => handleFilterChange('month', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white text-gray-900"
              >
                <option value="">Todos los meses</option>
                {filterOptions?.months.map((month) => (
                  <option key={month} value={month}>
                    {monthNames[month - 1]}
                  </option>
                ))}
              </select>
            </div>

            {/* Provider Filter */}
            <div>
              <label htmlFor="provider-filter" className="block text-sm font-medium text-gray-900 mb-1">
                Proveedor
              </label>
              <select
                id="provider-filter"
                value={filters.providerId}
                onChange={(e) => handleFilterChange('providerId', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white text-gray-900"
              >
                <option value="">Todos los proveedores</option>
                {filterOptions?.providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
            <Bar data={barData} options={barOptions} />
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
            <Pie data={pieData} options={pieOptions} />
          </div>
        </div>

        {/* Loads Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
            <Bar data={loadsBarData} options={loadsBarOptions} />
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
            <Pie data={loadsPieData} options={loadsPieOptions} />
          </div>
        </div>

        {/* Trucks by Month Trend Chart */}
        {stats.trucksByMonth.length > 0 && (
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
            <Bar data={trucksBarData} options={trucksBarOptions} />
          </div>
        )}

        {/* Trucks by Month from Loads */}
        {stats.trucksByMonthLoads.length > 0 && (
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
            <Bar 
              data={{
                labels: stats.trucksByMonthLoads.map(item => monthNames[item.month - 1]),
                datasets: [
                  {
                    label: 'Camiones por Mes (Cargas)',
                    data: stats.trucksByMonthLoads.map(item => item.count),
                    backgroundColor: 'rgba(245, 101, 101, 0.8)',
                    borderColor: 'rgba(245, 101, 101, 1)',
                    borderWidth: 1,
                  },
                ],
              }} 
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                  title: {
                    display: true,
                    text: 'Tendencia de Camiones por Mes (Cargas)',
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1,
                    },
                  },
                },
              }} 
            />
          </div>
        )}

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Estadísticas Generales</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                <BarChart3 className="h-8 w-8 text-indigo-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {stats.entriesByMonth.reduce((sum, item) => sum + item.count, 0)}
              </p>
              <p className="text-sm text-gray-700 mt-1">Total Entradas</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <Package className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {stats.loadsByMonth.reduce((sum, item) => sum + item.count, 0)}
              </p>
              <p className="text-sm text-gray-700 mt-1">Total Cargas</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Truck className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {stats.trucksByMonth.reduce((sum, item) => sum + item.count, 0) + stats.trucksByMonthLoads.reduce((sum, item) => sum + item.count, 0)}
              </p>
              <p className="text-sm text-gray-700 mt-1">Total Camiones</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {new Set([...stats.entriesByProvider.map(p => p.provider), ...stats.loadsByProvider.map(p => p.provider)]).size}
              </p>
              <p className="text-sm text-gray-700 mt-1">Proveedores Activos</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {stats.avgDuration ? Math.round(stats.avgDuration) : 0}
              </p>
              <p className="text-sm text-gray-700 mt-1">Duración Promedio Entradas (min)</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-4">
                <Clock className="h-8 w-8 text-pink-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {stats.avgDurationLoads ? Math.round(stats.avgDurationLoads) : 0}
              </p>
              <p className="text-sm text-gray-700 mt-1">Duración Promedio Cargas (min)</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}