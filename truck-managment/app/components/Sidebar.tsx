'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Home, Users, Truck, ClipboardList, BarChart3, LogOut, Shield, Menu, X, Building2, User, ChevronDown, ChevronUp } from 'lucide-react'

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [collapseTimeout, setCollapseTimeout] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Emit event when collapsed state changes
    window.dispatchEvent(new CustomEvent('sidebarToggle', { detail: { isCollapsed } }))
  }, [isCollapsed])

  useEffect(() => {
    // Handle user menu state changes
    if (isUserMenuOpen && isCollapsed) {
      setIsCollapsed(false)
    } else if (!isUserMenuOpen && !isHovered) {
      // If user menu closes and we're not hovering, start collapse timer
      if (collapseTimeout) {
        clearTimeout(collapseTimeout)
      }
      const timeout = setTimeout(() => {
        setIsCollapsed(true)
      }, 300)
      setCollapseTimeout(timeout)
    }
  }, [isUserMenuOpen, isHovered, isCollapsed])

  useEffect(() => {
    return () => {
      if (collapseTimeout) {
        clearTimeout(collapseTimeout)
      }
    }
  }, [collapseTimeout])

  const handleMouseEnter = () => {
    setIsHovered(true)
    if (collapseTimeout) {
      clearTimeout(collapseTimeout)
      setCollapseTimeout(null)
    }
    setIsCollapsed(false)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    if (!isUserMenuOpen) {
      const timeout = setTimeout(() => {
        setIsCollapsed(true)
      }, 300) // 300ms delay before collapsing
      setCollapseTimeout(timeout)
    }
  }

  const toggleSidebar = () => {
    if (collapseTimeout) {
      clearTimeout(collapseTimeout)
      setCollapseTimeout(null)
    }
    setIsCollapsed(!isCollapsed)
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const baseNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Proveedores', href: '/providers', icon: Building2 },
    { name: 'Camiones', href: '/trucks', icon: Truck },
    { name: 'Entrada/Salida', href: '/entries', icon: ClipboardList },
    { name: 'Reportes', href: '/reports', icon: BarChart3 },
  ]

  // Remove users from main navigation - will be in user dropdown
  const navigation = baseNavigation

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
          >
            <span className="sr-only">Abrir menú principal</span>
            {isMobileMenuOpen ? (
              <X className="block h-6 w-6" />
            ) : (
              <Menu className="block h-6 w-6" />
            )}
          </button>
          <div className="flex items-center">
            <img src="/images/logo.png" alt="Logo" className="h-8 w-8 mr-2" />
            <h1 className="text-lg font-bold text-gray-900">Truck Manager</h1>
          </div>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={closeMobileMenu} />
          <div className="relative flex w-full max-w-xs flex-col bg-white">
            <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4 mb-5">
                <img src="/images/logo.png" alt="Logo" className="h-8 w-8 mr-3" />
                <h1 className="text-xl font-bold text-gray-900">Truck Manager</h1>
              </div>
              <nav className="flex-1 px-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={closeMobileMenu}
                      className={`group flex items-center px-2 py-3 text-base font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className="flex-shrink-0 h-6 w-6 mr-3" />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="w-full">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 w-full"
                >
                  <User className="flex-shrink-0 h-6 w-6 mr-3" />
                  <span className="flex-1 text-left">{session?.user?.name || 'Usuario'}</span>
                  {isUserMenuOpen ? (
                    <ChevronUp className="ml-2 h-5 w-5" />
                  ) : (
                    <ChevronDown className="ml-2 h-5 w-5" />
                  )}
                </button>

                {/* User dropdown menu for mobile */}
                {isUserMenuOpen && (
                  <div className="mt-2 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-200">
                        {session?.user?.email}
                      </div>

                      <Link
                        href="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          setIsUserMenuOpen(false)
                          closeMobileMenu()
                        }}
                      >
                        <User className="mr-3 h-4 w-4" />
                        Mi Perfil
                      </Link>

                      {session?.user?.role === 'admin' && (
                        <Link
                          href="/users"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => {
                            setIsUserMenuOpen(false)
                            closeMobileMenu()
                          }}
                        >
                          <Shield className="mr-3 h-4 w-4" />
                          Gestionar Usuarios
                        </Link>
                      )}

                      <div className="border-t border-gray-200 my-1"></div>

                      <button
                        onClick={() => {
                          signOut()
                          setIsUserMenuOpen(false)
                          closeMobileMenu()
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div 
        className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 transition-all duration-300 ${isCollapsed ? 'md:w-16' : 'md:w-64'}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
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
                <div className="ml-2 flex items-center">
                  <img src="/images/logo.png" alt="Logo" className="h-6 w-6 mr-2" />
                  <h1 className="text-xl font-bold text-gray-900">Truck Manager</h1>
                </div>
              )}
              {isCollapsed && (
                <div className="ml-2">
                  <img src="/images/logo.png" alt="Logo" className="h-6 w-6" />
                </div>
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
              <div className="w-full">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 ${isCollapsed ? 'w-auto justify-center' : 'w-full'}`}
                  title={isCollapsed ? 'Menú de usuario' : undefined}
                >
                  <User className="flex-shrink-0 h-5 w-5" />
                  {!isCollapsed && (
                    <>
                      <span className="ml-3 flex-1 text-left">{session?.user?.name || 'Usuario'}</span>
                      {isUserMenuOpen ? (
                        <ChevronUp className="ml-2 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-2 h-4 w-4" />
                      )}
                    </>
                  )}
                </button>

                {/* User dropdown menu */}
                {isUserMenuOpen && (
                  <div className={`mt-2 ${isCollapsed ? 'absolute left-16 bottom-4 w-48' : 'relative'} bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50`}>
                    <div className="py-1">
                      <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-200">
                        {session?.user?.email}
                      </div>

                      <Link
                        href="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User className="mr-3 h-4 w-4" />
                        Mi Perfil
                      </Link>

                      {session?.user?.role === 'admin' && (
                        <Link
                          href="/users"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Shield className="mr-3 h-4 w-4" />
                          Gestionar Usuarios
                        </Link>
                      )}

                      <div className="border-t border-gray-200 my-1"></div>

                      <button
                        onClick={() => {
                          signOut()
                          setIsUserMenuOpen(false)
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
        </div>
      </div>
    </>
  )
}