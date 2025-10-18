'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Home, Users, Truck, ClipboardList, BarChart3, LogOut, Shield, Menu, X, Package, User, ChevronUp, ChevronDown, Building2, Warehouse, LayoutDashboard, Bell, HelpCircle, Map, BookOpen } from 'lucide-react'

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isHelpMenuOpen, setIsHelpMenuOpen] = useState(false)

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('sidebarToggle', { detail: { isCollapsed } }))

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
      const interval = setInterval(fetchUnreadCount, 30000)
      return () => clearInterval(interval)
    }

    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout)
      }
    }
  }, [isCollapsed, hoverTimeout, session])

  const toggleSidebar = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      setHoverTimeout(null)
    }
    setIsHovered(false)
    setIsCollapsed(!isCollapsed)
  }

  const handleMouseEnter = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      setHoverTimeout(null)
    }

    if (isCollapsed && window.innerWidth >= 768) {
      const timeout = setTimeout(() => {
        setIsHovered(true)
        setIsCollapsed(false)
      }, 300)
      setHoverTimeout(timeout)
    }
  }

  const handleMouseLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      setHoverTimeout(null)
    }

    if (isHovered && window.innerWidth >= 768) {
      const timeout = setTimeout(() => {
        setIsHovered(false)
        setIsCollapsed(true)
      }, 500)
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
  ] : [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Proveedores', href: '/providers', icon: Building2 },
    { name: 'Camiones', href: '/trucks', icon: Truck },
    { name: 'Entradas/Salidas', href: '/entries', icon: ClipboardList },
    { name: 'Cargas/Descargas', href: '/loads', icon: Package },
    { name: 'Stock', href: '/stocks', icon: Warehouse },
    { name: 'Mapas', href: '/maps', icon: Map },
    { name: 'Reportes', href: '/reports', icon: BarChart3 },
    { name: 'Procesos', href: '/wiki', icon: BookOpen },
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

  const navigation = baseNavigation

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-neutral-200/60">
        <div className="flex items-center justify-between px-5 py-4">
          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:ring-offset-2 transition-all duration-300 active:scale-95"
          >
            <span className="sr-only">Abrir menú principal</span>
            {isMobileMenuOpen ? (
              <X className="h-5 w-5 transition-transform duration-300" />
            ) : (
              <Menu className="h-5 w-5 transition-transform duration-300" />
            )}
          </button>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-neutral-900/10 to-transparent rounded-xl blur-sm group-hover:blur-md transition-all duration-300" />
              <img src="/images/logo.png" alt="Logo" className="relative h-9 w-9 object-contain" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-[11px] font-bold text-neutral-900 tracking-tight leading-[1.3] uppercase">
                Network Management
              </h1>
              <span className="text-[9px] font-medium text-neutral-500 tracking-wider">Argentina</span>
            </div>
          </div>
          <div className="w-9" />
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div 
            className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md transition-all duration-300" 
            onClick={closeMobileMenu} 
          />
          <div className="relative flex w-full max-w-sm flex-col bg-white shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="flex flex-col flex-grow pt-8 pb-6 overflow-y-auto">
              {/* Mobile Header */}
              <div className="flex items-center flex-shrink-0 px-6 mb-10">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-neutral-900/10 to-transparent rounded-xl blur-sm group-hover:blur-md transition-all duration-300" />
                  <img src="/images/logo.png" alt="Logo" className="relative h-10 w-10 object-contain" />
                </div>
                <div className="ml-4 flex flex-col">
                  <h1 className="text-sm font-bold text-neutral-900 tracking-tight leading-[1.3] uppercase">
                    Network Management
                  </h1>
                  <span className="text-xs font-medium text-neutral-500 tracking-wider">Argentina</span>
                </div>
              </div>
              
              {/* Navigation */}
              <nav className="flex-1 px-4 space-y-1.5">
                {navigation.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  const hasSubItems = item.subItems && item.subItems.length > 0
                  const isHelpActive = hasSubItems && pathname.startsWith('/help')

                  if (hasSubItems) {
                    return (
                      <div key={item.name}>
                        <button
                          onClick={() => setIsHelpMenuOpen(!isHelpMenuOpen)}
                          className={`group flex items-center w-full px-4 py-3.5 text-sm font-semibold rounded-2xl transition-all duration-300 ${
                            isHelpActive
                              ? 'bg-neutral-900 text-white shadow-lg shadow-neutral-900/25'
                              : 'text-neutral-700 hover:bg-neutral-100/80 hover:text-neutral-900 active:scale-[0.98]'
                          }`}
                        >
                          <item.icon className={`flex-shrink-0 h-5 w-5 mr-4 transition-all duration-300 ${
                            isHelpActive ? 'scale-110' : 'group-hover:scale-110'
                          }`} strokeWidth={2.5} />
                          <span className="flex-1 text-left tracking-tight">{item.name}</span>
                          {isHelpMenuOpen ? (
                            <ChevronUp className="flex-shrink-0 h-4 w-4 ml-2 transition-transform duration-300" strokeWidth={2.5} />
                          ) : (
                            <ChevronDown className="flex-shrink-0 h-4 w-4 ml-2 transition-transform duration-300" strokeWidth={2.5} />
                          )}
                        </button>
                        {isHelpMenuOpen && (
                          <div className="ml-10 mt-2 space-y-1 animate-in fade-in slide-in-from-left-2 duration-300">
                            {item.subItems.map((subItem) => {
                              const isSubActive = pathname === subItem.href
                              return (
                                <Link
                                  key={subItem.name}
                                  href={subItem.href}
                                  onClick={closeMobileMenu}
                                  className={`group flex items-center px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 ${
                                    isSubActive
                                      ? 'bg-neutral-800 text-white'
                                      : 'text-neutral-600 hover:bg-neutral-100/80 hover:text-neutral-900'
                                  }`}
                                >
                                  <span className="tracking-tight">{subItem.name}</span>
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
                      className={`group flex items-center px-4 py-3.5 text-sm font-semibold rounded-2xl transition-all duration-300 ${
                        isActive
                          ? 'bg-neutral-900 text-white shadow-lg shadow-neutral-900/25'
                          : 'text-neutral-700 hover:bg-neutral-100/80 hover:text-neutral-900 active:scale-[0.98]'
                      }`}
                    >
                      <item.icon className={`flex-shrink-0 h-5 w-5 mr-4 transition-all duration-300 ${
                        isActive ? 'scale-110' : 'group-hover:scale-110'
                      }`} strokeWidth={2.5} />
                      <span className="tracking-tight">{item.name}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
            
            {/* User Menu Section */}
            <div className="flex-shrink-0 border-t border-neutral-200/60 p-4 bg-gradient-to-b from-transparent to-neutral-50/50">
              <div className="relative w-full">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="group flex items-center w-full px-4 py-3.5 text-sm font-medium rounded-2xl text-neutral-700 hover:bg-white hover:text-neutral-900 hover:shadow-md transition-all duration-300 active:scale-[0.98]"
                >
                  <div className="flex-shrink-0 h-9 w-9 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center mr-3.5 shadow-md group-hover:shadow-lg transition-all duration-300">
                    <User className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
                  </div>
                  <span className="flex-1 text-left truncate font-semibold tracking-tight">{session?.user?.name || session?.user?.email}</span>
                  {isUserMenuOpen ? (
                    <ChevronUp className="flex-shrink-0 h-4 w-4 ml-2 transition-transform duration-300" strokeWidth={2.5} />
                  ) : (
                    <ChevronDown className="flex-shrink-0 h-4 w-4 ml-2 transition-transform duration-300" strokeWidth={2.5} />
                  )}
                </button>

                {isUserMenuOpen && (
                  <div className="absolute bottom-full left-0 right-0 mb-3 bg-white border border-neutral-200/60 rounded-2xl shadow-2xl z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {session?.user?.role !== 'vms' && (
                      <Link
                        href="/notifications"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center px-5 py-3.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 border-b border-neutral-100/80 transition-all duration-200 group"
                      >
                        <Bell className="flex-shrink-0 h-4.5 w-4.5 mr-3.5 text-neutral-500 group-hover:text-neutral-900 transition-colors duration-200" strokeWidth={2.5} />
                        <span className="tracking-tight">Notificaciones</span>
                        {unreadCount > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-md">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </Link>
                    )}
                    <Link
                      href="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center px-5 py-3.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 border-b border-neutral-100/80 transition-all duration-200 group"
                    >
                      <User className="flex-shrink-0 h-4.5 w-4.5 mr-3.5 text-neutral-500 group-hover:text-neutral-900 transition-colors duration-200" strokeWidth={2.5} />
                      <span className="tracking-tight">Perfil</span>
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
                        className="flex items-center px-5 py-3.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 border-b border-neutral-100/80 transition-all duration-200 group"
                      >
                        <Shield className="flex-shrink-0 h-4.5 w-4.5 mr-3.5 text-neutral-500 group-hover:text-neutral-900 transition-colors duration-200" strokeWidth={2.5} />
                        <span className="tracking-tight">Usuarios</span>
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
                      className="flex items-center px-5 py-3.5 text-sm font-semibold text-red-600 hover:bg-red-50 w-full text-left transition-all duration-200 group"
                    >
                      <LogOut className="flex-shrink-0 h-4.5 w-4.5 mr-3.5 group-hover:text-red-700 transition-colors duration-200" strokeWidth={2.5} />
                      <span className="tracking-tight">Cerrar Sesión</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div
        className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 transition-all duration-500 ease-in-out ${isCollapsed ? 'md:w-20' : 'md:w-72'}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex-1 flex flex-col min-h-0 bg-white/80 backdrop-blur-xl border-r border-neutral-200/60 shadow-xl shadow-neutral-900/5">
          <div className="flex-1 flex flex-col pt-8 pb-6 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center flex-shrink-0 px-5 mb-8">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/80 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:ring-offset-2 transition-all duration-300 group active:scale-95"
              >
                <span className="sr-only">Toggle sidebar</span>
                <div className="text-base font-bold group-hover:scale-110 transition-transform duration-300">
                  {isCollapsed ? '→' : '←'}
                </div>
              </button>
              {!isCollapsed && (
                <div className="ml-4 flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-neutral-900/10 to-transparent rounded-xl blur-sm group-hover:blur-md transition-all duration-300" />
                    <img src="/images/logo.png" alt="Logo" className="relative h-8 w-8 object-contain" />
                  </div>
                  <div className="flex flex-col">
                    <h1 className="text-[11px] font-bold text-neutral-900 tracking-tight leading-[1.3] uppercase">
                      Network Management
                    </h1>
                    <span className="text-[9px] font-medium text-neutral-500 tracking-wider">Argentina</span>
                  </div>
                </div>
              )}
              {isCollapsed && (
                <div className="ml-3 relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-neutral-900/10 to-transparent rounded-xl blur-sm group-hover:blur-md transition-all duration-300" />
                  <img src="/images/logo.png" alt="Logo" className="relative h-8 w-8 object-contain" />
                </div>
              )}
            </div>
            
            {/* Navigation */}
            <nav className="mt-2 flex-1 px-3 space-y-1.5">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                const hasSubItems = item.subItems && item.subItems.length > 0
                const isHelpActive = hasSubItems && pathname.startsWith('/help')

                if (hasSubItems) {
                  return (
                    <div key={item.name}>
                      <button
                        onClick={() => setIsHelpMenuOpen(!isHelpMenuOpen)}
                        className={`group flex items-center w-full px-4 py-3 text-sm font-semibold rounded-2xl transition-all duration-300 relative ${
                          isHelpActive
                            ? 'bg-neutral-900 text-white shadow-lg shadow-neutral-900/25'
                            : 'text-neutral-700 hover:bg-neutral-100/80 hover:text-neutral-900 active:scale-[0.98]'
                        } ${isCollapsed ? 'justify-center' : ''}`}
                        title={isCollapsed ? item.name : undefined}
                      >
                        <item.icon className={`flex-shrink-0 h-5 w-5 transition-all duration-300 ${
                          isHelpActive ? 'scale-110' : 'group-hover:scale-110'
                        }`} strokeWidth={2.5} />
                        {!isCollapsed && (
                          <>
                            <span className="ml-4 animate-in fade-in slide-in-from-left-1 duration-200 flex-1 text-left tracking-tight">{item.name}</span>
                            {isHelpMenuOpen ? (
                              <ChevronUp className="flex-shrink-0 h-4 w-4 ml-2 transition-transform duration-300" strokeWidth={2.5} />
                            ) : (
                              <ChevronDown className="flex-shrink-0 h-4 w-4 ml-2 transition-transform duration-300" strokeWidth={2.5} />
                            )}
                          </>
                        )}
                        {isHelpActive && (
                          <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white shadow-lg animate-in zoom-in duration-200" />
                        )}
                      </button>
                      {!isCollapsed && isHelpMenuOpen && (
                        <div className="ml-8 mt-1.5 space-y-1 animate-in fade-in slide-in-from-left-1 duration-300">
                          {item.subItems.map((subItem) => {
                            const isSubActive = pathname === subItem.href
                            return (
                              <Link
                                key={subItem.name}
                                href={subItem.href}
                                className={`group flex items-center px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 ${
                                  isSubActive
                                    ? 'bg-neutral-800 text-white'
                                    : 'text-neutral-600 hover:bg-neutral-100/80 hover:text-neutral-900'
                                }`}
                                onClick={() => {
                                  if (isHovered) {
                                    setIsHovered(false)
                                    setIsCollapsed(true)
                                  }
                                }}
                              >
                                <span className="tracking-tight">{subItem.name}</span>
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
                    className={`group flex items-center px-4 py-3 text-sm font-semibold rounded-2xl transition-all duration-300 relative ${
                      isActive
                        ? 'bg-neutral-900 text-white shadow-lg shadow-neutral-900/25'
                        : 'text-neutral-700 hover:bg-neutral-100/80 hover:text-neutral-900 active:scale-[0.98]'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                    title={isCollapsed ? item.name : undefined}
                    onClick={() => {
                      if (isHovered) {
                        setIsHovered(false)
                        setIsCollapsed(true)
                      }
                    }}
                  >
                    <item.icon className={`flex-shrink-0 h-5 w-5 transition-all duration-300 ${
                      isActive ? 'scale-110' : 'group-hover:scale-110'
                    }`} strokeWidth={2.5} />
                    {!isCollapsed && (
                      <span className="ml-4 animate-in fade-in slide-in-from-left-1 duration-200 tracking-tight">{item.name}</span>
                    )}
                    {isActive && (
                      <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white shadow-lg animate-in zoom-in duration-200" />
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
          
          {/* User Section */}
          <div className="flex-shrink-0 border-t border-neutral-200/60 p-3 bg-gradient-to-b from-transparent to-neutral-50/50">
            {/* Notifications Bell */}
            {session?.user?.role !== 'vms' && (
              <div className={`mb-2 ${isCollapsed ? 'flex justify-center' : ''}`}>
                <Link
                  href="/notifications"
                  className={`group relative flex items-center px-4 py-3 text-sm font-medium rounded-2xl text-neutral-700 hover:bg-white hover:text-neutral-900 hover:shadow-md transition-all duration-300 active:scale-95 ${isCollapsed ? 'w-auto justify-center' : 'w-full'}`}
                  title={isCollapsed ? 'Notificaciones' : undefined}
                  onClick={() => {
                    if (isHovered) {
                      setIsHovered(false)
                      setIsCollapsed(true)
                    }
                  }}
                >
                  <div className="relative">
                    <Bell className="flex-shrink-0 h-5 w-5 text-neutral-600 group-hover:text-neutral-900 transition-all duration-300 group-hover:scale-110" strokeWidth={2.5} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full h-4.5 w-4.5 flex items-center justify-center shadow-lg">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <span className="ml-4 tracking-tight font-semibold">Notificaciones</span>
                  )}
                </Link>
              </div>
            )}

            <div className="relative w-full">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={`group flex items-center px-4 py-3 text-sm font-medium rounded-2xl text-neutral-700 hover:bg-white hover:text-neutral-900 hover:shadow-md transition-all duration-300 active:scale-95 ${isCollapsed ? 'w-auto justify-center' : 'w-full'}`}
                title={isCollapsed ? 'Menú de usuario' : undefined}
              >
                <div className="flex-shrink-0 h-9 w-9 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300">
                  <User className="h-4 w-4 text-white" strokeWidth={2.5} />
                </div>
                {!isCollapsed && (
                  <>
                    <span className="ml-3.5 flex-1 text-left truncate text-[13px] font-semibold tracking-tight">{session?.user?.name || session?.user?.email}</span>
                    {isUserMenuOpen ? (
                      <ChevronUp className="flex-shrink-0 h-4 w-4 ml-2 transition-transform duration-300" strokeWidth={2.5} />
                    ) : (
                      <ChevronDown className="flex-shrink-0 h-4 w-4 ml-2 transition-transform duration-300" strokeWidth={2.5} />
                    )}
                  </>
                )}
              </button>

              {isUserMenuOpen && (
                <div className={`absolute ${isCollapsed ? 'left-full ml-3 top-0' : 'bottom-full left-0 right-0 mb-3'} bg-white border border-neutral-200/60 rounded-2xl shadow-2xl z-[9999] min-w-[220px] overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
                  {session?.user?.role !== 'vms' && (
                    <Link
                      href="/notifications"
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        if (isHovered) {
                          setIsHovered(false)
                          setIsCollapsed(true)
                        }
                      }}
                      className="flex items-center px-5 py-3.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 border-b border-neutral-100/80 transition-all duration-200 group"
                    >
                      <Bell className="flex-shrink-0 h-4.5 w-4.5 mr-3.5 text-neutral-500 group-hover:text-neutral-900 transition-colors duration-200" strokeWidth={2.5} />
                      <span className="tracking-tight">Notificaciones</span>
                      {unreadCount > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-md">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </Link>
                  )}
                  <Link
                    href="/profile"
                    onClick={() => {
                      setIsUserMenuOpen(false)
                      if (isHovered) {
                        setIsHovered(false)
                        setIsCollapsed(true)
                      }
                    }}
                    className="flex items-center px-5 py-3.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 border-b border-neutral-100/80 transition-all duration-200 group"
                  >
                    <User className="flex-shrink-0 h-4.5 w-4.5 mr-3.5 text-neutral-500 group-hover:text-neutral-900 transition-colors duration-200" strokeWidth={2.5} />
                    <span className="tracking-tight">Perfil</span>
                  </Link>
                  {session?.user?.role === 'admin' && (
                    <Link
                      href="/users"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center px-5 py-3.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 border-b border-neutral-100/80 transition-all duration-200 group"
                    >
                      <Shield className="flex-shrink-0 h-4.5 w-4.5 mr-3.5 text-neutral-500 group-hover:text-neutral-900 transition-colors duration-200" strokeWidth={2.5} />
                      <span className="tracking-tight">Usuarios</span>
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
                    className="flex items-center px-5 py-3.5 text-sm font-semibold text-red-600 hover:bg-red-50 w-full text-left transition-all duration-200 group"
                  >
                    <LogOut className="flex-shrink-0 h-4.5 w-4.5 mr-3.5 group-hover:text-red-700 transition-colors duration-200" strokeWidth={2.5} />
                    <span className="tracking-tight">Cerrar Sesión</span>
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