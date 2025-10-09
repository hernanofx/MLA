'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { MoreVertical, Edit, Trash2 } from 'lucide-react'

interface ActionMenuProps {
  onEdit?: () => void
  onDelete?: () => void
  editHref?: string
  editLabel?: string
  deleteLabel?: string
}

export default function ActionMenu({
  onEdit,
  onDelete,
  editHref,
  editLabel = 'Editar',
  deleteLabel = 'Eliminar'
}: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Button clicked, current isOpen:', isOpen)
    setIsOpen(!isOpen)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        console.log('Click outside detected, closing menu')
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Edit clicked, href:', editHref, 'onEdit:', !!onEdit)
    if (onEdit) {
      onEdit()
    }
    setIsOpen(false)
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Delete clicked')
    if (onDelete) {
      onDelete()
    }
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={handleButtonClick}
        className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        title="Más opciones"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-32 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 border border-gray-200">
          <div className="py-1">
            {(onEdit || editHref) && (
              editHref ? (
                <Link
                  href={editHref}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  onClick={() => setIsOpen(false)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {editLabel}
                </Link>
              ) : (
                <button
                  onClick={handleEditClick}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {editLabel}
                </button>
              )
            )}
            {onDelete && (
              <button
                onClick={handleDeleteClick}
                className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleteLabel}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}