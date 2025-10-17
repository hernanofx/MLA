import { Session } from 'next-auth'

/**
 * Obtiene el providerId del usuario VMS autenticado
 * - Si es admin: retorna null (puede ver todos los proveedores)
 * - Si es vms: retorna su providerId asignado
 * - Si no tiene permisos: lanza error
 */
export async function getVMSProviderId(session: Session | null): Promise<string | null> {
  if (!session?.user) {
    throw new Error('No autorizado')
  }

  const userRole = session.user.role

  // Verificar que tenga rol VMS o admin
  if (userRole !== 'vms' && userRole !== 'admin') {
    throw new Error('No tienes permisos para acceder al módulo VMS')
  }

  // Admin puede ver todos los proveedores (retorna null)
  if (userRole === 'admin') {
    return null
  }

  // Usuario VMS debe tener providerId asignado
  if (!session.user.providerId) {
    throw new Error('Usuario VMS sin proveedor asignado. Contacta al administrador.')
  }

  return session.user.providerId
}

/**
 * Verifica que un shipment pertenezca al proveedor del usuario
 * Lanza error si no tiene acceso
 */
export function verifyProviderAccess(
  shipmentProviderId: string,
  userProviderId: string | null
): void {
  // Admin puede acceder a cualquier shipment
  if (userProviderId === null) {
    return
  }

  // Usuario VMS solo puede acceder a shipments de su proveedor
  if (shipmentProviderId !== userProviderId) {
    throw new Error('No tienes acceso a este envío')
  }
}
