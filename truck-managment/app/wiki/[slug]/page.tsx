'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import AppLayout from '@/app/components/AppLayout'
import { ArrowLeft, Edit, Home } from 'lucide-react'
import Link from 'next/link'

interface WikiPage {
  id: string
  title: string
  slug: string
  content: string
  categoryId: string
  order: number
  category: {
    id: string
    name: string
    description: string | null
  }
}

export default function WikiPageView() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [page, setPage] = useState<WikiPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.slug) {
      fetchPage()
    }
  }, [params.slug])

  const fetchPage = async () => {
    try {
      // Since we don't have a slug-based API, we'll fetch all pages and find by slug
      // In a real app, you'd want an API endpoint that fetches by slug
      const response = await fetch('/api/wiki/pages')
      if (response.ok) {
        const pages: WikiPage[] = await response.json()
        const foundPage = pages.find(p => p.slug === params.slug)
        if (foundPage) {
          setPage(foundPage)
        } else {
          setError('Página no encontrada')
        }
      } else {
        setError('Error al cargar la página')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    )
  }

  if (error || !page) {
    return (
      <AppLayout>
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver
            </button>
          </div>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Página no encontrada</h1>
            <p className="text-gray-600 mb-6">
              {error || 'La página que buscas no existe.'}
            </p>
            <Link
              href="/wiki"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Home className="h-4 w-4 mr-2" />
              Ir al Wiki
            </Link>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Volver
              </button>
              <div className="text-sm text-gray-500">
                <Link href="/wiki" className="hover:text-blue-600">
                  Wiki
                </Link>
                <span className="mx-2">›</span>
                <Link href={`/wiki?category=${page.category.id}`} className="hover:text-blue-600">
                  {page.category.name}
                </Link>
                <span className="mx-2">›</span>
                <span className="text-gray-900">{page.title}</span>
              </div>
            </div>
            {session?.user?.role === 'admin' && (
              <Link
                href={`/wiki/pages/${page.id}/edit`}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Link>
            )}
          </div>
        </div>

        <div className="max-w-4xl">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {page.category.name}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">{page.title}</h1>
            </div>

            <div className="px-8 py-6">
              <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: page.content }}
                style={{
                  // Basic prose styling
                  lineHeight: '1.7',
                  color: '#374151'
                }}
              />
            </div>
          </div>

          {/* Related pages in the same category */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Más en {page.category.name}
            </h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-600">
                Para ver otras páginas en esta categoría,{' '}
                <Link href="/wiki" className="text-blue-600 hover:text-blue-800">
                  vuelve al índice del Wiki
                </Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}