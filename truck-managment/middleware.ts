import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // Si es operario, solo permite acceso a /loads
    if (token?.role === 'operario') {
      // Permitir acceso a /loads y sus subrutas
      if (pathname.startsWith('/loads') || pathname.startsWith('/stocks') || pathname === '/profile' || pathname === '/notifications') {
        return NextResponse.next()
      }
      // Bloquear acceso a otras rutas
      return NextResponse.redirect(new URL('/loads', req.url))
    }

    // VMS solo accede a VMS
    if (token?.role === 'vms') {
      if (pathname.startsWith('/vms') || pathname === '/profile' || pathname === '/notifications') {
        return NextResponse.next()
      }
      return NextResponse.redirect(new URL('/vms', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
)

export const config = {
  matcher: ['/dashboard/:path*', '/providers/:path*', '/trucks/:path*', '/entries/:path*', '/reports/:path*', '/vms/:path*', '/loads/:path*', '/stocks/:path*', '/maps/:path*', '/wiki/:path*', '/users/:path*', '/profile/:path*']
}