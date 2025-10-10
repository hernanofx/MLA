'use client'

import Link from 'next/link'
import { LayoutDashboard, Building2, Truck, ClipboardList, Package, Warehouse, BarChart3, HelpCircle } from 'lucide-react'

const modules = [
  { name: 'Dashboard', href: '/help/dashboard', icon: LayoutDashboard, description: 'Vista general del sistema y estadísticas principales' },
  { name: 'Proveedores', href: '/help/providers', icon: Building2, description: 'Gestión de proveedores y contactos' },
  { name: 'Camiones', href: '/help/trucks', icon: Truck, description: 'Administración de flota de camiones' },
  { name: 'Entradas/Salidas', href: '/help/entries', icon: ClipboardList, description: 'Registro de entradas y salidas de mercancías' },
  { name: 'Cargas/Descargas', href: '/help/loads', icon: Package, description: 'Gestión de cargas y descargas' },
  { name: 'Stock', href: '/help/stocks', icon: Warehouse, description: 'Control de inventario y almacenes' },
  { name: 'Reportes', href: '/help/reports', icon: BarChart3, description: 'Generación de reportes y estadísticas' },
]

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <HelpCircle className="mx-auto h-16 w-16 text-blue-600 mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Centro de Ayuda</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Encuentra guías paso a paso para todas las funcionalidades del sistema de gestión de camiones.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <Link
              key={module.name}
              href={module.href}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6 block"
            >
              <div className="flex items-center mb-4">
                <module.icon className="h-8 w-8 text-blue-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">{module.name}</h2>
              </div>
              <p className="text-gray-600">{module.description}</p>
              <div className="mt-4 text-blue-600 font-medium">
                Ver guía completa →
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}