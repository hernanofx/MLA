'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import AppLayout from '@/app/components/AppLayout'
import { ArrowLeft, Save, Image, Video } from 'lucide-react'

interface Category {
  id: string
  name: string
  description: string | null
}

export default function NewPagePage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    categoryId: '',
    order: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect if not admin
  if (session && session.user.role !== 'admin') {
    router.push('/wiki')
    return null
  }

  useEffect(() => {
    fetchCategories()
    // Set category from URL params on client side
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const categoryId = urlParams.get('categoryId')
      if (categoryId) {
        setFormData(prev => ({ ...prev, categoryId }))
      }
    }
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/wiki/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/wiki/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        router.push('/wiki')
      } else {
        const data = await response.json()
        setError(data.error || 'Error al crear la página')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'order' ? parseInt(value) || 0 : value
    }))
  }

  const generateSlug = () => {
    const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    setFormData(prev => ({ ...prev, slug }))
  }

  const insertImage = () => {
    const url = prompt('Ingresa la URL de la imagen:')
    if (url) {
      const imageHtml = `<img src="${url}" alt="Imagen" class="max-w-full h-auto rounded-lg shadow-md my-4" />`
      setFormData(prev => ({
        ...prev,
        content: prev.content + imageHtml
      }))
    }
  }

  const insertVideo = () => {
    const url = prompt('Ingresa la URL del video (YouTube, Vimeo, etc.):')
    if (url) {
      // Convert YouTube URL to embed
      let embedUrl = url
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = url.includes('youtu.be')
          ? url.split('youtu.be/')[1]
          : url.split('v=')[1]?.split('&')[0]
        if (videoId) {
          embedUrl = `https://www.youtube.com/embed/${videoId}`
        }
      }

      const videoHtml = `<div class="my-4">
        <iframe
          src="${embedUrl}"
          class="w-full max-w-2xl h-64 rounded-lg shadow-md"
          frameborder="0"
          allowfullscreen
        ></iframe>
      </div>`
      setFormData(prev => ({
        ...prev,
        content: prev.content + videoHtml
      }))
    }
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Nueva Página</h1>
          <p className="mt-2 text-lg text-gray-600">
            Crea una nueva página en el Wiki con contenido enriquecido.
          </p>
        </div>

        <div className="max-w-4xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Título *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Título de la página"
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                  Slug
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="url-amigable"
                  />
                  <button
                    type="button"
                    onClick={generateSlug}
                    className="mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Generar
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
                Categoría *
              </label>
              <select
                id="categoryId"
                name="categoryId"
                required
                value={formData.categoryId}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Selecciona una categoría</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="order" className="block text-sm font-medium text-gray-700">
                Orden
              </label>
              <input
                type="number"
                id="order"
                name="order"
                value={formData.order}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="0"
              />
              <p className="mt-1 text-sm text-gray-500">
                Número para ordenar las páginas dentro de la categoría
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                  Contenido *
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={insertImage}
                    className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50"
                    title="Insertar imagen"
                  >
                    <Image className="h-3 w-3 mr-1" />
                    Imagen
                  </button>
                  <button
                    type="button"
                    onClick={insertVideo}
                    className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50"
                    title="Insertar video"
                  >
                    <Video className="h-3 w-3 mr-1" />
                    Video
                  </button>
                </div>
              </div>
              <textarea
                id="content"
                name="content"
                required
                rows={15}
                value={formData.content}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
                placeholder="Escribe el contenido de la página. Puedes usar HTML para formato, imágenes y videos..."
              />
              <p className="mt-1 text-sm text-gray-500">
                Puedes usar HTML básico para formato. Usa los botones para insertar imágenes y videos fácilmente.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Creando...' : 'Crear Página'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  )
}