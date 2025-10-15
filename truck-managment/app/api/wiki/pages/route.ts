import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')

    const where = categoryId ? { categoryId } : {}

    const pages = await prisma.wikiPage.findMany({
      where,
      include: {
        category: true
      },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json(pages)
  } catch (error) {
    console.error('Error fetching wiki pages:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    const { title, slug, content, categoryId, order } = await request.json()

    if (!title || !content || !categoryId) {
      return NextResponse.json(
        { error: 'Título, contenido y categoría son requeridos' },
        { status: 400 }
      )
    }

    // Generate slug if not provided
    const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    // Check if slug is unique
    const existingPage = await prisma.wikiPage.findUnique({
      where: { slug: finalSlug }
    })

    if (existingPage) {
      return NextResponse.json(
        { error: 'Ya existe una página con este slug' },
        { status: 400 }
      )
    }

    const page = await prisma.wikiPage.create({
      data: {
        title,
        slug: finalSlug,
        content,
        categoryId,
        order: order || 0
      },
      include: {
        category: true
      }
    })

    return NextResponse.json(page, { status: 201 })
  } catch (error) {
    console.error('Error creating wiki page:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}