"use client"

import { useState, useEffect } from "react"
import AppLayout from "@/app/components/AppLayout"
import { BarChart3, Users, Clock, Filter, Truck, Package, X } from "lucide-react"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from "chart.js"
import { Bar, Pie, Line } from "react-chartjs-2"

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ArcElement)

interface Stats {
  entriesByMonth: { month: number; count: number }[]
  loadsByMonth: { month: number; count: number }[]
  entriesByProvider: { provider: string; count: number }[]
  loadsByProvider: { provider: string; count: number }[]
  trucksByMonth: { month: number; count: number }[]
  trucksByMonthLoads: { month: number; count: number }[]
  avgDuration: number | null
  avgDurationLoads: number | null
  avgDurationByProvider: { provider: string; avgDuration: number }[]
  avgDurationTrendByProvider: { provider: string; monthlyData: { month: number; avgDuration: number }[] }[]
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
    week: "",
    month: "",
    providerId: "",
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
      const response = await fetch("/api/stats/filter-options")
      if (response.ok) {
        const data = await response.json()
        setFilterOptions(data)
      }
    } catch (error) {
      console.error("Error fetching filter options:", error)
    }
  }

  const fetchStats = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.week) params.append("week", filters.week)
      if (filters.month) params.append("month", filters.month)
      if (filters.providerId) params.append("providerId", filters.providerId)

      const url = `/api/stats${params.toString() ? "?" + params.toString() : ""}`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }))
  }

  const clearFilters = () => {
    setFilters({
      week: "",
      month: "",
      providerId: "",
    })
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-blue-600"></div>
            <p className="text-sm text-gray-500">Cargando reportes...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!stats) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <X className="h-8 w-8 text-red-600" />
          </div>
          <p className="text-base font-medium text-gray-900">Error al cargar datos</p>
          <p className="text-sm text-gray-500 mt-1">Por favor, intenta nuevamente</p>
        </div>
      </AppLayout>
    )
  }

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ]

  const barData = {
    labels: stats.entriesByMonth.map((item) => monthNames[item.month - 1]),
    datasets: [
      {
        label: "Entradas por Mes",
        data: stats.entriesByMonth.map((item) => item.count),
        backgroundColor: "rgba(59, 130, 246, 0.9)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 0,
        borderRadius: 6,
      },
    ],
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          font: {
            size: 13,
            weight: 500,
          },
          color: "#374151",
          padding: 16,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      title: {
        display: true,
        text: "Distribución de Entradas por Mes",
        font: {
          size: 15,
          weight: 600,
        },
        color: "#111827",
        padding: {
          top: 10,
          bottom: 20,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "#F3F4F6",
        },
        ticks: {
          color: "#6B7280",
          font: {
            size: 12,
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#6B7280",
          font: {
            size: 12,
          },
        },
      },
    },
  }

  const pieData = {
    labels: stats.entriesByProvider.map((item) => item.provider),
    datasets: [
      {
        data: stats.entriesByProvider.map((item) => item.count),
        backgroundColor: [
          "rgba(239, 68, 68, 0.9)",
          "rgba(59, 130, 246, 0.9)",
          "rgba(251, 191, 36, 0.9)",
          "rgba(16, 185, 129, 0.9)",
          "rgba(139, 92, 246, 0.9)",
          "rgba(249, 115, 22, 0.9)",
        ],
        borderColor: "#ffffff",
        borderWidth: 3,
      },
    ],
  }

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          font: {
            size: 12,
            weight: 500,
          },
          color: "#374151",
          padding: 12,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      title: {
        display: true,
        text: "Entradas por Proveedor",
        font: {
          size: 15,
          weight: 600,
        },
        color: "#111827",
        padding: {
          top: 10,
          bottom: 20,
        },
      },
    },
  }

  const trucksBarData = {
    labels: stats.trucksByMonth.map((item) => monthNames[item.month - 1]),
    datasets: [
      {
        label: "Camiones por Mes (Entradas)",
        data: stats.trucksByMonth.map((item) => item.count),
        backgroundColor: "rgba(16, 185, 129, 0.9)",
        borderColor: "rgba(16, 185, 129, 1)",
        borderWidth: 0,
        borderRadius: 6,
      },
    ],
  }

  const trucksBarOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          font: {
            size: 13,
            weight: 500,
          },
          color: "#374151",
          padding: 16,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      title: {
        display: true,
        text: "Tendencia de Camiones por Mes (Entradas)",
        font: {
          size: 15,
          weight: 600,
        },
        color: "#111827",
        padding: {
          top: 10,
          bottom: 20,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: "#6B7280",
          font: {
            size: 12,
          },
        },
        grid: {
          color: "#F3F4F6",
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#6B7280",
          font: {
            size: 12,
          },
        },
      },
    },
  }

  const loadsBarData = {
    labels: stats.loadsByMonth.map((item) => monthNames[item.month - 1]),
    datasets: [
      {
        label: "Cargas por Mes",
        data: stats.loadsByMonth.map((item) => item.count),
        backgroundColor: "rgba(139, 92, 246, 0.9)",
        borderColor: "rgba(139, 92, 246, 1)",
        borderWidth: 0,
        borderRadius: 6,
      },
    ],
  }

  const loadsBarOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          font: {
            size: 13,
            weight: 500,
          },
          color: "#374151",
          padding: 16,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      title: {
        display: true,
        text: "Distribución de Cargas por Mes",
        font: {
          size: 15,
          weight: 600,
        },
        color: "#111827",
        padding: {
          top: 10,
          bottom: 20,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: "#6B7280",
          font: {
            size: 12,
          },
        },
        grid: {
          color: "#F3F4F6",
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#6B7280",
          font: {
            size: 12,
          },
        },
      },
    },
  }

  const loadsPieData = {
    labels: stats.loadsByProvider.map((item) => item.provider),
    datasets: [
      {
        data: stats.loadsByProvider.map((item) => item.count),
        backgroundColor: [
          "rgba(239, 68, 68, 0.9)",
          "rgba(59, 130, 246, 0.9)",
          "rgba(251, 191, 36, 0.9)",
          "rgba(16, 185, 129, 0.9)",
          "rgba(139, 92, 246, 0.9)",
          "rgba(249, 115, 22, 0.9)",
        ],
        borderColor: "#ffffff",
        borderWidth: 3,
      },
    ],
  }

  const loadsPieOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          font: {
            size: 13,
            weight: 500,
          },
          color: "#374151",
          padding: 16,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      title: {
        display: true,
        text: "Distribución de Cargas por Estado",
        font: {
          size: 15,
          weight: 600,
        },
        color: "#111827",
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((acc: number, val: number) => acc + val, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
  };

  return (
    <AppLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Reportes y Analytics</h1>
          <p className="mt-2 text-sm text-gray-500">Visualiza estadísticas y tendencias de las entradas y salidas.</p>
        </div>

        <div className="rounded-xl border border-gray-200/60 bg-gradient-to-br from-white to-gray-50/30 p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 ring-1 ring-blue-200/50">
                <Filter className="h-4 w-4 text-blue-600" />
              </div>
              <h2 className="text-base font-semibold text-gray-900">Filtros</h2>
            </div>
            {(filters.week || filters.month || filters.providerId) && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                <X className="h-4 w-4" />
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label htmlFor="week-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Semana del Año
              </label>
              <select
                id="week-filter"
                value={filters.week}
                onChange={(e) => handleFilterChange("week", e.target.value)}
                className="block w-full rounded-lg border-gray-300 bg-white text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:text-sm"
              >
                <option value="">Todas las semanas</option>
                {filterOptions?.weeks.map((week) => (
                  <option key={week} value={week}>
                    Semana {week}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="month-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Mes del Año
              </label>
              <select
                id="month-filter"
                value={filters.month}
                onChange={(e) => handleFilterChange("month", e.target.value)}
                className="block w-full rounded-lg border-gray-300 bg-white text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:text-sm"
              >
                <option value="">Todos los meses</option>
                {filterOptions?.months.map((month) => (
                  <option key={month} value={month}>
                    {monthNames[month - 1]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="provider-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Proveedor
              </label>
              <select
                id="provider-filter"
                value={filters.providerId}
                onChange={(e) => handleFilterChange("providerId", e.target.value)}
                className="block w-full rounded-lg border-gray-300 bg-white text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:text-sm"
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="rounded-xl border border-gray-200/60 bg-white p-6 shadow-sm">
            <Bar data={barData} options={barOptions} />
          </div>

          <div className="rounded-xl border border-gray-200/60 bg-white p-6 shadow-sm">
            <Pie data={pieData} options={pieOptions} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="rounded-xl border border-gray-200/60 bg-white p-6 shadow-sm">
            <Bar data={loadsBarData} options={loadsBarOptions} />
          </div>

          <div className="rounded-xl border border-gray-200/60 bg-white p-6 shadow-sm">
            <Pie data={loadsPieData} options={loadsPieOptions} />
          </div>
        </div>

        {stats.trucksByMonth.length > 0 && (
          <div className="rounded-xl border border-gray-200/60 bg-white p-6 shadow-sm mb-8">
            <Bar data={trucksBarData} options={trucksBarOptions} />
          </div>
        )}

        {stats.trucksByMonthLoads.length > 0 && (
          <div className="rounded-xl border border-gray-200/60 bg-white p-6 shadow-sm mb-8">
            <Bar
              data={{
                labels: stats.trucksByMonthLoads.map((item) => monthNames[item.month - 1]),
                datasets: [
                  {
                    label: "Camiones por Mes (Cargas)",
                    data: stats.trucksByMonthLoads.map((item) => item.count),
                    backgroundColor: "rgba(249, 115, 22, 0.9)",
                    borderColor: "rgba(249, 115, 22, 1)",
                    borderWidth: 0,
                    borderRadius: 6,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: {
                    position: "top" as const,
                    labels: {
                      font: {
                        size: 13,
                        weight: 500,
                      },
                      color: "#374151",
                      padding: 16,
                      usePointStyle: true,
                      pointStyle: "circle",
                    },
                  },
                  title: {
                    display: true,
                    text: "Tendencia de Camiones por Mes (Cargas)",
                    font: {
                      size: 15,
                      weight: 600,
                    },
                    color: "#111827",
                    padding: {
                      top: 10,
                      bottom: 20,
                    },
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1,
                      color: "#6B7280",
                      font: {
                        size: 12,
                      },
                    },
                    grid: {
                      color: "#F3F4F6",
                    },
                  },
                  x: {
                    grid: {
                      display: false,
                    },
                    ticks: {
                      color: "#6B7280",
                      font: {
                        size: 12,
                      },
                    },
                  },
                },
              }}
            />
          </div>
        )}

        <div className="rounded-xl border border-gray-200/60 bg-white p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-8">Estadísticas Generales</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 ring-1 ring-blue-200/50 mb-4 transition-transform duration-200 group-hover:scale-105">
                <BarChart3 className="h-7 w-7 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900 tracking-tight">
                {stats.entriesByMonth.reduce((sum, item) => sum + item.count, 0)}
              </p>
              <p className="text-sm font-medium text-gray-500 mt-2">Total Entradas</p>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-violet-100 to-violet-50 ring-1 ring-violet-200/50 mb-4 transition-transform duration-200 group-hover:scale-105">
                <Package className="h-7 w-7 text-violet-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900 tracking-tight">
                {stats.loadsByMonth.reduce((sum, item) => sum + item.count, 0)}
              </p>
              <p className="text-sm font-medium text-gray-500 mt-2">Total Cargas</p>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 ring-1 ring-emerald-200/50 mb-4 transition-transform duration-200 group-hover:scale-105">
                <Truck className="h-7 w-7 text-emerald-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900 tracking-tight">
                {stats.trucksByMonth.reduce((sum, item) => sum + item.count, 0) +
                  stats.trucksByMonthLoads.reduce((sum, item) => sum + item.count, 0)}
              </p>
              <p className="text-sm font-medium text-gray-500 mt-2">Total Camiones</p>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 ring-1 ring-indigo-200/50 mb-4 transition-transform duration-200 group-hover:scale-105">
                <Users className="h-7 w-7 text-indigo-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900 tracking-tight">
                {
                  new Set([
                    ...stats.entriesByProvider.map((p) => p.provider),
                    ...stats.loadsByProvider.map((p) => p.provider),
                  ]).size
                }
              </p>
              <p className="text-sm font-medium text-gray-500 mt-2">Proveedores Activos</p>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 ring-1 ring-amber-200/50 mb-4 transition-transform duration-200 group-hover:scale-105">
                <Clock className="h-7 w-7 text-amber-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900 tracking-tight">
                {stats.avgDuration ? Math.round(stats.avgDuration) : 0}
              </p>
              <p className="text-sm font-medium text-gray-500 mt-2">Duración Promedio Entradas (min)</p>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-pink-100 to-pink-50 ring-1 ring-pink-200/50 mb-4 transition-transform duration-200 group-hover:scale-105">
                <Clock className="h-7 w-7 text-pink-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900 tracking-tight">
                {stats.avgDurationLoads ? Math.round(stats.avgDurationLoads) : 0}
              </p>
              <p className="text-sm font-medium text-gray-500 mt-2">Duración Promedio Cargas (min)</p>
            </div>
          </div>
        </div>

        {stats.avgDurationByProvider && stats.avgDurationByProvider.length > 0 && (
          <div className="rounded-xl border border-gray-200/60 bg-white p-6 shadow-sm mb-8">
            <Bar
              data={{
                labels: stats.avgDurationByProvider.map((item) => item.provider),
                datasets: [
                  {
                    label: "Tiempo Promedio de Carga (minutos)",
                    data: stats.avgDurationByProvider.map((item) => Math.round(item.avgDuration)),
                    backgroundColor: "rgba(99, 102, 241, 0.9)",
                    borderColor: "rgba(99, 102, 241, 1)",
                    borderWidth: 0,
                    borderRadius: 6,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: {
                    position: "top" as const,
                    labels: {
                      font: {
                        size: 13,
                        weight: 500,
                      },
                      color: "#374151",
                      padding: 16,
                      usePointStyle: true,
                      pointStyle: "circle",
                    },
                  },
                  title: {
                    display: true,
                    text: "Tiempo Promedio de Carga por Proveedor",
                    font: {
                      size: 15,
                      weight: 600,
                    },
                    color: "#111827",
                    padding: {
                      top: 10,
                      bottom: 20,
                    },
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context: any) {
                        return `Tiempo promedio: ${context.parsed.y} minutos`;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Minutos',
                      font: {
                        size: 12,
                        weight: 500,
                      },
                      color: "#6B7280",
                    },
                    ticks: {
                      color: "#6B7280",
                      font: {
                        size: 12,
                      },
                    },
                    grid: {
                      color: "#F3F4F6",
                    },
                  },
                  x: {
                    grid: {
                      display: false,
                    },
                    ticks: {
                      color: "#6B7280",
                      font: {
                        size: 12,
                      },
                    },
                  },
                },
              }}
            />
          </div>
        )}

        {stats.avgDurationTrendByProvider && stats.avgDurationTrendByProvider.length > 0 && (
          <div className="rounded-xl border border-gray-200/60 bg-white p-6 shadow-sm mb-8">
            <Line
              data={{
                labels: ["Ago 2025", "Sep 2025", "Oct 2025", "Nov 2025", "Dec 2025", "Ene 2026", "Feb 2026", "Mar 2026", "Abr 2026", "May 2026", "Jun 2026", "Jul 2026", "Ago 2026"],
                datasets: [
                  // Línea consolidada (primera en el array para que sea la primera en la leyenda)
                  (() => {
                    // Calculate consolidated data (average of all providers per month)
                    const consolidatedData = new Array(13).fill(null);
                    const monthsMap = new Map<number, number[]>();
                    
                    // Collect all durations per month
                    stats.avgDurationTrendByProvider.forEach(providerData => {
                      providerData.monthlyData.forEach(item => {
                        if (!monthsMap.has(item.month)) {
                          monthsMap.set(item.month, []);
                        }
                        monthsMap.get(item.month)!.push(item.avgDuration);
                      });
                    });
                    
                    // Calculate average for each month
                    monthsMap.forEach((durations, month) => {
                      const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
                      // Map months to the new timeline (Aug 2025 = month 8, etc.)
                      let position = -1;
                      if (month >= 8) {
                        // Aug-Dec 2025 (months 8-12)
                        position = month - 8;
                      } else {
                        // Jan-Aug 2026 (months 1-8)
                        position = month + 4;
                      }
                      if (position >= 0 && position < 13) {
                        consolidatedData[position] = Math.round(avg);
                      }
                    });

                    return {
                      label: "⭐ CONSOLIDADO GENERAL",
                      data: consolidatedData,
                      borderColor: "rgba(0, 0, 0, 1)",
                      backgroundColor: "rgba(0, 0, 0, 0.1)",
                      borderWidth: 4,
                      tension: 0.4,
                      pointRadius: 6,
                      pointHoverRadius: 8,
                      pointBackgroundColor: "rgba(0, 0, 0, 1)",
                      pointBorderColor: "#fff",
                      pointBorderWidth: 2,
                      borderDash: [],
                    };
                  })(),
                  // Individual provider lines
                  ...stats.avgDurationTrendByProvider.map((providerData, index) => {
                    const colors = [
                      { bg: "rgba(239, 68, 68, 0.2)", border: "rgba(239, 68, 68, 1)" },
                      { bg: "rgba(59, 130, 246, 0.2)", border: "rgba(59, 130, 246, 1)" },
                      { bg: "rgba(251, 191, 36, 0.2)", border: "rgba(251, 191, 36, 1)" },
                      { bg: "rgba(16, 185, 129, 0.2)", border: "rgba(16, 185, 129, 1)" },
                      { bg: "rgba(139, 92, 246, 0.2)", border: "rgba(139, 92, 246, 1)" },
                      { bg: "rgba(249, 115, 22, 0.2)", border: "rgba(249, 115, 22, 1)" },
                    ];
                    const color = colors[index % colors.length];
                    
                    // Create data array with null for missing months (13 months: Aug 2025 - Aug 2026)
                    const dataArray = new Array(13).fill(null);
                    providerData.monthlyData.forEach(item => {
                      // Map months to the new timeline
                      let position = -1;
                      if (item.month >= 8) {
                        // Aug-Dec 2025 (months 8-12)
                        position = item.month - 8; // 8->0, 9->1, 10->2, 11->3, 12->4
                      } else {
                        // Jan-Aug 2026 (months 1-8)
                        position = item.month + 4; // 1->5, 2->6, 3->7, 4->8, 5->9, 6->10, 7->11, 8->12
                      }
                      if (position >= 0 && position < 13) {
                        dataArray[position] = Math.round(item.avgDuration);
                      }
                    });

                    return {
                      label: providerData.provider,
                      data: dataArray,
                      borderColor: color.border,
                      backgroundColor: color.bg,
                      borderWidth: 2,
                      tension: 0.4,
                      pointRadius: 4,
                      pointHoverRadius: 6,
                    };
                  }),
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: {
                    position: "top" as const,
                    labels: {
                      font: {
                        size: 13,
                        weight: 500,
                      },
                      color: "#374151",
                      padding: 16,
                      usePointStyle: true,
                      pointStyle: "circle",
                    },
                  },
                  title: {
                    display: true,
                    text: "Tendencia de Tiempo de Carga por Proveedor (Ago 2025 - Ago 2026)",
                    font: {
                      size: 15,
                      weight: 600,
                    },
                    color: "#111827",
                    padding: {
                      top: 10,
                      bottom: 20,
                    },
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context: any) {
                        const label = context.dataset.label || '';
                        const value = context.parsed.y;
                        if (value === null) return '';
                        return `${label}: ${value} minutos`;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Tiempo Promedio (minutos)',
                      font: {
                        size: 12,
                        weight: 500,
                      },
                      color: "#6B7280",
                    },
                    ticks: {
                      color: "#6B7280",
                      font: {
                        size: 12,
                      },
                    },
                    grid: {
                      color: "#F3F4F6",
                    },
                  },
                  x: {
                    grid: {
                      display: false,
                    },
                    ticks: {
                      color: "#6B7280",
                      font: {
                        size: 11,
                      },
                    },
                  },
                },
              }}
            />
          </div>
        )}
      </div>
    </AppLayout>
  )
}
