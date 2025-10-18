/**
 * Utilidades para manejar fechas con zona horaria de Argentina
 */

const ARGENTINA_TIMEZONE = 'America/Argentina/Buenos_Aires'

/**
 * Obtiene la fecha actual en zona horaria de Argentina
 */
export function getArgentinaDate(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: ARGENTINA_TIMEZONE }))
}

/**
 * Convierte una fecha a zona horaria de Argentina
 */
export function toArgentinaDate(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Date(d.toLocaleString('en-US', { timeZone: ARGENTINA_TIMEZONE }))
}

/**
 * Formatea una fecha para mostrar en formato corto (DD/MM/YYYY)
 */
export function formatArgentinaDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-AR', {
    timeZone: ARGENTINA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

/**
 * Formatea una fecha para mostrar en formato largo
 */
export function formatArgentinaDateLong(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-AR', {
    timeZone: ARGENTINA_TIMEZONE,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Formatea una fecha para mostrar hora
 */
export function formatArgentinaTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('es-AR', {
    timeZone: ARGENTINA_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Formatea una fecha para mostrar fecha y hora
 */
export function formatArgentinaDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('es-AR', {
    timeZone: ARGENTINA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Obtiene la fecha en formato YYYY-MM-DD para input date
 */
export function getArgentinaDateForInput(): string {
  const date = getArgentinaDate()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Convierte una fecha a formato YYYY-MM-DD para comparaciones
 */
export function toDateString(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const argDate = toArgentinaDate(d)
  const year = argDate.getFullYear()
  const month = String(argDate.getMonth() + 1).padStart(2, '0')
  const day = String(argDate.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
