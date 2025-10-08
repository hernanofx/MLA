'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/app/components/AppLayout'
import { BarChart3, Users, Clock } from 'lucide-react'
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
  entriesByProvider: { provider: string; count: number }[]
  avgDuration: number | null
}

export default function ReportsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats')
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
          <p className="text-gray-500">Error al cargar datos</p>
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

  return (
    <AppLayout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Reportes y Analytics</h1>
          <p className="mt-2 text-sm text-gray-700">
            Visualiza estadísticas y tendencias de las entradas y salidas.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <Bar data={barData} options={barOptions} />
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <Pie data={pieData} options={pieOptions} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Estadísticas Generales</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                <BarChart3 className="h-8 w-8 text-indigo-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {stats.entriesByMonth.reduce((sum, item) => sum + item.count, 0)}
              </p>
              <p className="text-sm text-gray-600 mt-1">Total Entradas</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {stats.entriesByProvider.length}
              </p>
              <p className="text-sm text-gray-600 mt-1">Proveedores Activos</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {stats.avgDuration ? Math.round(stats.avgDuration) : 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">Duración Promedio (min)</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}