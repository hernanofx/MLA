import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const page = await prisma.wikiPage.findUnique({
      where: { id },
      include: {
        category: true
      }
    })

    if (!page) {
      return NextResponse.json(
        { error: 'Página no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(page)
  } catch (error) {
    console.error('Error fetching wiki page:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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

    // Check if slug is unique (excluding current page)
    const existingPage = await prisma.wikiPage.findFirst({
      where: {
        slug: finalSlug,
        id: { not: id }
      }
    })

    if (existingPage) {
      return NextResponse.json(
        { error: 'Ya existe una página con este slug' },
        { status: 400 }
      )
    }

    const page = await prisma.wikiPage.update({
      where: { id },
      data: {
        title,
        slug: finalSlug,
        content,
        categoryId,
        order
      },
      include: {
        category: true
      }
    })

    return NextResponse.json(page)
  } catch (error) {
    console.error('Error updating wiki page:', error)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Página no encontrada' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    await prisma.wikiPage.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Página eliminada' })
  } catch (error) {
    console.error('Error deleting wiki page:', error)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Página no encontrada' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}