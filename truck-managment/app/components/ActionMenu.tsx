'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { MoreVertical, Edit, Trash2 } from 'lucide-react'

interface ActionMenuProps {
  onEdit?: () => void
  onDelete?: () => void
  editLabel?: string
  deleteLabel?: string
}

export default function ActionMenu({
  onEdit,
  onDelete,
  editLabel = 'Editar',
  deleteLabel = 'Eliminar'
}: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleButtonClick = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        left: rect.right + window.scrollX - 128 // 128px = w-32
      })
    }
    setIsOpen(!isOpen)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
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

  return (
    <>
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={handleButtonClick}
          className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          title="Más opciones"
        >
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>

      {isOpen && createPortal(
        <div
          className="fixed z-50 w-32 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 border border-gray-200"
          style={{
            top: menuPosition.top + 4,
            left: menuPosition.left
          }}
        >
          <div className="py-1">
            {onEdit && (
              <button
                onClick={() => {
                  onEdit()
                  setIsOpen(false)
                }}
                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                <Edit className="h-4 w-4 mr-2" />
                {editLabel}
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => {
                  onDelete()
                  setIsOpen(false)
                }}
                className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleteLabel}
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}