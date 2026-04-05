export function fmt(n: number): string {
  return 'S/ ' + Number(n).toLocaleString('es-PE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

export const MONTHS = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]

export function monthLabel(month: number, year: number): string {
  return `${MONTHS[month - 1]} ${year}`
}

export function relativeDate(dateStr: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(dateStr + 'T00:00:00')
  const diff = Math.floor((today.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Ayer'
  return `Hace ${diff} días`
}

const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

export function periodLabel(month: number, year: number, payday: number): string {
  if (payday === 1) return monthLabel(month, year)
  const startMonth = month === 1 ? 12 : month - 1
  const startYear  = month === 1 ? year - 1 : year
  return `${payday} ${MONTHS_SHORT[startMonth - 1]} – ${payday} ${MONTHS_SHORT[month - 1]} ${year}`
}

export function catEmoji(cat: string | undefined): string {
  const map: Record<string, string> = {
    'Alimentación': '🛒',
    'Transporte': '🚗',
    'Salud': '💊',
    'Entretenimiento': '🎬',
    'Vestimenta': '👕',
    'Mascotas': '🐾',
    'Educación': '📚',
    'Hogar': '🏠',
    'Deudas': '💰',
    'Viajes': '✈️',
    'Suscripciones': '📱',
  }
  return map[cat ?? ''] ?? '📦'
}
