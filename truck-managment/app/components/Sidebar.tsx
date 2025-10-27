'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Home, Users, Truck, ClipboardList, BarChart3, LogOut, Shield, Menu, X, Package, User, ChevronUp, ChevronDown, Building2, Warehouse, LayoutDashboard, Bell, HelpCircle, MapPin, BookOpen } from 'lucide-react'

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [openMenus, setOpenMenus] = useState<{[key: string]: boolean}>({})

  useEffect(() => {
    // Emit event when collapsed state changes
    window.dispatchEvent(new CustomEvent('sidebarToggle', { detail: { isCollapsed } }))

    // Fetch unread notifications count
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch('/api/notifications')
        if (response.ok) {
          const data = await response.json()
          setUnreadCount(data.unreadCount || 0)
        }
      } catch (error) {
        console.error('Error fetching notifications:', error)
      }
    }

    if (session) {
      fetchUnreadCount()
      // Poll every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000)
      return () => clearInterval(interval)
    }

    // Cleanup timeout on unmount
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout)
      }
    }
  }, [isCollapsed, hoverTimeout, session])

  const toggleSidebar = () => {
    // Cancelar cualquier timeout pendiente
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      setHoverTimeout(null)
    }

    // Resetear estado de hover cuando se hace toggle manual
    setIsHovered(false)
    setIsCollapsed(!isCollapsed)
  }

  const handleMouseEnter = () => {
    // Cancelar cualquier timeout pendiente
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      setHoverTimeout(null)
    }

    // Solo expandir si está colapsada y no es mobile
    if (isCollapsed && window.innerWidth >= 768) {
      const timeout = setTimeout(() => {
        setIsHovered(true)
        setIsCollapsed(false)
      }, 300) // 300ms delay para abrir
      setHoverTimeout(timeout)
    }
  }

  const handleMouseLeave = () => {
    // Cancelar cualquier timeout pendiente
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      setHoverTimeout(null)
    }

    // Solo colapsar si fue expandida por hover
    if (isHovered && window.innerWidth >= 768) {
      const timeout = setTimeout(() => {
        setIsHovered(false)
        setIsCollapsed(true)
      }, 500) // 500ms delay para cerrar (más tiempo para dar oportunidad de mover el mouse)
      setHoverTimeout(timeout)
    }
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const baseNavigation = session?.user?.role === 'vms' ? [
    { name: 'VMS', href: '/vms', icon: Truck },
  ] : session?.user?.role === 'operario' ? [
    { name: 'Cargas', href: '/loads', icon: Package }
  ] : [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      subItems: [
        { name: 'Vista General', href: '/dashboard' },
        { name: 'Reportes', href: '/reports', icon: BarChart3 }
      ]
    },
    {
      name: 'VMS',
      href: '#',
      icon: Building2,
      subItems: [
        { name: 'Proveedores', href: '/providers', icon: Building2 },
        { name: 'Monitoreo VMS', href: '/vms-monitoring', icon: BarChart3 }
      ]
    },
    {
      name: 'Logística',
      href: '#',
      icon: Truck,
      subItems: [
        { name: 'Camiones', href: '/trucks', icon: Truck },
        { name: 'Entradas/Salidas', href: '/entries', icon: ClipboardList },
        { name: 'Cargas/Descargas', href: '/loads', icon: Package }
      ]
    },
    { name: 'Stock', href: '/stocks', icon: Warehouse },
    { name: 'Mapas', href: '/maps', icon: MapPin },
    { name: 'Procesos', href: '/wiki', icon: BookOpen },
    { name: 'Notificaciones', href: '/notifications', icon: Bell },
    {
      name: 'Ayuda',
      href: '/help',
      icon: HelpCircle,
      subItems: [
        { name: 'Centro de Ayuda', href: '/help' },
        { name: 'FAQ', href: '/help/faq' }
      ]
    },
  ]

  // Navigation is the same for all users - users access is in the dropdown menu
  const navigation = baseNavigation

  return (
    <>
      {/* <CHANGE> Enhanced mobile header with premium styling */}
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3.5">
          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2 transition-all duration-200"
          >
            <span className="sr-only">Abrir menú principal</span>
            {isMobileMenuOpen ? (
              <X className="block h-5 w-5" />
            ) : (
              <Menu className="block h-5 w-5" />
            )}
          </button>
          <div className="flex items-center gap-2.5">
            <img src="/images/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
            <h1 className="text-xs font-semibold text-neutral-900 tracking-tight leading-tight">
              Network<br />Management<br />Argentina
            </h1>
          </div>
          <div className="w-9"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* <CHANGE> Premium mobile menu with enhanced animations and styling */}
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div 
            className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm transition-opacity duration-300" 
            onClick={closeMobileMenu} 
          />
          <div className="relative flex w-full max-w-xs flex-col bg-white shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="flex flex-col flex-grow pt-6 pb-4 overflow-y-auto">
              {/* <CHANGE> Enhanced mobile header */}
              <div className="flex items-center flex-shrink-0 px-5 mb-8">
                <img src="/images/logo.png" alt="Logo" className="h-9 w-9 object-contain" />
                <h1 className="ml-3 text-sm font-semibold text-neutral-900 tracking-tight leading-tight">
                  Network<br />Management<br />Argentina
                </h1>
              </div>
              
              {/* <CHANGE> Premium navigation items with refined styling */}
              <nav className="flex-1 px-3 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  const hasSubItems = item.subItems && item.subItems.length > 0
                  const isMenuActive = hasSubItems && openMenus[item.name]

                  if (hasSubItems) {
                    return (
                      <div key={item.name}>
                        <button
                          onClick={() => setOpenMenus(prev => ({...prev, [item.name]: !prev[item.name]}))}
                          className={`group flex items-center px-3.5 py-3 text-[15px] font-medium rounded-xl transition-all duration-200 w-full ${
                            isMenuActive
                              ? 'bg-neutral-900 text-white shadow-lg shadow-neutral-900/20'
                              : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                          }`}
                        >
                          <item.icon className={`flex-shrink-0 h-5 w-5 mr-3.5 transition-transform duration-200 ${
                            isMenuActive ? 'scale-110' : 'group-hover:scale-105'
                          }`} />
                          <span className="flex-1 text-left">{item.name}</span>
                          {openMenus[item.name] ? (
                            <ChevronUp className="flex-shrink-0 h-4 w-4 ml-2 text-neutral-500" />
                          ) : (
                            <ChevronDown className="flex-shrink-0 h-4 w-4 ml-2 text-neutral-500" />
                          )}
                        </button>
                        {openMenus[item.name] && (
                          <div className="ml-8 mt-1 space-y-1 animate-in fade-in slide-in-from-left-1 duration-200">
                            {item.subItems.map((subItem) => {
                              const isSubActive = pathname === subItem.href
                              return (
                                <Link
                                  key={subItem.name}
                                  href={subItem.href}
                                  onClick={closeMobileMenu}
                                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                    isSubActive
                                      ? 'bg-neutral-800 text-white'
                                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                                  }`}
                                >
                                  {subItem.name}
                                </Link>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  }

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={closeMobileMenu}
                      className={`group flex items-center px-3.5 py-3 text-[15px] font-medium rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-neutral-900 text-white shadow-lg shadow-neutral-900/20'
                          : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                      }`}
                    >
                      <item.icon className={`flex-shrink-0 h-5 w-5 mr-3.5 transition-transform duration-200 ${
                        isActive ? 'scale-110' : 'group-hover:scale-105'
                      }`} />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </div>
            
            {/* <CHANGE> Enhanced user menu section */}
            <div className="flex-shrink-0 border-t border-neutral-200/80 p-3 bg-neutral-50/50">
              <div className="relative w-full">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="group flex items-center px-3.5 py-3 text-[15px] font-medium rounded-xl text-neutral-700 hover:bg-white hover:text-neutral-900 hover:shadow-sm w-full transition-all duration-200"
                >
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-neutral-700 flex items-center justify-center mr-3 shadow-sm">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="flex-1 text-left truncate text-sm">{session?.user?.name || session?.user?.email}</span>
                  {isUserMenuOpen ? (
                    <ChevronUp className="flex-shrink-0 h-4 w-4 ml-2 text-neutral-500" />
                  ) : (
                    <ChevronDown className="flex-shrink-0 h-4 w-4 ml-2 text-neutral-500" />
                  )}
                </button>

                {isUserMenuOpen && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-neutral-200 rounded-xl shadow-xl z-[9999] overflow-hidden">
                    <Link
                      href="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 border-b border-neutral-100 transition-colors duration-150"
                    >
                      <User className="flex-shrink-0 h-4 w-4 mr-3 text-neutral-500" />
                      Perfil
                    </Link>
                    {session?.user?.role === 'admin' && (
                      <Link
                        href="/users"
                        onClick={() => {
                          setIsUserMenuOpen(false)
                          if (isHovered) {
                            setIsHovered(false)
                            setIsCollapsed(true)
                          }
                        }}
                        className="flex items-center px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 border-b border-neutral-100 transition-colors duration-150"
                      >
                        <Shield className="flex-shrink-0 h-4 w-4 mr-3 text-neutral-500" />
                        Usuarios
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        signOut({ callbackUrl: '/login' })
                        setIsUserMenuOpen(false)
                        if (isHovered) {
                          setIsHovered(false)
                          setIsCollapsed(true)
                        }
                      }}
                      className="flex items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 w-full text-left transition-colors duration-150"
                    >
                      <LogOut className="flex-shrink-0 h-4 w-4 mr-3" />
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* <CHANGE> Premium desktop sidebar with refined styling and animations */}
      {/* Desktop sidebar */}
      <div
        className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'md:w-[72px]' : 'md:w-64'}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-neutral-200/80 shadow-sm">
          <div className="flex-1 flex flex-col pt-6 pb-4 overflow-y-auto">
            {/* <CHANGE> Enhanced header with premium toggle button */}
            <div className="flex items-center flex-shrink-0 px-4 mb-2">
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2 transition-all duration-200 group"
              >
                <span className="sr-only">Toggle sidebar</span>
                <div className="text-base font-medium">
                  {isCollapsed ? '→' : '←'}
                </div>
              </button>
              {!isCollapsed && (
                <div className="ml-3 flex items-center gap-2.5 animate-in fade-in slide-in-from-left-2 duration-200">
                  <img src="/images/logo.png" alt="Logo" className="h-7 w-7 object-contain" />
                  <h1 className="text-sm font-semibold text-neutral-900 tracking-tight leading-tight">
                    Network<br />Management<br />Argentina
                  </h1>
                </div>
              )}
              {isCollapsed && (
                <div className="ml-2">
                  <img src="/images/logo.png" alt="Logo" className="h-7 w-7 object-contain" />
                </div>
              )}
            </div>
            
            {/* <CHANGE> Premium navigation with refined active states and hover effects */}
            <nav className="mt-6 flex-1 px-3 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                const hasSubItems = item.subItems && item.subItems.length > 0
                const isMenuActive = hasSubItems && openMenus[item.name]

                if (hasSubItems) {
                  return (
                    <div key={item.name}>
                      <button
                        onClick={() => setOpenMenus(prev => ({...prev, [item.name]: !prev[item.name]}))}
                        className={`group flex items-center px-3 py-2.5 text-[15px] font-medium rounded-xl transition-all duration-200 relative w-full ${
                          isMenuActive
                            ? 'bg-neutral-900 text-white shadow-lg shadow-neutral-900/20'
                            : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                        } ${isCollapsed ? 'justify-center' : ''}`}
                        title={isCollapsed ? item.name : undefined}
                      >
                        <item.icon className={`flex-shrink-0 h-5 w-5 transition-transform duration-200 ${
                          isMenuActive ? 'scale-110' : 'group-hover:scale-105'
                        }`} />
                        {!isCollapsed && (
                          <>
                            <span className="ml-3 animate-in fade-in slide-in-from-left-1 duration-200 flex-1 text-left">{item.name}</span>
                            {openMenus[item.name] ? (
                              <ChevronUp className="flex-shrink-0 h-4 w-4 ml-2 text-neutral-500" />
                            ) : (
                              <ChevronDown className="flex-shrink-0 h-4 w-4 ml-2 text-neutral-500" />
                            )}
                          </>
                        )}
                        {isMenuActive && !isCollapsed && (
                          <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white animate-in zoom-in duration-200" />
                        )}
                      </button>
                      {!isCollapsed && openMenus[item.name] && (
                        <div className="ml-6 mt-1 space-y-1 animate-in fade-in slide-in-from-left-1 duration-200">
                          {item.subItems.map((subItem) => {
                            const isSubActive = pathname === subItem.href
                            return (
                              <Link
                                key={subItem.name}
                                href={subItem.href}
                                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                  isSubActive
                                    ? 'bg-neutral-800 text-white'
                                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                                }`}
                                onClick={() => {
                                  if (isHovered) {
                                    setIsHovered(false)
                                    setIsCollapsed(true)
                                  }
                                }}
                              >
                                {subItem.name}
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-3 py-2.5 text-[15px] font-medium rounded-xl transition-all duration-200 relative ${
                      isActive
                        ? 'bg-neutral-900 text-white shadow-lg shadow-neutral-900/20'
                        : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                    title={isCollapsed ? item.name : undefined}
                    onClick={() => {
                      if (isHovered) {
                        setIsHovered(false)
                        setIsCollapsed(true)
                      }
                    }}
                  >
                    <div className="relative">
                      <item.icon className={`flex-shrink-0 h-5 w-5 transition-transform duration-200 ${
                        isActive ? 'scale-110' : 'group-hover:scale-105'
                      }`} />
                      {item.name === 'Notificaciones' && unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center text-[10px] font-semibold">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                    {!isCollapsed && (
                      <span className="ml-3 animate-in fade-in slide-in-from-left-1 duration-200">{item.name}</span>
                    )}
                    {isActive && !isCollapsed && (
                      <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white animate-in zoom-in duration-200" />
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
          
          {/* <CHANGE> Premium user section with enhanced dropdown */}
          <div className="flex-shrink-0 border-t border-neutral-200/80 p-3 bg-neutral-50/50">
            <div className="relative w-full">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl text-neutral-700 hover:bg-white hover:text-neutral-900 hover:shadow-sm transition-all duration-200 ${isCollapsed ? 'w-auto justify-center' : 'w-full'}`}
                title={isCollapsed ? 'Menú de usuario' : undefined}
              >
                <div className="flex-shrink-0 h-5 w-5 rounded-full bg-neutral-700 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-200">
                  <User className="h-3 w-3 text-white" />
                </div>
                {!isCollapsed && (
                  <>
                    <span className="ml-3 flex-1 text-left truncate text-[13px]">{session?.user?.name || session?.user?.email}</span>
                    {isUserMenuOpen ? (
                      <ChevronUp className="flex-shrink-0 h-4 w-4 ml-2 text-neutral-500" />
                    ) : (
                      <ChevronDown className="flex-shrink-0 h-4 w-4 ml-2 text-neutral-500" />
                    )}
                  </>
                )}
              </button>

              {isUserMenuOpen && (
                <div className={`absolute ${isCollapsed ? 'left-full ml-2 top-0' : 'bottom-full left-0 right-0 mb-2'} bg-white border border-neutral-200 rounded-xl shadow-xl z-[9999] min-w-[200px] overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
                  <Link
                    href="/profile"
                    onClick={() => {
                      setIsUserMenuOpen(false)
                      if (isHovered) {
                        setIsHovered(false)
                        setIsCollapsed(true)
                      }
                    }}
                    className="flex items-center px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 border-b border-neutral-100 transition-colors duration-150"
                  >
                    <User className="flex-shrink-0 h-4 w-4 mr-3 text-neutral-500" />
                    Perfil
                  </Link>
                  {session?.user?.role === 'admin' && (
                    <Link
                      href="/users"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 border-b border-neutral-100 transition-colors duration-150"
                    >
                      <Shield className="flex-shrink-0 h-4 w-4 mr-3 text-neutral-500" />
                      Usuarios
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      signOut({ callbackUrl: '/login' })
                      setIsUserMenuOpen(false)
                      if (isHovered) {
                        setIsHovered(false)
                        setIsCollapsed(true)
                      }
                    }}
                    className="flex items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 w-full text-left transition-colors duration-150"
                  >
                    <LogOut className="flex-shrink-0 h-4 w-4 mr-3" />
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}