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

function isoParts(iso: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return null
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) }
}

function toIsoLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Hoy / Ayer / "lun 19 ago" para historial de ventas. */
export function formatFriendlyDate(iso: string, ref = new Date()): string {
  const parts = isoParts(iso)
  if (!parts) return iso || '—'
  const today = toIsoLocal(ref)
  const yesterday = toIsoLocal(
    new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - 1),
  )
  if (iso === today) return 'Hoy'
  if (iso === yesterday) return 'Ayer'
  const d = new Date(parts.y, parts.m - 1, parts.d)
  return d.toLocaleDateString('es-VE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

/** "agosto de 2026" desde YYYY-MM o YYYY-MM-DD. */
export function formatMonthLong(yyyyMm: string): string {
  const m = /^(\d{4})-(\d{2})/.exec(yyyyMm)
  if (!m) return yyyyMm
  const d = new Date(Number(m[1]), Number(m[2]) - 1, 1)
  return d.toLocaleDateString('es-VE', { month: 'long', year: 'numeric' })
}

export function triParts(bs: number, rates: Rates) {
  return {
    bs: fbs(bs),
    usd: fusd(bs / rates.bcv),
    eur: feur(bs / rates.eur),
  }
}

