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
      const margin = 15
      let yPosition = margin

      const remitoNumber = `REM-${load.id.slice(-8).toUpperCase()}`
      const currentDate = new Date()

      // Obtener dirección del proveedor
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

      // ============= ENCABEZADO PRINCIPAL =============
      // Borde superior decorativo
      doc.setDrawColor(34, 197, 94) // Verde profesional
      doc.setLineWidth(3)
      doc.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 8

      // Logo y datos de empresa en header
      const headerY = yPosition
      try {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.src = '/images/logo.png'
        
        await new Promise((resolve) => {
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
          
          const logoWidth = 35
          const logoHeight = (img.naturalHeight / img.naturalWidth) * logoWidth
          doc.addImage(logoData, 'PNG', margin, yPosition, logoWidth, logoHeight)
        }
      } catch (error) {
        console.error('Error loading logo:', error)
      }

      // Datos de la empresa
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(31, 41, 55)
      doc.text('MailAmericas', margin + 45, yPosition + 8)
      
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(75, 85, 99)
      doc.text('Servicios de Logística y Transporte', margin + 45, yPosition + 14)

      // Cuadro de información del remito (derecha)
      const boxX = pageWidth - margin - 65
      const boxY = yPosition
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.5)
      doc.rect(boxX, boxY, 65, 24)
      
      // Fondo gris claro para el encabezado del cuadro
      doc.setFillColor(249, 250, 251)
      doc.rect(boxX, boxY, 65, 8, 'F')
      
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(31, 41, 55)
      doc.text('REMITO DE CARGA', boxX + 32.5, boxY + 5, { align: 'center' })
      
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text(`N°:`, boxX + 3, boxY + 12)
      doc.setFont('helvetica', 'normal')
      doc.text(remitoNumber, boxX + 10, boxY + 12)
      
      doc.setFont('helvetica', 'bold')
      doc.text(`Fecha:`, boxX + 3, boxY + 17)
      doc.setFont('helvetica', 'normal')
      doc.text(currentDate.toLocaleDateString('es-AR'), boxX + 15, boxY + 17)
      
      doc.setFont('helvetica', 'bold')
      doc.text(`Hora:`, boxX + 3, boxY + 22)
      doc.setFont('helvetica', 'normal')
      doc.text(currentDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }), boxX + 13, boxY + 22)

      yPosition += 32

      // Línea separadora
      doc.setDrawColor(220, 220, 220)
      doc.setLineWidth(0.5)
      doc.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 8

      // ============= SECCIÓN DE DATOS (2 COLUMNAS) =============
      const col1X = margin
      const col2X = pageWidth / 2 + 5
      const colWidth = (pageWidth / 2) - margin - 5
      let col1Y = yPosition
      let col2Y = yPosition

      // Función para dibujar una sección con estilo
      const drawSection = (title: string, x: number, y: number, width: number, height: number) => {
        // Fondo del título
        doc.setFillColor(34, 197, 94)
        doc.rect(x, y, width, 7, 'F')
        
        // Título
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(255, 255, 255)
        doc.text(title, x + 3, y + 5)
        
        // Borde de la sección
        doc.setDrawColor(34, 197, 94)
        doc.setLineWidth(0.8)
        doc.rect(x, y, width, height)
        
        return y + 7
      }

      // COLUMNA 1: DATOS DEL PROVEEDOR
      const providerSectionHeight = 28
      let contentY = drawSection('DATOS DEL PROVEEDOR', col1X, col1Y, colWidth, providerSectionHeight)
      contentY += 5
      
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(31, 41, 55)
      doc.text('Razón Social:', col1X + 3, contentY)
      doc.setFont('helvetica', 'normal')
      const providerNameLines = doc.splitTextToSize(load.provider.name, colWidth - 35)
      doc.text(providerNameLines, col1X + 30, contentY)
      contentY += (providerNameLines.length * 4) + 3
      
      if (providerAddress) {
        doc.setFont('helvetica', 'bold')
        doc.text('Domicilio:', col1X + 3, contentY)
        doc.setFont('helvetica', 'normal')
        const addressLines = doc.splitTextToSize(providerAddress, colWidth - 30)
        doc.text(addressLines, col1X + 25, contentY)
      }

      col1Y += providerSectionHeight + 5

      // COLUMNA 2: DATOS DEL TRANSPORTE
      const transportSectionHeight = 38
      contentY = drawSection('DATOS DEL TRANSPORTE', col2X, col2Y, colWidth, transportSectionHeight)
      contentY += 5
      
      doc.setFont('helvetica', 'bold')
      doc.text('Vehículo:', col2X + 3, contentY)
      doc.setFont('helvetica', 'normal')
      doc.text(load.truck.licensePlate, col2X + 23, contentY)
      contentY += 5
      
      doc.setFont('helvetica', 'bold')
      doc.text('Transportista:', col2X + 3, contentY)
      doc.setFont('helvetica', 'normal')
      const transportistName = `${transportistData.name} ${transportistData.lastName}`
      const transportistLines = doc.splitTextToSize(transportistName, colWidth - 35)
      doc.text(transportistLines, col2X + 30, contentY)
      contentY += (transportistLines.length * 4) + 1
      
      doc.setFont('helvetica', 'bold')
      doc.text('DNI:', col2X + 3, contentY)
      doc.setFont('helvetica', 'normal')
      doc.text(transportistData.dni, col2X + 13, contentY)
      contentY += 5
      
      doc.setFont('helvetica', 'bold')
      doc.text('Salida:', col2X + 3, contentY)
      doc.setFont('helvetica', 'normal')
      doc.text(currentDate.toLocaleString('es-AR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      }), col2X + 17, contentY)

      col2Y += transportSectionHeight + 5

      // Ajustar yPosition al máximo de ambas columnas
      yPosition = Math.max(col1Y, col2Y)

      // ============= DETALLES DE LA MERCADERÍA (ANCHO COMPLETO) =============
      const mercSectionHeight = 30
      contentY = drawSection('DETALLES DE LA MERCADERÍA', margin, yPosition, pageWidth - 2 * margin, mercSectionHeight)
      contentY += 5

      let hasContent = false
      if (quantity) {
        doc.setFont('helvetica', 'bold')
        doc.text('Cantidad:', margin + 3, contentY)
        doc.setFont('helvetica', 'normal')
        doc.text(quantity, margin + 25, contentY)
        contentY += 5
        hasContent = true
      }
      
      if (container) {
        const containers = container.split(/\s+/).filter(c => c.trim())
        if (containers.length > 0) {
          const label = containers.length === 1 ? 'Contenedora:' : 'Contenedoras:'
          doc.setFont('helvetica', 'bold')
          doc.text(label, margin + 3, contentY)
          doc.setFont('helvetica', 'normal')
          const containerText = containers.join(', ')
          const containerLines = doc.splitTextToSize(containerText, pageWidth - 2 * margin - 35)
          doc.text(containerLines, margin + 30, contentY)
          contentY += (containerLines.length * 4) + 1
          hasContent = true
        }
      }
      
      if (precinto) {
        const precintos = precinto.split(/\s+/).filter(p => p.trim())
        if (precintos.length > 0) {
          const label = precintos.length === 1 ? 'Precinto:' : 'Precintos:'
          doc.setFont('helvetica', 'bold')
          doc.text(label, margin + 3, contentY)
          doc.setFont('helvetica', 'normal')
          const precintoText = precintos.join(', ')
          const precintoLines = doc.splitTextToSize(precintoText, pageWidth - 2 * margin - 30)
          doc.text(precintoLines, margin + 27, contentY)
          hasContent = true
        }
      }

      if (!hasContent) {
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(107, 114, 128)
        doc.text('No se especificaron detalles de mercadería', margin + 3, contentY)
      }

      yPosition += mercSectionHeight + 8

      // ============= OBSERVACIONES =============
      const obsSectionHeight = 25
      contentY = drawSection('OBSERVACIONES', margin, yPosition, pageWidth - 2 * margin, obsSectionHeight)
      
      // Líneas para escribir observaciones
      doc.setDrawColor(220, 220, 220)
      doc.setLineWidth(0.3)
      for (let i = 0; i < 4; i++) {
        const lineY = contentY + 5 + (i * 4.5)
        doc.line(margin + 2, lineY, pageWidth - margin - 2, lineY)
      }

      yPosition += obsSectionHeight + 8

      // ============= FIRMAS Y CONFORMIDAD =============
      const signatureY = yPosition
      
      // Título de sección
      doc.setFillColor(249, 250, 251)
      doc.rect(margin, signatureY, pageWidth - 2 * margin, 7, 'F')
      doc.setDrawColor(34, 197, 94)
      doc.setLineWidth(0.8)
      doc.rect(margin, signatureY, pageWidth - 2 * margin, 45)
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(34, 197, 94)
      doc.text('FIRMAS Y CONFORMIDAD', margin + 3, signatureY + 5)
      
      yPosition = signatureY + 12
      
      // Dos columnas de firmas
      const sig1X = margin + 10
      const sig2X = pageWidth / 2 + 10
      
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(31, 41, 55)
      
      // Firma del Transportista
      doc.text('TRANSPORTISTA', sig1X, yPosition)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.text(`${transportistData.name} ${transportistData.lastName}`, sig1X, yPosition + 4)
      doc.text(`DNI: ${transportistData.dni}`, sig1X, yPosition + 8)
      
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.5)
      doc.line(sig1X, yPosition + 20, sig1X + 65, yPosition + 20)
      doc.setFontSize(7)
      doc.setTextColor(107, 114, 128)
      doc.text('Firma', sig1X + 28, yPosition + 24)
      
      // Firma del Receptor
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(31, 41, 55)
      doc.text('RECEPTOR', sig2X, yPosition)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.text('Nombre y Apellido:', sig2X, yPosition + 4)
      doc.text('DNI:', sig2X, yPosition + 8)
      
      doc.setDrawColor(0, 0, 0)
      doc.line(sig2X, yPosition + 20, sig2X + 65, yPosition + 20)
      doc.setFontSize(7)
      doc.setTextColor(107, 114, 128)
      doc.text('Firma y Aclaración', sig2X + 20, yPosition + 24)

      yPosition += 38

      // ============= PIE DE PÁGINA =============
      const footerY = pageHeight - 25
      
      // Línea decorativa superior
      doc.setDrawColor(34, 197, 94)
      doc.setLineWidth(1)
      doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3)
      
      // Información del footer
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(75, 85, 99)
      
      const centerText = (text: string, y: number) => {
        const textWidth = doc.getTextWidth(text)
        const x = (pageWidth - textWidth) / 2
        doc.text(text, x, y)
      }
      
      centerText('MailAmericas - Sistema de Gestión de Cargas', footerY + 3)
      
      doc.setFontSize(7)
      doc.setTextColor(107, 114, 128)
      centerText(`Documento generado automáticamente el ${currentDate.toLocaleDateString('es-AR')} a las ${currentDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`, footerY + 7)
      centerText('Este documento es válido como comprobante de entrega y carga de mercadería', footerY + 11)

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