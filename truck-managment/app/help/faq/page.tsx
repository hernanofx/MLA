'use client'

import { useState } from 'react'
import AppLayout from '@/app/components/AppLayout'
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: '¿Cómo registro un nuevo camión en el sistema?',
    answer: 'Para registrar un nuevo camión, ve al módulo "Camiones" desde el menú lateral, haz clic en "Nuevo Camión" y completa todos los campos requeridos como placa, modelo, capacidad y características técnicas.',
    category: 'Camiones'
  },
  {
    id: '2',
    question: '¿Cómo creo una nueva carga?',
    answer: 'Accede al módulo "Cargas/Descargas", haz clic en "Nueva Carga" y completa la información básica (origen, destino, productos). Luego selecciona un camión disponible y asigna un conductor.',
    category: 'Cargas'
  },
  {
    id: '3',
    question: '¿Cómo gestionar el inventario?',
    answer: 'El inventario se actualiza automáticamente con cada entrada o salida. Para ajustes manuales, ve al módulo "Stock" y usa las opciones de ajuste en la pestaña correspondiente.',
    category: 'Inventario'
  },
  {
    id: '4',
    question: '¿Cómo asignar proveedores a zonas de cobertura?',
    answer: 'En el módulo "Mapas", selecciona una zona en el mapa, luego en el panel lateral elige un proveedor del dropdown y haz clic en "Asignar".',
    category: 'Proveedores'
  },
  {
    id: '5',
    question: '¿Cómo configurar notificaciones?',
    answer: 'Ve al módulo "Notificaciones" y en la pestaña "Preferencias" marca o desmarca los tipos de eventos que quieres recibir como notificaciones.',
    category: 'Notificaciones'
  },
  {
    id: '6',
    question: '¿Cómo generar reportes?',
    answer: 'Accede al módulo "Reportes", selecciona el tipo de reporte deseado, configura los filtros de fecha y otros criterios, luego haz clic en "Generar" para descargar en PDF o Excel.',
    category: 'Reportes'
  },
  {
    id: '7',
    question: '¿Cómo cambiar mi contraseña?',
    answer: 'Ve a tu perfil desde el menú de usuario en la sidebar, luego en la sección "Cambiar Contraseña" ingresa tu contraseña actual y la nueva.',
    category: 'Cuenta'
  },
  {
    id: '8',
    question: '¿Qué permisos necesito para acceder a ciertas funciones?',
    answer: 'Los usuarios con rol "Administrador" tienen acceso completo. Los usuarios regulares pueden acceder a funciones operativas pero no a gestión de usuarios o configuraciones avanzadas.',
    category: 'Permisos'
  }
]

const categories = ['Todas', ...Array.from(new Set(faqData.map(item => item.category)))]

export default function FAQPage() {
  const [selectedCategory, setSelectedCategory] = useState('Todas')
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id)
    } else {
      newOpenItems.add(id)
    }
    setOpenItems(newOpenItems)
  }

  const filteredFAQs = selectedCategory === 'Todas'
    ? faqData
    : faqData.filter(item => item.category === selectedCategory)

  return (
    <AppLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <HelpCircle className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Preguntas Frecuentes</h1>
          </div>
          <p className="text-lg text-gray-600">
            Encuentra respuestas a las preguntas más comunes sobre el uso del sistema.
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFAQs.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md border border-gray-200">
              <button
                onClick={() => toggleItem(item.id)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded mr-3">
                    {item.category}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {item.question}
                  </h3>
                </div>
                {openItems.has(item.id) ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </button>
              {openItems.has(item.id) && (
                <div className="px-6 pb-4">
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-gray-700 leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredFAQs.length === 0 && (
          <div className="text-center py-12">
            <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron preguntas
            </h3>
            <p className="text-gray-600">
              No hay preguntas frecuentes en la categoría seleccionada.
            </p>
          </div>
        )}

        {/* Contact Support */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <HelpCircle className="h-6 w-6 text-blue-600 mr-3 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                ¿No encuentras la respuesta que buscas?
              </h3>
              <p className="text-blue-700 mb-4">
                Si tienes alguna pregunta adicional o necesitas ayuda específica, puedes:
              </p>
              <ul className="text-blue-700 space-y-1">
                <li>• Consultar el Centro de Ayuda para guías detalladas</li>
                <li>• Contactar al administrador del sistema</li>
                <li>• Revisar la documentación técnica disponible</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}