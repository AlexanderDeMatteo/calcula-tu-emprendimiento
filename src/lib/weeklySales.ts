import type {
  WeeklySaleLine,
  WeeklySales,
  WeeklySalesComputed,
} from '../types/calculator'

/** Umbral default de alerta IPR (% semanal). Editable en UI. */
export const DEFAULT_IPR_ALERT_PCT = 5

export function pctChange(start: number, end: number): number | null {
  if (!(start > 0) || !Number.isFinite(start) || !Number.isFinite(end)) return null
  return ((end - start) / start) * 100
}

export function lineRevenueBs(line: WeeklySaleLine): number {
  return (line.qty || 0) * (line.unitPriceBs || 0)
}

export function lineCostBs(line: WeeklySaleLine, rateUsdEnd: number): number {
  return (line.qty || 0) * (line.costoUSD || 0) * (rateUsdEnd > 0 ? rateUsdEnd : 0)
}

export function lineContribBs(line: WeeklySaleLine, rateUsdEnd: number): number {
  return lineRevenueBs(line) - lineCostBs(line, rateUsdEnd)
}

export function weekSalesBsFromLines(lines: WeeklySaleLine[]): number {
  return lines.reduce((acc, line) => acc + lineRevenueBs(line), 0)
}

export function weekContribBsFromLines(
  lines: WeeklySaleLine[],
  rateUsdEnd: number,
): number {
  return lines.reduce((acc, line) => acc + lineContribBs(line, rateUsdEnd), 0)
}

export type ProductRankRow = {
  productId: string
  desc: string
  units: number
  salesBs: number
  contribBs: number
}

/** Agrega líneas de todas las semanas por productId. */
export function rankWeeklyProducts(weeks: WeeklySales[]): ProductRankRow[] {
  const map = new Map<string, ProductRankRow>()

  for (const week of weeks) {
    const rate = week.rateUsdEnd || 0
    for (const line of week.lines ?? []) {
      const key = line.productId || line.id
      const prev = map.get(key)
      const salesBs = lineRevenueBs(line)
      const contribBs = lineContribBs(line, rate)
      if (prev) {
        prev.units += line.qty || 0
        prev.salesBs += salesBs
        prev.contribBs += contribBs
        if (line.desc) prev.desc = line.desc
      } else {
        map.set(key, {
          productId: key,
          desc: line.desc || 'Producto',
          units: line.qty || 0,
          salesBs,
          contribBs,
        })
      }
    }
  }

  return [...map.values()]
}

export function topByUnits(rows: ProductRankRow[], n = 3): ProductRankRow[] {
  return [...rows].sort((a, b) => b.units - a.units || b.salesBs - a.salesBs).slice(0, n)
}

export function topByContrib(rows: ProductRankRow[], n = 3): ProductRankRow[] {
  return [...rows]
    .sort((a, b) => b.contribBs - a.contribBs || b.units - a.units)
    .slice(0, n)
}

export function computeWeeklySalesRow(
  row: WeeklySales,
  alertThresholdPct = DEFAULT_IPR_ALERT_PCT,
): WeeklySalesComputed {
  const deltaUsdPct = pctChange(row.rateUsdStart, row.rateUsdEnd)
  const deltaEurPct = pctChange(row.rateEurStart, row.rateEurEnd)
  const candidates = [deltaUsdPct, deltaEurPct].filter(
    (n): n is number => n !== null && Number.isFinite(n),
  )
  const ipr = candidates.length ? Math.max(...candidates) : null
  const salesUsdEq =
    row.rateUsdEnd > 0 && row.salesBs > 0 ? row.salesBs / row.rateUsdEnd : null
  const alert = ipr !== null && ipr >= alertThresholdPct

  return { deltaUsdPct, deltaEurPct, ipr, salesUsdEq, alert }
}

export function summarizeWeeklySales(
  rows: WeeklySales[],
  alertThresholdPct = DEFAULT_IPR_ALERT_PCT,
) {
  const sorted = [...rows].sort((a, b) => a.weekStart.localeCompare(b.weekStart))
  const computed = sorted.map((r) => {
    const lines = r.lines ?? []
    const hasLines = lines.length > 0
    return {
      row: r,
      ...computeWeeklySalesRow(r, alertThresholdPct),
      hasLines,
      lineCount: lines.length,
      contribBs: hasLines ? weekContribBsFromLines(lines, r.rateUsdEnd) : null,
    }
  })
  const latest = computed.length ? computed[computed.length - 1] : null
  const totalSalesBs = sorted.reduce((acc, r) => acc + (r.salesBs || 0), 0)
  const alertCount = computed.filter((c) => c.alert).length
  const productRanks = rankWeeklyProducts(sorted)
  const hasAnyLines = productRanks.length > 0
  return {
    sorted,
    computed,
    latest,
    totalSalesBs,
    alertCount,
    productRanks,
    hasAnyLines,
    topUnits: topByUnits(productRanks, 3),
    topContrib: topByContrib(productRanks, 3),
  }
}

export type WeeklySalesSummary = ReturnType<typeof summarizeWeeklySales>

/** Lunes de la semana ISO-ish en local YYYY-MM-DD */
export function weekStartFromDate(d = new Date()): string {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const day = x.getDay()
  const diff = day === 0 ? -6 : 1 - day
  x.setDate(x.getDate() + diff)
  return toIsoDate(x)
}

export function weekEndFromStart(weekStart: string): string {
  const x = parseIsoDate(weekStart)
  x.setDate(x.getDate() + 6)
  return toIsoDate(x)
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
