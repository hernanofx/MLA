'use client'

import { useState } from 'react'
import AppLayout from '@/app/components/AppLayout'
import { LayoutDashboard, Building2, Truck, ClipboardList, Package, Warehouse, BarChart3, HelpCircle, Bell, Users, Plus, Search, Edit, Settings, CheckCircle, XCircle, Filter, UserPlus, Shield, Trash2, TrendingUp, FileText, Download, Calendar } from 'lucide-react'

const modules = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, description: 'Vista general del sistema y estadísticas principales' },
  { id: 'providers', name: 'Proveedores', icon: Building2, description: 'Gestión de proveedores y sus contactos' },
  { id: 'trucks', name: 'Camiones', icon: Truck, description: 'Administración de flota de camiones' },
  { id: 'entries', name: 'Entradas/Salidas', icon: ClipboardList, description: 'Registro de entradas y salidas de mercancías' },
  { id: 'loads', name: 'Cargas/Descargas', icon: Package, description: 'Gestión de cargas y descargas' },
  { id: 'stocks', name: 'Stock', icon: Warehouse, description: 'Control de inventario y almacenes' },
  { id: 'reports', name: 'Reportes', icon: BarChart3, description: 'Generación de reportes y estadísticas' },
  { id: 'notifications', name: 'Notificaciones', icon: Bell, description: 'Gestión de notificaciones y preferencias' },
  { id: 'users', name: 'Usuarios', icon: Users, description: 'Administración de usuarios del sistema' },
]

const moduleContent = {
  dashboard: {
    title: "Ayuda - Dashboard",
    content: (
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">¿Qué puedes hacer en el Dashboard?</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start">
                <BarChart3 className="h-6 w-6 text-green-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Ver Estadísticas</h3>
                  <p className="text-gray-600">Monitorea métricas clave como número de camiones activos, cargas pendientes y rendimiento general.</p>
                </div>
              </div>
              <div className="flex items-start">
                <Truck className="h-6 w-6 text-blue-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Estado de Flota</h3>
                  <p className="text-gray-600">Revisa el estado actual de todos los camiones registrados en el sistema.</p>
                </div>
              </div>
              <div className="flex items-start">
                <Package className="h-6 w-6 text-purple-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Cargas Recientes</h3>
                  <p className="text-gray-600">Visualiza las últimas cargas procesadas y su estado actual.</p>
                </div>
              </div>
              <div className="flex items-start">
                <Bell className="h-6 w-6 text-red-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Alertas y Notificaciones</h3>
                  <p className="text-gray-600">Recibe alertas sobre problemas críticos o eventos importantes.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cómo navegar el Dashboard</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <ol className="list-decimal list-inside space-y-4 text-gray-700">
              <li>
                <strong>Accede al Dashboard:</strong> Desde el menú lateral, haz clic en "Dashboard" o accede directamente a la URL principal del sistema.
              </li>
              <li>
                <strong>Revisa las tarjetas de estadísticas:</strong> En la parte superior, encontrarás tarjetas con métricas clave como total de camiones, cargas activas, etc.
              </li>
              <li>
                <strong>Explora los gráficos:</strong> Los gráficos muestran tendencias y distribuciones importantes para tu operación.
              </li>
              <li>
                <strong>Revisa listas recientes:</strong> Al final de la página, encontrarás listas de actividades recientes como cargas nuevas o camiones actualizados.
              </li>
              <li>
                <strong>Utiliza los filtros:</strong> Si están disponibles, usa los filtros para personalizar la vista según fechas o categorías específicas.
              </li>
            </ol>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Consejos útiles</h2>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Actualización automática:</strong> El Dashboard se actualiza automáticamente para mostrar la información más reciente.
              </p>
            </div>
          </div>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Permisos:</strong> Algunos datos pueden estar restringidos según tu rol de usuario. Contacta al administrador si necesitas acceso adicional.
              </p>
            </div>
          </div>
        </section>
      </div>
    )
  },
  providers: {
    title: "Ayuda - Proveedores",
    content: (
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Funcionalidades principales</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start">
                <Plus className="h-6 w-6 text-green-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Crear Proveedor</h3>
                  <p className="text-gray-600">Registra nuevos proveedores con toda su información de contacto.</p>
                </div>
              </div>
              <div className="flex items-start">
                <Search className="h-6 w-6 text-blue-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Buscar y Filtrar</h3>
                  <p className="text-gray-600">Encuentra proveedores por nombre usando la paginación.</p>
                </div>
              </div>
              <div className="flex items-start">
                <Edit className="h-6 w-6 text-purple-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Editar Información</h3>
                  <p className="text-gray-600">Modifica datos de proveedores existentes.</p>
                </div>
              </div>
              <div className="flex items-start">
                <Users className="h-6 w-6 text-orange-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Gestionar Contactos</h3>
                  <p className="text-gray-600">Agrega y administra múltiples contactos por proveedor.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cómo gestionar proveedores</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <ol className="list-decimal list-inside space-y-4 text-gray-700">
              <li>
                <strong>Accede al módulo:</strong> Desde el menú lateral, haz clic en "Proveedores".
              </li>
              <li>
                <strong>Crear un nuevo proveedor:</strong> Haz clic en "Nuevo Proveedor" y completa el formulario con nombre, dirección, teléfono, email, etc.
              </li>
              <li>
                <strong>Agregar contactos:</strong> Dentro del detalle del proveedor, usa la sección de contactos para agregar teléfonos y emails adicionales.
              </li>
              <li>
                <strong>Buscar proveedores:</strong> Usa la paginación para navegar por la lista de proveedores.
              </li>
              <li>
                <strong>Editar información:</strong> Haz clic en el botón de editar (lápiz) en cualquier proveedor para modificar sus datos.
              </li>
              <li>
                <strong>Asignar responsable:</strong> Los administradores pueden asignar un usuario responsable a cada proveedor.
              </li>
              <li>
                <strong>Eliminar proveedor:</strong> Solo si no tiene cargas asociadas, puedes eliminar un proveedor desde el menú de acciones.
              </li>
            </ol>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Campos importantes</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <ul className="space-y-3 text-gray-700">
              <li><strong>Nombre:</strong> Nombre completo del proveedor o empresa.</li>
              <li><strong>Código:</strong> Identificador único para referencias internas.</li>
              <li><strong>Dirección:</strong> Ubicación física del proveedor.</li>
              <li><strong>Teléfono principal:</strong> Número de contacto principal.</li>
              <li><strong>Email:</strong> Dirección de correo electrónico para comunicaciones.</li>
              <li><strong>Tipo:</strong> Clasificación del proveedor (transporte, almacenamiento, etc.).</li>
              <li><strong>Responsable:</strong> Usuario asignado para gestionar este proveedor.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Consejos útiles</h2>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Contactos múltiples:</strong> Puedes agregar varios contactos por proveedor para diferentes departamentos o personas.
              </p>
            </div>
          </div>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Validación:</strong> Asegúrate de que los emails y teléfonos sean correctos para evitar problemas de comunicación.
              </p>
            </div>
          </div>
        </section>
      </div>
    )
  },
  trucks: {
    title: "Ayuda - Camiones",
    content: (
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Funcionalidades principales</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start">
                <Plus className="h-6 w-6 text-green-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Registrar Camión</h3>
                  <p className="text-gray-600">Agrega nuevos camiones a tu flota con toda su información técnica.</p>
                </div>
              </div>
              <div className="flex items-start">
                <Search className="h-6 w-6 text-blue-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Buscar Camiones</h3>
                  <p className="text-gray-600">Encuentra camiones por placa usando la paginación.</p>
                </div>
              </div>
              <div className="flex items-start">
                <Edit className="h-6 w-6 text-purple-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Editar Información</h3>
                  <p className="text-gray-600">Actualiza datos técnicos y estado de camiones existentes.</p>
                </div>
              </div>
              <div className="flex items-start">
                <Trash2 className="h-6 w-6 text-red-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Eliminar Camión</h3>
                  <p className="text-gray-600">Remueve camiones que ya no forman parte de la flota.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cómo gestionar camiones</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <ol className="list-decimal list-inside space-y-4 text-gray-700">
              <li>
                <strong>Accede al módulo:</strong> Desde el menú lateral, haz clic en "Camiones".
              </li>
              <li>
                <strong>Registrar un nuevo camión:</strong> Haz clic en "Nuevo Camión" y completa los campos requeridos como placa, modelo, capacidad, etc.
              </li>
              <li>
                <strong>Configurar características:</strong> Especifica el tipo de camión, capacidad de carga, dimensiones y características especiales.
              </li>
              <li>
                <strong>Buscar camiones:</strong> Usa la paginación para navegar por la lista de camiones registrados.
              </li>
              <li>
                <strong>Editar información:</strong> Haz clic en el botón de editar para modificar datos del camión.
              </li>
              <li>
                <strong>Eliminar camión:</strong> Usa el menú de acciones para eliminar camiones que ya no están en servicio.
              </li>
            </ol>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Campos importantes</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <ul className="space-y-3 text-gray-700">
              <li><strong>Placa:</strong> Identificación única del vehículo.</li>
              <li><strong>Modelo/Marca:</strong> Información del fabricante y modelo.</li>
              <li><strong>Capacidad:</strong> Capacidad máxima de carga en toneladas.</li>
              <li><strong>Tipo:</strong> Clasificación del camión (camión, trailer, etc.).</li>
              <li><strong>Estado:</strong> Condición actual (activo, mantenimiento, fuera de servicio).</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Consejos útiles</h2>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Mantenimiento:</strong> Registra fechas de mantenimiento para evitar problemas mecánicos.
              </p>
            </div>
          </div>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Documentación:</strong> Mantén actualizada la documentación legal del vehículo (seguros, permisos, etc.).
              </p>
            </div>
          </div>
        </section>
      </div>
    )
  },
  entries: {
    title: "Ayuda - Entradas/Salidas",
    content: (
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Funcionalidades principales</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start">
                <Plus className="h-6 w-6 text-green-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Nueva Entrada/Salida</h3>
                  <p className="text-gray-600">Registra movimientos de mercancías con detalles completos.</p>
                </div>
              </div>
              <div className="flex items-start">
                <Search className="h-6 w-6 text-blue-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Buscar Registros</h3>
                  <p className="text-gray-600">Encuentra entradas y salidas por fecha usando filtros.</p>
                </div>
              </div>
              <div className="flex items-start">
                <Edit className="h-6 w-6 text-purple-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Editar Registros</h3>
                  <p className="text-gray-600">Modifica información de movimientos existentes.</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Confirmar Movimientos</h3>
                  <p className="text-gray-600">Valida y confirma entradas y salidas completadas.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cómo registrar entradas y salidas</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <ol className="list-decimal list-inside space-y-4 text-gray-700">
              <li>
                <strong>Accede al módulo:</strong> Desde el menú lateral, haz clic en "Entradas/Salidas".
              </li>
              <li>
                <strong>Crear nuevo registro:</strong> Haz clic en "Nueva Entrada" o "Nueva Salida" según corresponda.
              </li>
              <li>
                <strong>Seleccionar tipo:</strong> Elige si es entrada (recepción) o salida (envío).
              </li>
              <li>
                <strong>Completar información básica:</strong> Ingresa fecha, hora, ubicación y responsable del movimiento.
              </li>
              <li>
                <strong>Agregar productos:</strong> Selecciona los productos y cantidades involucradas en el movimiento.
              </li>
              <li>
                <strong>Especificar origen/destino:</strong> Indica de dónde viene o hacia dónde va la mercancía.
              </li>
              <li>
                <strong>Confirmar registro:</strong> Revisa la información y confirma para guardar el movimiento.
              </li>
            </ol>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Campos importantes</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <ul className="space-y-3 text-gray-700">
              <li><strong>Tipo:</strong> Entrada o Salida.</li>
              <li><strong>Fecha/Hora:</strong> Momento exacto del movimiento.</li>
              <li><strong>Ubicación:</strong> Almacén o punto donde ocurre el movimiento.</li>
              <li><strong>Productos:</strong> Lista de items con cantidades y descripciones.</li>
              <li><strong>Origen/Destino:</strong> Procedencia o destino de la mercancía.</li>
              <li><strong>Responsable:</strong> Persona que registra o autoriza el movimiento.</li>
              <li><strong>Estado:</strong> Pendiente, Confirmado, Cancelado.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Consejos útiles</h2>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Precisión en cantidades:</strong> Verifica las cantidades antes de confirmar para mantener el inventario actualizado.
              </p>
            </div>
          </div>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Documentación:</strong> Adjunta documentos de respaldo como facturas o órdenes de compra cuando sea necesario.
              </p>
            </div>
          </div>
        </section>
      </div>
    )
  },
  loads: {
    title: "Ayuda - Cargas/Descargas",
    content: (
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Funcionalidades principales</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start">
                <Plus className="h-6 w-6 text-green-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Crear Nueva Carga</h3>
                  <p className="text-gray-600">Programa y asigna nuevas cargas a camiones disponibles.</p>
                </div>
              </div>
              <div className="flex items-start">
                <Search className="h-6 w-6 text-blue-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Buscar Cargas</h3>
                  <p className="text-gray-600">Encuentra cargas por estado usando filtros.</p>
                </div>
              </div>
              <div className="flex items-start">
                <Truck className="h-6 w-6 text-purple-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Asignar Camiones</h3>
                  <p className="text-gray-600">Vincula cargas a camiones específicos y conductores.</p>
                </div>
              </div>
              <div className="flex items-start">
                <Edit className="h-6 w-6 text-orange-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Actualizar Estado</h3>
                  <p className="text-gray-600">Cambia el estado de las cargas según el progreso.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cómo gestionar cargas</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <ol className="list-decimal list-inside space-y-4 text-gray-700">
              <li>
                <strong>Accede al módulo:</strong> Desde el menú lateral, haz clic en "Cargas/Descargas".
              </li>
              <li>
                <strong>Crear nueva carga:</strong> Haz clic en "Nueva Carga" para iniciar el proceso.
              </li>
              <li>
                <strong>Definir detalles básicos:</strong> Ingresa origen, destino, fecha de carga y productos.
              </li>
              <li>
                <strong>Seleccionar camión:</strong> Elige un camión disponible con capacidad suficiente.
              </li>
              <li>
                <strong>Asignar conductor:</strong> Vincula un conductor calificado para la ruta.
              </li>
              <li>
                <strong>Especificar productos:</strong> Lista detallada de mercancías con pesos y volúmenes.
              </li>
              <li>
                <strong>Confirmar y programar:</strong> Revisa toda la información y confirma la carga.
              </li>
              <li>
                <strong>Actualizar estado:</strong> Cambia el estado según el progreso (cargando, en ruta, descargando, completada).
              </li>
            </ol>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Estados de carga</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <ul className="space-y-3 text-gray-700">
              <li><strong className="text-blue-600">● Programada:</strong> Carga creada pero no iniciada.</li>
              <li><strong className="text-yellow-600">● Cargando:</strong> En proceso de carga en origen.</li>
              <li><strong className="text-green-600">● En Ruta:</strong> Camión en tránsito hacia destino.</li>
              <li><strong className="text-purple-600">● Descargando:</strong> En proceso de descarga en destino.</li>
              <li><strong className="text-gray-600">● Completada:</strong> Carga entregada exitosamente.</li>
              <li><strong className="text-red-600">● Cancelada:</strong> Carga cancelada por algún motivo.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Consejos útiles</h2>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Optimización de rutas:</strong> Considera múltiples paradas y factores como tráfico y restricciones de horario.
              </p>
            </div>
          </div>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Capacidad del camión:</strong> Verifica que la carga no exceda el peso máximo permitido del vehículo.
              </p>
            </div>
          </div>
        </section>
      </div>
    )
  },
  stocks: {
    title: "Ayuda - Stock",
    content: (
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Funcionalidades principales</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start">
                <BarChart3 className="h-6 w-6 text-green-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Vista de Inventario</h3>
                  <p className="text-gray-600">Visualiza el stock actual por producto y ubicación.</p>
                </div>
              </div>
              <div className="flex items-start">
                <Search className="h-6 w-6 text-blue-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Buscar Productos</h3>
                  <p className="text-gray-600">Encuentra productos por nombre usando filtros.</p>
                </div>
              </div>
              <div className="flex items-start">
                <Edit className="h-6 w-6 text-purple-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Ajustes de Inventario</h3>
                  <p className="text-gray-600">Realiza ajustes manuales al stock cuando sea necesario.</p>
                </div>
              </div>
              <div className="flex items-start">
                <Warehouse className="h-6 w-6 text-orange-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Gestionar Almacenes</h3>
                  <p className="text-gray-600">Administra diferentes centros de almacenamiento.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cómo gestionar el inventario</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <ol className="list-decimal list-inside space-y-4 text-gray-700">
              <li>
                <strong>Accede al módulo:</strong> Desde el menú lateral, haz clic en "Stock".
              </li>
              <li>
                <strong>Explora las pestañas:</strong> Navega entre Inventario, Ubicaciones y Almacenes según necesites.
              </li>
              <li>
                <strong>Ver stock por producto:</strong> En la pestaña Inventario, revisa cantidades disponibles y reservadas.
              </li>
              <li>
                <strong>Filtrar por almacén:</strong> Usa los filtros para ver stock en almacenes específicos.
              </li>
              <li>
                <strong>Configurar alertas:</strong> Establece niveles mínimos de stock para recibir notificaciones.
              </li>
              <li>
                <strong>Realizar inventarios:</strong> Programa conteos físicos y registra discrepancias.
              </li>
              <li>
                <strong>Generar reportes:</strong> Exporta informes de stock para análisis o auditorías.
              </li>
            </ol>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Pestañas del módulo</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <Package className="h-5 w-5 mr-2 text-blue-600" />
                  Inventario
                </h3>
                <p className="text-gray-600 ml-7">Vista general de productos y sus cantidades en stock.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <Warehouse className="h-5 w-5 mr-2 text-green-600" />
                  Ubicaciones
                </h3>
                <p className="text-gray-600 ml-7">Gestión de espacios de almacenamiento y organización física.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
                  Almacenes
                </h3>
                <p className="text-gray-600 ml-7">Administración de diferentes centros de almacenamiento.</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Consejos útiles</h2>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Stock reservado:</strong> El sistema diferencia entre stock disponible y reservado para cargas programadas.
              </p>
            </div>
          </div>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Actualización automática:</strong> El stock se actualiza automáticamente con cada entrada o salida registrada.
              </p>
            </div>
          </div>
        </section>
      </div>
    )
  },
  reports: {
    title: "Ayuda - Reportes",
    content: (
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Tipos de reportes disponibles</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start">
                <TrendingUp className="h-6 w-6 text-green-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Rendimiento de Flota</h3>
                  <p className="text-gray-600">Análisis de eficiencia, kilometraje y costos por camión.</p>
                </div>
              </div>
              <div className="flex items-start">
                <FileText className="h-6 w-6 text-blue-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Reportes de Cargas</h3>
                  <p className="text-gray-600">Historial de entregas, tiempos de tránsito y volúmenes transportados.</p>
                </div>
              </div>
              <div className="flex items-start">
                <BarChart3 className="h-6 w-6 text-purple-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Análisis de Inventario</h3>
                  <p className="text-gray-600">Movimientos de stock, rotación de productos y niveles de inventario.</p>
                </div>
              </div>
              <div className="flex items-start">
                <Calendar className="h-6 w-6 text-orange-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Reportes Financieros</h3>
                  <p className="text-gray-600">Costos operativos, ingresos y análisis de rentabilidad.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cómo generar reportes</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <ol className="list-decimal list-inside space-y-4 text-gray-700">
              <li>
                <strong>Accede al módulo:</strong> Desde el menú lateral, haz clic en "Reportes".
              </li>
              <li>
                <strong>Selecciona tipo de reporte:</strong> Elige el reporte que necesitas de la lista disponible.
              </li>
              <li>
                <strong>Configura filtros:</strong> Ajusta el período de tiempo, ubicaciones o criterios específicos.
              </li>
              <li>
                <strong>Aplica filtros adicionales:</strong> Filtra por camión, conductor, producto o proveedor según el reporte.
              </li>
              <li>
                <strong>Previsualiza resultados:</strong> Revisa los datos antes de generar el reporte final.
              </li>
              <li>
                <strong>Exporta el reporte:</strong> Descarga en formato PDF, Excel o CSV según tus necesidades.
              </li>
              <li>
                <strong>Programa reportes automáticos:</strong> Configura envíos periódicos por email si está disponible.
              </li>
            </ol>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Filtros comunes</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <ul className="space-y-3 text-gray-700">
              <li><strong>Rango de fechas:</strong> Desde/Hasta para limitar el período analizado.</li>
              <li><strong>Ubicaciones:</strong> Filtrar por almacenes, rutas o destinos específicos.</li>
              <li><strong>Camiones:</strong> Analizar rendimiento de vehículos individuales o grupos.</li>
              <li><strong>Productos:</strong> Enfocarse en categorías o items específicos.</li>
              <li><strong>Estados:</strong> Incluir solo cargas completadas, pendientes, etc.</li>
              <li><strong>Proveedores:</strong> Analizar operaciones con proveedores específicos.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Formatos de exportación</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <FileText className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <h3 className="font-semibold">PDF</h3>
                <p className="text-sm text-gray-600">Para presentaciones y archivos imprimibles</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Download className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold">Excel</h3>
                <p className="text-sm text-gray-600">Para análisis detallado y manipulación de datos</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold">CSV</h3>
                <p className="text-sm text-gray-600">Para integración con otros sistemas</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Consejos útiles</h2>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Reportes programados:</strong> Configura reportes automáticos semanales o mensuales para seguimiento continuo.
              </p>
            </div>
          </div>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Datos históricos:</strong> Los reportes pueden incluir datos de hasta 2 años atrás, dependiendo de la configuración del sistema.
              </p>
            </div>
          </div>
        </section>
      </div>
    )
  },
  notifications: {
    title: "Ayuda - Notificaciones",
    content: (
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Funcionalidades principales</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start">
                <Bell className="h-6 w-6 text-green-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Ver Notificaciones</h3>
                  <p className="text-gray-600">Revisa todas las notificaciones recientes del sistema.</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-blue-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Marcar como Leídas</h3>
                  <p className="text-gray-600">Elimina notificaciones revisadas para mantener el inbox limpio.</p>
                </div>
              </div>
              <div className="flex items-start">
                <Settings className="h-6 w-6 text-purple-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Configurar Preferencias</h3>
                  <p className="text-gray-600">Personaliza qué tipos de eventos quieres recibir como notificaciones.</p>
                </div>
              </div>
              <div className="flex items-start">
                <Filter className="h-6 w-6 text-orange-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Filtrar por Tipo</h3>
                  <p className="text-gray-600">Las notificaciones se clasifican por tipo de evento.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cómo gestionar notificaciones</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <ol className="list-decimal list-inside space-y-4 text-gray-700">
              <li>
                <strong>Accede al módulo:</strong> Desde el menú lateral, haz clic en "Notificaciones" o desde el icono de campana.
              </li>
              <li>
                <strong>Ver notificaciones recientes:</strong> En la pestaña "Notificaciones", revisa los eventos más recientes.
              </li>
              <li>
                <strong>Marcar como leídas:</strong> Haz clic en "Marcar todas como leídas" para limpiar el listado.
              </li>
              <li>
                <strong>Configurar preferencias:</strong> Ve a la pestaña "Preferencias" para personalizar qué notificaciones recibir.
              </li>
              <li>
                <strong>Seleccionar tipos:</strong> Marca o desmarca los checkboxes según los eventos que te interesen.
              </li>
              <li>
                <strong>Guardar cambios:</strong> Haz clic en "Guardar Preferencias" para aplicar los cambios.
              </li>
            </ol>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Tipos de notificaciones</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <ul className="space-y-3 text-gray-700">
              <li><strong>🏢 Nuevos Proveedores:</strong> Cuando se registra un nuevo proveedor en el sistema.</li>
              <li><strong>🚛 Nuevos Camiones:</strong> Cuando se agrega un nuevo vehículo a la flota.</li>
              <li><strong>📥 Nuevas Entradas:</strong> Cuando se registra una entrada de mercancías.</li>
              <li><strong>📦 Nuevas Cargas:</strong> Cuando se crea una nueva carga o envío.</li>
              <li><strong>📋 Nuevos Registros de Inventario:</strong> Cuando se actualiza el inventario.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Consejos útiles</h2>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Notificaciones automáticas:</strong> El sistema genera notificaciones automáticamente cuando ocurren eventos importantes.
              </p>
            </div>
          </div>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Privacidad:</strong> Las preferencias de notificaciones son personales y se guardan por usuario.
              </p>
            </div>
          </div>
        </section>
      </div>
    )
  },
  users: {
    title: "Ayuda - Usuarios",
    content: (
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Funcionalidades principales</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start">
                <UserPlus className="h-6 w-6 text-green-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Crear Usuario</h3>
                  <p className="text-gray-600">Registra nuevos usuarios en el sistema con diferentes roles.</p>
                </div>
              </div>
              <div className="flex items-start">
                <Search className="h-6 w-6 text-blue-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Buscar Usuarios</h3>
                  <p className="text-gray-600">Encuentra usuarios por nombre o email usando filtros.</p>
                </div>
              </div>
              <div className="flex items-start">
                <Edit className="h-6 w-6 text-purple-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Editar Usuario</h3>
                  <p className="text-gray-600">Modifica información y roles de usuarios existentes.</p>
                </div>
              </div>
              <div className="flex items-start">
                <Shield className="h-6 w-6 text-orange-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Gestionar Roles</h3>
                  <p className="text-gray-600">Asigna permisos de administrador o usuario regular.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cómo gestionar usuarios</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <ol className="list-decimal list-inside space-y-4 text-gray-700">
              <li>
                <strong>Accede al módulo:</strong> Desde el menú lateral, haz clic en "Usuarios" (solo administradores).
              </li>
              <li>
                <strong>Ver lista de usuarios:</strong> Revisa todos los usuarios registrados con sus roles y fechas de creación.
              </li>
              <li>
                <strong>Crear nuevo usuario:</strong> Haz clic en "Nuevo Usuario" y completa el formulario con nombre, email y rol.
              </li>
              <li>
                <strong>Buscar usuarios:</strong> Usa la barra de búsqueda para encontrar usuarios por nombre o email.
              </li>
              <li>
                <strong>Filtrar por rol:</strong> Usa los filtros para ver solo administradores o usuarios regulares.
              </li>
              <li>
                <strong>Editar usuario:</strong> Haz clic en el botón de editar para cambiar nombre, email o rol.
              </li>
              <li>
                <strong>Eliminar usuario:</strong> Usa el menú de acciones para eliminar usuarios (con restricciones para administradores).
              </li>
            </ol>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Roles de usuario</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="space-y-4">
              <div className="flex items-start">
                <Shield className="h-6 w-6 text-red-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Administrador</h3>
                  <p className="text-gray-600">Acceso completo a todas las funciones, incluyendo gestión de usuarios, configuración del sistema y reportes avanzados.</p>
                </div>
              </div>
              <div className="flex items-start">
                <User className="h-6 w-6 text-blue-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Usuario Regular</h3>
                  <p className="text-gray-600">Acceso a funciones operativas como registro de cargas, gestión de inventario y reportes básicos.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Campos importantes</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <ul className="space-y-3 text-gray-700">
              <li><strong>Nombre:</strong> Nombre completo del usuario.</li>
              <li><strong>Email:</strong> Dirección de correo electrónico (usada para login).</li>
              <li><strong>Rol:</strong> Nivel de permisos (Administrador o Usuario).</li>
              <li><strong>Fecha de creación:</strong> Cuando se registró el usuario en el sistema.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Consejos útiles</h2>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Último administrador:</strong> No se puede eliminar el último administrador del sistema.
              </p>
            </div>
          </div>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Emails únicos:</strong> Cada usuario debe tener un email único en el sistema.
              </p>
            </div>
          </div>
        </section>
      </div>
    )
  }
}

export default function HelpPage() {
  const [selectedModule, setSelectedModule] = useState<string>('dashboard')

  return (
    <AppLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <HelpCircle className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Centro de Ayuda</h1>
          </div>
          <p className="text-lg text-gray-600">
            Encuentra guías paso a paso para todas las funcionalidades del sistema de gestión de camiones.
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 mb-6">
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="flex min-w-max">
              {modules.map((module) => (
                <button
                  key={module.id}
                  onClick={() => setSelectedModule(module.id)}
                  className={`flex items-center px-4 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedModule === module.id
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <module.icon className="h-4 w-4 mr-2" />
                  {module.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">{moduleContent[selectedModule].title}</h2>
            </div>
            {moduleContent[selectedModule].content}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}