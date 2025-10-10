import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AppLayout from '@/app/components/AppLayout'
import StocksClient from './StocksClient'

export default async function StocksPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  return (
    <AppLayout>
      <StocksClient />
    </AppLayout>
  )
}