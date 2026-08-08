import type { Rates } from '../types/calculator'

const money = (n: number) =>
  n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function fbs(n: number) {
  return `Bs\u00A0${money(n)}`
}

export function fusd(n: number) {
  return `$\u00A0${money(n)}`
}

export function feur(n: number) {
  return `€\u00A0${money(n)}`
}

export function rateLabel(n: number) {
  return n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatTimestamp(date: Date) {
  return `${date.toLocaleDateString('es-VE')} ${date.toLocaleTimeString('es-VE', {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

export function triParts(bs: number, rates: Rates) {
  return {
    bs: fbs(bs),
    usd: fusd(bs / rates.bcv),
    eur: feur(bs / rates.eur),
  }
}

export function marginBadge(m: number): { label: string; kind: 'ok' | 'md' | 'lo' } {
  if (m >= 35) return { label: 'Buena', kind: 'ok' }
  if (m >= 20) return { label: 'Ajustada', kind: 'md' }
  return { label: 'Baja', kind: 'lo' }
}
