'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import AppLayout from '@/app/components/AppLayout'
import { BookOpen, Plus, Edit, Trash2, ChevronRight, FileText, FolderOpen } from 'lucide-react'

interface WikiCategory {
  id: string
  name: string
  description: string | null
  order: number
  pages: WikiPage[]
}

interface WikiPage {
  id: string
  title: string
  slug: string
  content: string
  order: number
}

export default function WikiPage() {
  const { data: session } = useSession()
  const [categories, setCategories] = useState<WikiCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/wiki/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      } else {
        setError('Error al cargar las categorías')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const deleteCategory = async (categoryId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta categoría? Se eliminarán todas las páginas asociadas.')) {
      return
    }

    try {
      const response = await fetch(`/api/wiki/categories/${categoryId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setCategories(categories.filter(cat => cat.id !== categoryId))
      } else {
        alert('Error al eliminar la categoría')
      }
    } catch (error) {
      alert('Error de conexión')
    }
  }

  const deletePage = async (pageId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta página?')) {
      return
    }

    try {
      const response = await fetch(`/api/wiki/pages/${pageId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Refresh categories to update the list
        fetchCategories()
      } else {
        alert('Error al eliminar la página')
      }
    } catch (error) {
      alert('Error de conexión')
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

  if (error) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">Wiki</h1>
            </div>
            {session?.user?.role === 'admin' && (
              <div className="flex gap-3">
                <Link
                  href="/wiki/categories/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Categoría
                </Link>
                <Link
                  href="/wiki/pages/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Página
                </Link>
              </div>
            )}
          </div>
          <p className="mt-2 text-lg text-gray-600">
            Base de conocimientos del sistema de gestión de camiones.
          </p>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay contenido en el Wiki
            </h3>
            <p className="text-gray-600 mb-6">
              {session?.user?.role === 'admin'
                ? 'Comienza creando tu primera categoría o página.'
                : 'El administrador aún no ha creado contenido.'
              }
            </p>
            {session?.user?.role === 'admin' && (
              <div className="flex justify-center gap-3">
                <Link
                  href="/wiki/categories/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Categoría
                </Link>
                <Link
                  href="/wiki/pages/new"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Página
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {categories.map((category) => (
              <div key={category.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FolderOpen className="h-5 w-5 text-blue-600 mr-3" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {session?.user?.role === 'admin' && (
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/wiki/categories/${category.id}/edit`}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Editar categoría"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => deleteCategory(category.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Eliminar categoría"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {category.pages.length === 0 ? (
                  <div className="px-6 py-8 text-center">
                    <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No hay páginas en esta categoría</p>
                    {session?.user?.role === 'admin' && (
                      <Link
                        href={`/wiki/pages/new?categoryId=${category.id}`}
                        className="inline-flex items-center mt-3 px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Crear primera página
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {category.pages.map((page) => (
                      <div key={page.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <Link
                            href={`/wiki/${page.slug}`}
                            className="flex items-center flex-1 group"
                          >
                            <FileText className="h-4 w-4 text-gray-400 mr-3 group-hover:text-blue-600 transition-colors" />
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                {page.title}
                              </h4>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {page.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                          </Link>
                          {session?.user?.role === 'admin' && (
                            <div className="flex items-center gap-1 ml-4">
                              <Link
                                href={`/wiki/pages/${page.id}/edit`}
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Editar página"
                              >
                                <Edit className="h-3 w-3" />
                              </Link>
                              <button
                                onClick={() => deletePage(page.id)}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                title="Eliminar página"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}