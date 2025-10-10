import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import AppLayout from '@/app/components/AppLayout'
import EditInventoryForm from './EditInventoryForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditInventoryPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    return <div>No autorizado</div>
  }

  const { id } = await params

  const inventory = await prisma.inventory.findUnique({
    where: { id },
    include: {
      entry: {
        include: { provider: true }
      },
      location: {
        include: { warehouse: true }
      }
    }
  })

  if (!inventory) {
    notFound()
  }

  const entries = await prisma.entry.findMany({
    include: { provider: true }
  })

  const locations = await prisma.location.findMany({
    include: { warehouse: true }
  })

  return (
    <AppLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                Editar Registro de Inventario
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Modifica la información del registro de inventario
              </p>
            </div>
          </div>

          <div className="mt-8">
            <EditInventoryForm inventory={inventory} entries={entries} locations={locations} />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}