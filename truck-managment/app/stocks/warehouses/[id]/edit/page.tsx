import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import AppLayout from '@/app/components/AppLayout'
import EditWarehouseForm from './EditWarehouseForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditWarehousePage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return <div>No autorizado</div>
  }

  const { id } = await params

  const warehouse = await prisma.warehouse.findUnique({
    where: { id },
    include: {
      locations: true
    }
  })

  if (!warehouse) {
    notFound()
  }

  return (
    <AppLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                Editar Almacén
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Modifica la información del almacén
              </p>
            </div>
          </div>

          <div className="mt-8">
            <EditWarehouseForm warehouse={warehouse} />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}