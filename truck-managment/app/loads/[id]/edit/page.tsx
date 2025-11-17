'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import AppLayout from '@/app/components/AppLayout'
import jsPDF from 'jspdf'

interface Provider {
  id: string
  name: string
}

interface Truck {
  id: string
  licensePlate: string
}

interface LoadData {
  id: string
  providerId: string
  truckId: string
  arrivalTime: string | null
  departureTime: string | null
  week: number
  month: number
  durationMinutes: number | null
  quantity: string | null
  container: string | null
  precinto: string | null
  provider: { name: string }
  truck: { licensePlate: string }
}

interface TransportistData {
  name: string
  lastName: string
  dni: string
}

export default function EditLoadPage() {
  const [load, setLoad] = useState<LoadData | null>(null)
  const [providers, setProviders] = useState<Provider[]>([])
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [selectedProvider, setSelectedProvider] = useState('')
  const [selectedTruck, setSelectedTruck] = useState('')
  const [arrivalChecked, setArrivalChecked] = useState(false)
  const [departureChecked, setDepartureChecked] = useState(false)
  const [arrivalTime, setArrivalTime] = useState<string | null>(null)
  const [departureTime, setDepartureTime] = useState<string | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const [quantity, setQuantity] = useState('')
  const [container, setContainer] = useState('')
  const [precinto, setPrecinto] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Modal para transportista
  const [showTransportistModal, setShowTransportistModal] = useState(false)
  const [showRemitoConfirmation, setShowRemitoConfirmation] = useState(false)
  const [transportistName, setTransportistName] = useState('')
  const [transportistLastName, setTransportistLastName] = useState('')
  const [transportistDNI, setTransportistDNI] = useState('')
  const [generatingPDF, setGeneratingPDF] = useState(false)
  
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'loading') return
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'operario')) {
      router.push('/loads')
      return
    }
    fetchLoad()
    fetchProviders()
    fetchTrucks()
  }, [id, session, status])

  useEffect(() => {
    if (arrivalTime && departureTime) {
      const arrival = new Date(arrivalTime)
      const departure = new Date(departureTime)
      const diffMinutes = Math.round((departure.getTime() - arrival.getTime()) / (1000 * 60))
      setDuration(diffMinutes > 0 ? diffMinutes : 0)
    } else {
      setDuration(null)
    }
  }, [arrivalTime, departureTime])

  const fetchLoad = async () => {
    try {
      const response = await fetch(`/api/loads/${id}`)
      if (response.ok) {
        const loadData: LoadData = await response.json()
        setLoad(loadData)
        setSelectedProvider(loadData.providerId)
        setSelectedTruck(loadData.truck.licensePlate)
        setArrivalTime(loadData.arrivalTime)
        setDepartureTime(loadData.departureTime)
        setArrivalChecked(!!loadData.arrivalTime)
        setDepartureChecked(!!loadData.departureTime)
        setQuantity(loadData.quantity || '')
        setContainer(loadData.container || '')
        setPrecinto(loadData.precinto || '')
      } else {
        setError('Carga no encontrada')
      }
    } catch (error) {
      setError('Error al cargar carga')
    } finally {
      setFetchLoading(false)
    }
  }

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/providers?page=1&limit=1000')
      if (response.ok) {
        const data = await response.json()
        setProviders(data.providers || [])
      }
    } catch (error) {
      console.error('Error fetching providers:', error)
    }
  }

  const fetchTrucks = async () => {
    try {
      const response = await fetch('/api/trucks?page=1&limit=1000')
      if (response.ok) {
        const data = await response.json()
        setTrucks(data.trucks || [])
      }
    } catch (error) {
      console.error('Error fetching trucks:', error)
    }
  }

  const handleArrivalCheck = () => {
    if (!arrivalChecked) {
      const now = new Date().toISOString()
      setArrivalTime(now)
    } else {
      setArrivalTime(null)
    }
    setArrivalChecked(!arrivalChecked)
  }

  const handleDepartureCheck = () => {
    if (!departureChecked) {
      // Primero mostrar confirmación de generar remito
      setShowRemitoConfirmation(true)
    } else {
      setDepartureTime(null)
      setDepartureChecked(false)
    }
  }

  const generateRemitoPDF = async (transportistData: TransportistData) => {
    if (!load) return

    setGeneratingPDF(true)
    
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 20
      let yPosition = margin

      // Función auxiliar para agregar texto centrado
      const addCenteredText = (text: string, fontSize: number = 12, y: number) => {
        doc.setFontSize(fontSize)
        const textWidth = doc.getTextWidth(text)
        const x = (pageWidth - textWidth) / 2
        doc.text(text, x, y)
      }

      // Función auxiliar para agregar texto con label en columna específica
      const addFieldInColumn = (label: string, value: string, y: number, x: number, columnWidth: number, labelWidth: number = 60) => {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text(`${label}:`, x, y)
        doc.setFont('helvetica', 'normal')
        const maxWidth = columnWidth - labelWidth - 5
        const lines = doc.splitTextToSize(value, maxWidth)
        doc.text(lines, x + labelWidth, y)
        
        // Calcular altura real basada en el número de líneas
        const lineHeight = 6
        return Array.isArray(lines) ? lines.length * lineHeight : lineHeight
      }

      // Función para agregar sección con borde en columna específica
      const addSectionInColumn = (title: string, contentCallback: (startY: number, x: number, width: number) => number, startY: number, x: number, width: number) => {
        const sectionStartY = startY
        
        // Título de sección
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(59, 130, 246)
        doc.text(title, x, startY)
        startY += 10
        
        // Calcular altura del contenido
        const contentHeight = contentCallback(startY, x, width)
        
        // Borde de sección
        doc.setDrawColor(220, 220, 220)
        doc.setLineWidth(0.5)
        const sectionHeight = contentHeight + 15
        doc.rect(x - 2, sectionStartY - 5, width + 4, sectionHeight)
        
        return startY + contentHeight + 10
      }

      // Obtener dirección del proveedor antes de generar el PDF
      let providerAddress = ''
      try {
        const providerResponse = await fetch(`/api/providers/${load.providerId}`)
        if (providerResponse.ok) {
          const providerData = await providerResponse.json()
          const addressParts = [providerData.street, providerData.number, providerData.locality].filter(Boolean)
          if (addressParts.length > 0) {
            providerAddress = addressParts.join(' ')
          }
        }
      } catch (error) {
        console.error('Error fetching provider address:', error)
      }

      // PRIMERA FILA: Título principal centrado
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(31, 41, 55)
      addCenteredText('REMITO DE CARGA', 20, yPosition)
      yPosition += 15

      // SEGUNDA FILA: Subtítulo centrado
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(107, 114, 128)
      addCenteredText('Documento oficial de entrega de mercadería', 12, yPosition)
      yPosition += 20

      // TERCERA FILA: Encabezado de dos columnas
      const leftColumnX = margin
      const rightColumnX = pageWidth / 2 + 10
      const columnWidth = (pageWidth / 2) - margin - 10

      // Columna izquierda: Logo + MailAmericas
      let leftColumnHeight = 0
      try {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.src = '/images/logo.png'
        
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = () => resolve(null)
        })
        
        if (img.complete && img.naturalWidth > 0) {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          ctx?.drawImage(img, 0, 0)
          const logoData = canvas.toDataURL('image/png')
          
          const logoWidth = 25
          const logoHeight = (img.naturalHeight / img.naturalWidth) * logoWidth
          doc.addImage(logoData, 'PNG', leftColumnX, yPosition, logoWidth, logoHeight)
          
          // MailAmericas debajo del logo
          doc.setFontSize(10)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(31, 41, 55)
          doc.text('MailAmericas', leftColumnX, yPosition + logoHeight + 8)
          
          leftColumnHeight = logoHeight + 15
        } else {
          // Si no hay logo, solo MailAmericas
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(31, 41, 55)
          doc.text('MailAmericas', leftColumnX, yPosition + 10)
          leftColumnHeight = 20
        }
      } catch (error) {
        console.error('Error loading logo:', error)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(31, 41, 55)
        doc.text('MailAmericas', leftColumnX, yPosition + 10)
        leftColumnHeight = 20
      }

      // Columna derecha: Datos del remito
      const remitoNumber = `REM-${load.id.slice(-8).toUpperCase()}`
      const currentDate = new Date()
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text(`N° ${remitoNumber}`, rightColumnX, yPosition)
      doc.setFont('helvetica', 'normal')
      doc.text(`Fecha: ${currentDate.toLocaleDateString('es-AR')}`, rightColumnX, yPosition + 6)
      doc.text(`Hora: ${currentDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`, rightColumnX, yPosition + 12)
      
      const rightColumnHeight = 18
      yPosition += Math.max(leftColumnHeight, rightColumnHeight) + 15

      // SECCIONES EN DOS COLUMNAS: Datos del Proveedor y Datos del Transporte
      const sectionY = yPosition
      
      // Columna izquierda: Datos del Proveedor
      let leftSectionHeight = addSectionInColumn('DATOS DEL PROVEEDOR', (startY, x, width) => {
        let currentY = startY
        doc.setFontSize(10)
        doc.setTextColor(0, 0, 0)
        
        const nameHeight = addFieldInColumn('Razón Social', load.provider.name, currentY, x, width)
        currentY += nameHeight + 5
        
        if (providerAddress) {
          const addressHeight = addFieldInColumn('Domicilio', providerAddress, currentY, x, width)
          currentY += addressHeight + 5
        }
        
        return currentY - startY
      }, sectionY, leftColumnX, columnWidth)

      // Columna derecha: Datos del Transporte
      let rightSectionHeight = addSectionInColumn('DATOS DEL TRANSPORTE', (startY, x, width) => {
        let currentY = startY
        doc.setFontSize(10)
        doc.setTextColor(0, 0, 0)
        
        const vehicleHeight = addFieldInColumn('Vehículo', load.truck.licensePlate, currentY, x, width)
        currentY += vehicleHeight + 5
        
        const transportistFullName = `${transportistData.name} ${transportistData.lastName}`
        const transportistHeight = addFieldInColumn('Transportista', transportistFullName, currentY, x, width)
        currentY += transportistHeight + 5
        
        const dniHeight = addFieldInColumn('DNI Transportista', transportistData.dni, currentY, x, width)
        currentY += dniHeight + 5
        
        const dateHeight = addFieldInColumn('Fecha/Hora Salida', currentDate.toLocaleString('es-AR'), currentY, x, width)
        currentY += dateHeight + 5
        
        return currentY - startY
      }, sectionY, rightColumnX, columnWidth)

      yPosition += Math.max(leftSectionHeight, rightSectionHeight) + 10

      // SECCIÓN COMPLETA: Detalles de la Mercadería
      yPosition = addSectionInColumn('DETALLES DE LA MERCADERÍA', (startY, x, width) => {
        let currentY = startY
        doc.setFontSize(10)
        doc.setTextColor(0, 0, 0)
        
        if (quantity) {
          const quantityHeight = addFieldInColumn('Cantidad', quantity, currentY, x, width)
          currentY += quantityHeight + 5
        }
        
        if (container) {
          const containers = container.split(/\s+/).filter(c => c.trim())
          if (containers.length > 0) {
            const containerText = containers.length === 1 ? containers[0] : containers.join(', ')
            const label = containers.length === 1 ? 'Contenedora' : 'Contenedoras'
            const containerHeight = addFieldInColumn(label, containerText, currentY, x, width)
            currentY += containerHeight + 5
          }
        }
        
        if (precinto) {
          const precintos = precinto.split(/\s+/).filter(p => p.trim())
          if (precintos.length > 0) {
            const precintoText = precintos.length === 1 ? precintos[0] : precintos.join(', ')
            const label = precintos.length === 1 ? 'Precinto' : 'Precintos'
            const precintoHeight = addFieldInColumn(label, precintoText, currentY, x, width)
            currentY += precintoHeight + 5
          }
        }
        
        return currentY - startY
      }, yPosition, margin, pageWidth - 2 * margin)

      // Espacio antes de firmas
      yPosition += 10

      // Sección de firmas
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(31, 41, 55)
      doc.text('FIRMAS Y CONFORMIDAD', margin, yPosition)
      yPosition += 20

      // Firma del transportista
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      doc.text('Transportista:', margin, yPosition)
      doc.setLineWidth(0.5)
      doc.line(margin + 40, yPosition + 2, margin + 120, yPosition + 2)
      doc.text('Fecha:', margin + 130, yPosition)
      doc.line(margin + 150, yPosition + 2, margin + 180, yPosition + 2)
      yPosition += 25

      // Firma del receptor
      doc.text('Receptor:', margin, yPosition)
      doc.line(margin + 30, yPosition + 2, margin + 110, yPosition + 2)
      doc.text('Fecha:', margin + 130, yPosition)
      doc.line(margin + 150, yPosition + 2, margin + 180, yPosition + 2)
      yPosition += 25

      // Observaciones
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Observaciones:', margin, yPosition)
      yPosition += 10
      
      // Línea para observaciones
      doc.setLineWidth(0.3)
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 25)
      yPosition += 35

      // Pie de página
      const footerY = pageHeight - 30
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(107, 114, 128)
      
      // Línea separadora del footer
      doc.setDrawColor(220, 220, 220)
      doc.setLineWidth(0.3)
      doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5)
      
      addCenteredText('Sistema de Gestión de Cargas - Mail Americas', 8, footerY)
      addCenteredText(`Remito generado automáticamente el ${currentDate.toLocaleString('es-AR')}`, 8, footerY + 4)
      addCenteredText('Documento válido para fines administrativos y legales', 8, footerY + 8)

      // Descargar el PDF
      doc.save(`remito-${remitoNumber}.pdf`)

    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error al generar el PDF del remito')
    } finally {
      setGeneratingPDF(false)
    }
  }

  const handleRemitoConfirmation = async (generateRemito: boolean) => {
    setShowRemitoConfirmation(false)
    
    if (generateRemito) {
      // Si quiere generar remito, mostrar modal del transportista
      setShowTransportistModal(true)
    } else {
      // Si no quiere generar remito, solo marcar la salida inmediatamente
      try {
        const now = new Date().toISOString()
        setDepartureTime(now)
        setDepartureChecked(true)
        
        // Guardar inmediatamente en la base de datos
        const response = await fetch(`/api/loads/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            providerId: selectedProvider,
            truckId: load?.truckId,
            arrivalTime,
            departureTime: now,
            quantity: quantity || null,
            container: container || null,
            precinto: precinto || null
          })
        })
        
        if (!response.ok) {
          const data = await response.json()
          alert(`Error al marcar salida: ${data.error || 'Error desconocido'}`)
          // Revertir cambios en caso de error
          setDepartureTime(null)
          setDepartureChecked(false)
        }
      } catch (error) {
        alert('Error de conexión al marcar salida')
        // Revertir cambios en caso de error
        setDepartureTime(null)
        setDepartureChecked(false)
      }
    }
  }

  const handleConfirmDeparture = async () => {
    if (!transportistName.trim() || !transportistLastName.trim() || !transportistDNI.trim()) {
      alert('Por favor complete todos los datos del transportista')
      return
    }

    // Marcar la salida
    const now = new Date().toISOString()
    setDepartureTime(now)
    setDepartureChecked(true)
    setShowTransportistModal(false)

    // Generar el PDF
    await generateRemitoPDF({
      name: transportistName.trim(),
      lastName: transportistLastName.trim(),
      dni: transportistDNI.trim()
    })

    // Limpiar campos del modal
    setTransportistName('')
    setTransportistLastName('')
    setTransportistDNI('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Find truck by license plate
      let truck = trucks.find(t => t.licensePlate === selectedTruck)
      
      // Los admins y operarios pueden crear trucks nuevos
      if (!truck && (session?.user?.role === 'admin' || session?.user?.role === 'operario')) {
        // Create new truck
        const createResponse = await fetch('/api/trucks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            licensePlate: selectedTruck
          })
        })
        if (createResponse.ok) {
          const newTruck = await createResponse.json() as Truck
          truck = newTruck
          setTrucks([...trucks, newTruck])
        } else {
          throw new Error('Error creating truck')
        }
      } else if (!truck) {
        // Los usuarios regulares no pueden crear trucks nuevos
        setError('El camión debe existir en el sistema. Solicita a un administrador que lo cree.')
        setLoading(false)
        return
      }

      if (!truck) {
        throw new Error('Truck not found')
      }

      const response = await fetch(`/api/loads/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          providerId: selectedProvider,
          truckId: truck.id,
          arrivalTime,
          departureTime,
          quantity: quantity || null,
          container: container || null,
          precinto: precinto || null
        })
      })

      if (response.ok) {
        router.push('/loads')
      } else {
        const data = await response.json()
        setError(data.error || 'Error al actualizar carga')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || fetchLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </AppLayout>
    )
  }

  if (!session || (session.user.role !== 'admin' && session.user.role !== 'operario')) {
    return null
  }

  if (error && !load) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
          <a href="/loads" className="text-indigo-600 hover:text-indigo-900 mt-4 inline-block">
            ← Volver a Cargas
          </a>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Editar Carga</h1>
          <p className="mt-2 text-sm text-gray-700">
            Modifica los datos de la carga.
          </p>
        </div>
        <div className="max-w-md mx-auto sm:max-w-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-2">
                Proveedor
              </label>
              <select
                id="provider"
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10 px-3 text-gray-900"
              >
                <option value="">Seleccionar proveedor</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="truck" className="block text-sm font-medium text-gray-700 mb-2">
                Camión (Patente)
              </label>
              <input
                id="truck"
                type="text"
                value={selectedTruck}
                onChange={(e) => setSelectedTruck(e.target.value)}
                list="truck-list"
                placeholder="Escribe o selecciona patente"
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10 px-3 text-gray-900"
              />
              <datalist id="truck-list">
                {trucks.map((truck) => (
                  <option key={truck.id} value={truck.licensePlate} />
                ))}
              </datalist>
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad
              </label>
              <input
                id="quantity"
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Ej: 1000 kg, 50 unidades"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10 px-3 text-gray-900"
              />
            </div>

            <div>
              <label htmlFor="container" className="block text-sm font-medium text-gray-700 mb-2">
                Contenedora
              </label>
              <input
                id="container"
                type="text"
                value={container}
                onChange={(e) => setContainer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    setContainer(container + ' ')
                  }
                }}
                placeholder="Ej: ABC123, CONT-456"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10 px-3 text-gray-900"
              />
            </div>

            <div>
              <label htmlFor="precinto" className="block text-sm font-medium text-gray-700 mb-2">
                Precinto
              </label>
              <input
                id="precinto"
                type="text"
                value={precinto}
                onChange={(e) => setPrecinto(e.target.value)}
                placeholder="Ej: PREC-123"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10 px-3 text-gray-900"
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Horario de Llegada
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={arrivalChecked}
                    onChange={handleArrivalCheck}
                    className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-900 font-medium">
                    Marcar llegada
                  </span>
                </div>
                {arrivalTime && (
                  <p className="mt-2 text-sm text-gray-500 ml-8">
                    {new Date(arrivalTime).toLocaleString()}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Horario de Salida
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={departureChecked}
                    onChange={handleDepartureCheck}
                    className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-900 font-medium">
                    Marcar salida
                  </span>
                </div>
                {departureTime && (
                  <p className="mt-2 text-sm text-gray-500 ml-8">
                    {new Date(departureTime).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {duration !== null && (
              <div className="bg-gray-50 p-4 rounded-md">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiempo Total (minutos)
                </label>
                <p className="text-lg font-semibold text-gray-900">{duration} minutos</p>
              </div>
            )}

            {error && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 h-12"
              >
                {loading ? 'Actualizando...' : 'Actualizar Carga'}
              </button>
              <a
                href="/loads"
                className="flex-1 flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 h-12 items-center"
              >
                Cancelar
              </a>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de Confirmación de Remito */}
      {showRemitoConfirmation && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

            <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="w-full">
                <div className="mt-3 text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                    Confirmar Salida de Carga
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-6">
                    ¿Desea generar un remito en PDF para esta carga? El remito incluirá todos los detalles de la mercadería y será válido para fines administrativos y legales.
                  </p>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                      onClick={() => handleRemitoConfirmation(false)}
                    >
                      Solo Marcar Salida
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                      onClick={() => handleRemitoConfirmation(true)}
                    >
                      Generar Remito
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal del Transportista */}
      {showTransportistModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

            <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="w-full">
                <div className="mt-3 text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                    Datos del Transportista
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-6">
                    Complete los datos del transportista que llevará la carga. Se generará automáticamente un remito en PDF.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="transportist-name" className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre
                      </label>
                      <input
                        type="text"
                        id="transportist-name"
                        value={transportistName}
                        onChange={(e) => setTransportistName(e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10 px-3 text-gray-900"
                        placeholder="Ingrese el nombre"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="transportist-lastname" className="block text-sm font-medium text-gray-700 mb-2">
                        Apellido
                      </label>
                      <input
                        type="text"
                        id="transportist-lastname"
                        value={transportistLastName}
                        onChange={(e) => setTransportistLastName(e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10 px-3 text-gray-900"
                        placeholder="Ingrese el apellido"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="transportist-dni" className="block text-sm font-medium text-gray-700 mb-2">
                        DNI
                      </label>
                      <input
                        type="text"
                        id="transportist-dni"
                        value={transportistDNI}
                        onChange={(e) => setTransportistDNI(e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10 px-3 text-gray-900"
                        placeholder="Ingrese el DNI"
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                      onClick={() => setShowTransportistModal(false)}
                      disabled={generatingPDF}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm disabled:opacity-50"
                      onClick={handleConfirmDeparture}
                      disabled={generatingPDF || !transportistName.trim() || !transportistLastName.trim() || !transportistDNI.trim()}
                    >
                      {generatingPDF ? 'Generando Remito...' : 'Confirmar Salida y Generar Remito'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}