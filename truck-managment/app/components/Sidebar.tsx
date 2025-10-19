"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import {
  Truck,
  ClipboardList,
  BarChart3,
  LogOut,
  Shield,
  Menu,
  X,
  Package,
  User,
  ChevronRight,
  Building2,
  Warehouse,
  LayoutDashboard,
  Bell,
  HelpCircle,
  MapPin,
  BookOpen,
} from "lucide-react"

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({})

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("sidebarToggle", { detail: { isCollapsed } }))

    const fetchUnreadCount = async () => {
      try {
        const response = await fetch("/api/notifications")
        if (response.ok) {
          const data = await response.json()
          setUnreadCount(data.unreadCount || 0)
        }
      } catch (error) {
        console.error("Error fetching notifications:", error)
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
        setExpandedMenus({})
      }, 500)
      setHoverTimeout(timeout)
    }
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
    setExpandedMenus({})
  }

  const toggleSubMenu = (menuName: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }))
  }

  const baseNavigation =
    session?.user?.role === "vms"
      ? [{ name: "VMS", href: "/vms", icon: Truck }]
      : [
          {
            name: "Dashboard",
            href: "/dashboard",
            icon: LayoutDashboard,
            subItems: [
              { name: "Vista General", href: "/dashboard" },
              { name: "Reportes", href: "/reports", icon: BarChart3 },
            ],
          },
          { name: "Proveedores", href: "/providers", icon: Building2 },
          {
            name: "Logística",
            href: "#",
            icon: Truck,
            subItems: [
              { name: "Camiones", href: "/trucks", icon: Truck },
              { name: "Entradas/Salidas", href: "/entries", icon: ClipboardList },
              { name: "Cargas/Descargas", href: "/loads", icon: Package },
            ],
          },
          { name: "Stock", href: "/stocks", icon: Warehouse },
          { name: "Mapas", href: "/maps", icon: MapPin },
          { name: "Procesos", href: "/wiki", icon: BookOpen },
          {
            name: "Ayuda",
            href: "/help",
            icon: HelpCircle,
            subItems: [
              { name: "Centro de Ayuda", href: "/help" },
              { name: "FAQ", href: "/help/faq" },
            ],
          },
        ]

  const navigation = baseNavigation

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-neutral-200/60">
        <div className="flex items-center justify-between px-4 h-16">
          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80 active:scale-95 transition-all duration-200"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex items-center gap-2">
            <img src="/images/logo.png" alt="Logo" className="h-7 w-7 object-contain" />
            <div className="text-[10px] font-semibold text-neutral-900 leading-tight tracking-tight">
              Network
              <br />
              Management
              <br />
              Argentina
            </div>
          </div>
          <div className="w-9" />
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={closeMobileMenu} aria-hidden="true" />
          <div className="relative flex w-full max-w-xs flex-col bg-white shadow-2xl">
            <div className="flex flex-col flex-grow overflow-y-auto">
              <div className="flex items-center px-5 h-16 border-b border-neutral-100">
                <img src="/images/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
                <div className="ml-3 text-xs font-semibold text-neutral-900 leading-tight tracking-tight">
                  Network
                  <br />
                  Management
                  <br />
                  Argentina
                </div>
              </div>

              <nav className="flex-1 px-3 py-4 space-y-0.5">
                {navigation.map((item) => {
                  const isActive =
                    pathname === item.href || (item.subItems && item.subItems.some((sub) => pathname === sub.href))
                  const hasSubItems = item.subItems && item.subItems.length > 0
                  const isExpanded = expandedMenus[item.name]

                  if (hasSubItems) {
                    return (
                      <div key={item.name}>
                        <button
                          onClick={() => toggleSubMenu(item.name)}
                          className={`group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                            isActive
                              ? "bg-neutral-900 text-white"
                              : "text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100"
                          }`}
                        >
                          <item.icon className="flex-shrink-0 h-[18px] w-[18px]" />
                          <span className="ml-3 flex-1 text-left">{item.name}</span>
                          <ChevronRight
                            className={`flex-shrink-0 h-4 w-4 transition-transform duration-200 ${
                              isExpanded ? "rotate-90" : ""
                            }`}
                          />
                        </button>
                        <div
                          className={`overflow-hidden transition-all duration-200 ${
                            isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                          }`}
                        >
                          <div className="ml-9 mt-1 space-y-0.5 border-l-2 border-neutral-100 pl-3">
                            {item.subItems.map((subItem) => {
                              const isSubActive = pathname === subItem.href
                              return (
                                <Link
                                  key={subItem.name}
                                  href={subItem.href}
                                  onClick={closeMobileMenu}
                                  className={`block px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                    isSubActive
                                      ? "bg-neutral-800 text-white"
                                      : "text-neutral-600 hover:bg-neutral-50 active:bg-neutral-100"
                                  }`}
                                >
                                  {subItem.name}
                                </Link>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={closeMobileMenu}
                      className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                        isActive
                          ? "bg-neutral-900 text-white"
                          : "text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100"
                      }`}
                    >
                      <item.icon className="flex-shrink-0 h-[18px] w-[18px]" />
                      <span className="ml-3">{item.name}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>

            <div className="flex-shrink-0 border-t border-neutral-100 p-3 bg-neutral-50/50">
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg text-neutral-700 hover:bg-white active:bg-neutral-50 transition-all duration-200"
                >
                  <div className="flex-shrink-0 h-7 w-7 rounded-full bg-neutral-900 flex items-center justify-center">
                    <User className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="ml-3 flex-1 text-left truncate text-xs">
                    {session?.user?.name || session?.user?.email}
                  </span>
                  <ChevronRight
                    className={`flex-shrink-0 h-4 w-4 transition-transform duration-200 ${
                      isUserMenuOpen ? "rotate-90" : ""
                    }`}
                  />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-neutral-200 rounded-lg shadow-xl overflow-hidden">
                    {session?.user?.role !== "vms" && (
                      <Link
                        href="/notifications"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 border-b border-neutral-100"
                      >
                        <Bell className="flex-shrink-0 h-4 w-4 mr-3 text-neutral-500" />
                        Notificaciones
                        {unreadCount > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-[10px] font-semibold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        )}
                      </Link>
                    )}
                    <Link
                      href="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 border-b border-neutral-100"
                    >
                      <User className="flex-shrink-0 h-4 w-4 mr-3 text-neutral-500" />
                      Perfil
                    </Link>
                    {session?.user?.role === "admin" && (
                      <Link
                        href="/users"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 border-b border-neutral-100"
                      >
                        <Shield className="flex-shrink-0 h-4 w-4 mr-3 text-neutral-500" />
                        Usuarios
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        signOut({ callbackUrl: "/login" })
                        setIsUserMenuOpen(false)
                      }}
                      className="flex items-center px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 w-full text-left"
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

      {/* Desktop Sidebar */}
      <div
        className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 transition-all duration-300 ease-out ${
          isCollapsed ? "md:w-16" : "md:w-64"
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-neutral-200/60">
          <div className="flex-1 flex flex-col overflow-y-auto">
            <div className="flex items-center h-16 px-3 border-b border-neutral-100">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 active:scale-95 transition-all duration-200"
                aria-label="Toggle sidebar"
              >
                <div className="text-sm font-medium">{isCollapsed ? "→" : "←"}</div>
              </button>
              {!isCollapsed && (
                <div className="ml-2 flex items-center gap-2 min-w-0">
                  <img src="/images/logo.png" alt="Logo" className="h-6 w-6 object-contain flex-shrink-0" />
                  <div className="text-[10px] font-semibold text-neutral-900 leading-tight tracking-tight">
                    Network
                    <br />
                    Management
                    <br />
                    Argentina
                  </div>
                </div>
              )}
              {isCollapsed && <img src="/images/logo.png" alt="Logo" className="ml-1 h-6 w-6 object-contain" />}
            </div>

            <nav className="flex-1 px-2 py-4 space-y-0.5">
              {navigation.map((item) => {
                const isActive =
                  pathname === item.href || (item.subItems && item.subItems.some((sub) => pathname === sub.href))
                const hasSubItems = item.subItems && item.subItems.length > 0
                const isExpanded = expandedMenus[item.name]

                if (hasSubItems) {
                  return (
                    <div key={item.name}>
                      <button
                        onClick={() => !isCollapsed && toggleSubMenu(item.name)}
                        className={`group flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                          isActive ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-50"
                        } ${isCollapsed ? "justify-center" : ""}`}
                        title={isCollapsed ? item.name : undefined}
                      >
                        <item.icon className="flex-shrink-0 h-[18px] w-[18px]" />
                        {!isCollapsed && (
                          <>
                            <span className="ml-3 flex-1 text-left">{item.name}</span>
                            <ChevronRight
                              className={`flex-shrink-0 h-4 w-4 transition-transform duration-200 ${
                                isExpanded ? "rotate-90" : ""
                              }`}
                            />
                          </>
                        )}
                      </button>
                      {!isCollapsed && (
                        <div
                          className={`overflow-hidden transition-all duration-200 ${
                            isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                          }`}
                        >
                          <div className="ml-9 mt-1 space-y-0.5 border-l-2 border-neutral-100 pl-3">
                            {item.subItems.map((subItem) => {
                              const isSubActive = pathname === subItem.href
                              return (
                                <Link
                                  key={subItem.name}
                                  href={subItem.href}
                                  onClick={() => {
                                    if (isHovered) {
                                      setIsHovered(false)
                                      setIsCollapsed(true)
                                      setExpandedMenus({})
                                    }
                                  }}
                                  className={`block px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                                    isSubActive ? "bg-neutral-800 text-white" : "text-neutral-600 hover:bg-neutral-50"
                                  }`}
                                >
                                  {subItem.name}
                                </Link>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-50"
                    } ${isCollapsed ? "justify-center" : ""}`}
                    title={isCollapsed ? item.name : undefined}
                    onClick={() => {
                      if (isHovered) {
                        setIsHovered(false)
                        setIsCollapsed(true)
                      }
                    }}
                  >
                    <item.icon className="flex-shrink-0 h-[18px] w-[18px]" />
                    {!isCollapsed && <span className="ml-3">{item.name}</span>}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex-shrink-0 border-t border-neutral-100 p-2 bg-neutral-50/30">
            {session?.user?.role !== "vms" && (
              <div className={`mb-1 ${isCollapsed ? "flex justify-center" : ""}`}>
                <Link
                  href="/notifications"
                  className={`group relative flex items-center px-3 py-2 text-sm font-medium rounded-lg text-neutral-700 hover:bg-white transition-all duration-200 ${
                    isCollapsed ? "w-auto justify-center" : "w-full"
                  }`}
                  title={isCollapsed ? "Notificaciones" : undefined}
                  onClick={() => {
                    if (isHovered) {
                      setIsHovered(false)
                      setIsCollapsed(true)
                    }
                  }}
                >
                  <div className="relative">
                    <Bell className="flex-shrink-0 h-[18px] w-[18px]" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-semibold rounded-full h-3.5 min-w-[14px] px-1 flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </div>
                  {!isCollapsed && <span className="ml-3">Notificaciones</span>}
                </Link>
              </div>
            )}

            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-neutral-700 hover:bg-white transition-all duration-200 ${
                  isCollapsed ? "w-auto justify-center" : "w-full"
                }`}
                title={isCollapsed ? "Menú de usuario" : undefined}
              >
                <div className="flex-shrink-0 h-[18px] w-[18px] rounded-full bg-neutral-900 flex items-center justify-center">
                  <User className="h-2.5 w-2.5 text-white" />
                </div>
                {!isCollapsed && (
                  <>
                    <span className="ml-3 flex-1 text-left truncate text-xs">
                      {session?.user?.name || session?.user?.email}
                    </span>
                    <ChevronRight
                      className={`flex-shrink-0 h-4 w-4 transition-transform duration-200 ${
                        isUserMenuOpen ? "rotate-90" : ""
                      }`}
                    />
                  </>
                )}
              </button>

              {isUserMenuOpen && (
                <div
                  className={`absolute ${
                    isCollapsed ? "left-full ml-2 top-0" : "bottom-full left-0 right-0 mb-2"
                  } bg-white border border-neutral-200 rounded-lg shadow-xl z-[9999] min-w-[200px] overflow-hidden`}
                >
                  {session?.user?.role !== "vms" && (
                    <Link
                      href="/notifications"
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        if (isHovered) {
                          setIsHovered(false)
                          setIsCollapsed(true)
                        }
                      }}
                      className="flex items-center px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 border-b border-neutral-100"
                    >
                      <Bell className="flex-shrink-0 h-4 w-4 mr-3 text-neutral-500" />
                      Notificaciones
                      {unreadCount > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-[10px] font-semibold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center">
                          {unreadCount > 99 ? "99+" : unreadCount}
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
                    className="flex items-center px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 border-b border-neutral-100"
                  >
                    <User className="flex-shrink-0 h-4 w-4 mr-3 text-neutral-500" />
                    Perfil
                  </Link>
                  {session?.user?.role === "admin" && (
                    <Link
                      href="/users"
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        if (isHovered) {
                          setIsHovered(false)
                          setIsCollapsed(true)
                        }
                      }}
                      className="flex items-center px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 border-b border-neutral-100"
                    >
                      <Shield className="flex-shrink-0 h-4 w-4 mr-3 text-neutral-500" />
                      Usuarios
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      signOut({ callbackUrl: "/login" })
                      setIsUserMenuOpen(false)
                      if (isHovered) {
                        setIsHovered(false)
                        setIsCollapsed(true)
                      }
                    }}
                    className="flex items-center px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 w-full text-left"
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
