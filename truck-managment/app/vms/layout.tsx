import { ReactNode } from 'react'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'

export const metadata = {
  title: 'VMS - Sistema de Gestión de Proveedores',
  description: 'Sistema de verificación y gestión de envíos para proveedores',
}

export default async function VMSLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await getServerSession(authOptions)

  // Verificar que el usuario tenga rol VMS o admin
  if (!session || (session.user.role !== 'vms' && session.user.role !== 'admin')) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}
