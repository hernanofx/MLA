'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Home, Users, Truck, ClipboardList, BarChart3, LogOut, Shield } from 'lucide-react'

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    // Emit event when collapsed state changes
    window.dispatchEvent(new CustomEvent('sidebarToggle', { detail: { isCollapsed } }))
  }, [isCollapsed])

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  const baseNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Proveedores', href: '/providers', icon: Users },
    { name: 'Camiones', href: '/trucks', icon: Truck },
    { name: 'Entradas', href: '/entries', icon: ClipboardList },
    { name: 'Reportes', href: '/reports', icon: BarChart3 },
  ]

  // Add users navigation for admin users
  const navigation = session?.user?.role === 'admin'
    ? [{ name: 'Usuarios', href: '/users', icon: Shield }, ...baseNavigation]
    : baseNavigation

  return (
    <div className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 transition-all duration-300 ${isCollapsed ? 'md:w-16' : 'md:w-64'}`}>
      <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <button
              onClick={toggleSidebar}
              className="p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              <span className="sr-only">Toggle sidebar</span>
              {isCollapsed ? '→' : '←'}
            </button>
            {!isCollapsed && (
              <h1 className="ml-2 text-xl font-bold text-gray-900">Truck Manager</h1>
            )}
          </div>
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon className="flex-shrink-0 h-5 w-5" />
                  {!isCollapsed && <span className="ml-3">{item.name}</span>}
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <button
            onClick={() => signOut()}
            className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 ${isCollapsed ? 'w-auto justify-center' : 'w-full'}`}
            title={isCollapsed ? 'Cerrar Sesión' : undefined}
          >
            <LogOut className="flex-shrink-0 h-5 w-5" />
            {!isCollapsed && <span className="ml-3">Cerrar Sesión</span>}
          </button>
        </div>
      </div>
    </div>
  )
}