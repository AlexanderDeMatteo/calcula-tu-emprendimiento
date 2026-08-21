import type {
  Product,
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

/** Último precio cobrado por producto, en USD de esa semana (unitPriceBs / rateUsdEnd). */
export function lastSoldUsdByProduct(weeks: WeeklySales[]): Record<string, number> {
  const sorted = [...weeks].sort((a, b) => {
    const ae = a.weekEnd || a.weekStart
    const be = b.weekEnd || b.weekStart
    return ae.localeCompare(be)
  })
  const map: Record<string, number> = {}
  for (const week of sorted) {
    const rate = week.rateUsdEnd || 0
    if (!(rate > 0)) continue
    for (const line of week.lines ?? []) {
      if (!line.productId) continue
      if (!(line.qty > 0) || !(line.unitPriceBs > 0)) continue
      map[line.productId] = line.unitPriceBs / rate
    }
  }
  return map
}

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

export function todayIsoDate(d = new Date()): string {
  return toIsoDate(d)
}

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function isSameCalendarMonth(isoDate: string, ref: Date): boolean {
  const d = parseIsoDate(isoDate)
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()
}

export type MonthRealProfit = {
  hasSales: boolean
  salesBs: number
  costBs: number
  contribBs: number
  utilMes: number
  lineCount: number
  monthLabel: string
}

/** Utilidad del mes calendario desde ventas reales (no escenario de inventario). */
export function computeMonthRealProfit(params: {
  weeks: WeeklySales[]
  gasTotal: number
  cuotaDeudas: number
  tributosRef: number
  refDate?: Date
}): MonthRealProfit {
  const ref = params.refDate ?? new Date()
  const y = ref.getFullYear()
  const m = ref.getMonth()
  let salesBs = 0
  let costBs = 0
  let lineCount = 0

  for (const week of params.weeks) {
    const rate = week.rateUsdEnd || 0
    for (const line of week.lines ?? []) {
      const saleDate = line.saleDate || week.weekStart
      const d = parseIsoDate(saleDate)
      if (d.getFullYear() !== y || d.getMonth() !== m) continue
      salesBs += lineRevenueBs(line)
      costBs += lineCostBs(line, rate)
      lineCount++
    }
  }

  const contribBs = salesBs - costBs
  const hasSales = lineCount > 0
  const utilMes = hasSales
    ? contribBs - params.gasTotal - params.cuotaDeudas - params.tributosRef
    : 0

  return {
    hasSales,
    salesBs,
    costBs,
    contribBs,
    utilMes,
    lineCount,
    monthLabel: `${y}-${String(m + 1).padStart(2, '0')}`,
  }
}

/** Semana que contiene la fecha, o null si no hay coincidencia exacta por weekStart. */
export function findWeekForDate(weeks: WeeklySales[], dateIso: string): WeeklySales | null {
  const d = parseIsoDate(dateIso)
  for (const week of weeks) {
    const start = parseIsoDate(week.weekStart)
    const end = parseIsoDate(week.weekEnd || weekEndFromStart(week.weekStart))
    if (d >= start && d <= end) return week
  }
  return weeks.find((w) => w.weekStart === weekStartFromDate(d)) ?? null
}

export type MonthSaleLineRow = {
  weekId: string
  line: WeeklySaleLine
  rateUsdEnd: number
}

/** Líneas de venta del mes calendario, ordenadas por día (más reciente primero). */
export function listMonthSaleLines(
  weeks: WeeklySales[],
  refDate = new Date(),
): MonthSaleLineRow[] {
  const rows: MonthSaleLineRow[] = []
  for (const week of weeks) {
    const rate = week.rateUsdEnd || 0
    for (const line of week.lines ?? []) {
      const saleDate = line.saleDate || week.weekStart
      if (!isSameCalendarMonth(saleDate, refDate)) continue
      rows.push({ weekId: week.id, line, rateUsdEnd: rate })
    }
  }
  return rows.sort(
    (a, b) =>
      (b.line.saleDate || '').localeCompare(a.line.saleDate || '') ||
      a.line.desc.localeCompare(b.line.desc),
  )
}

export type MonthSaleDayGroup = {
  date: string
  rows: MonthSaleLineRow[]
}

export function groupMonthSaleLines(rows: MonthSaleLineRow[]): MonthSaleDayGroup[] {
  const map = new Map<string, MonthSaleLineRow[]>()
  for (const row of rows) {
    const date = row.line.saleDate || ''
    const list = map.get(date) ?? []
    list.push(row)
    map.set(date, list)
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, groupRows]) => ({ date, rows: groupRows }))
}

export function formatWeekRange(weekStart: string, weekEnd: string): string {
  if (!weekStart) return '—'
  if (!weekEnd || weekEnd === weekStart) return weekStart
  return `${weekStart} – ${weekEnd}`
}

export function availableStock(cant: number): number {
  return Number.isFinite(cant) && cant > 0 ? cant : 0
}

export function soldQtyByProduct(weeks: WeeklySales[]): Record<string, number> {
  const map: Record<string, number> = {}
  for (const week of weeks) {
    for (const line of week.lines ?? []) {
      if (!line.productId) continue
      map[line.productId] = (map[line.productId] || 0) + (line.qty || 0)
    }
  }
  return map
}

export function applyOpeningStock(
  products: Product[],
  soldMap: Record<string, number>,
): Product[] {
  return products.map((p) => {
    const sold = soldMap[p.id] || 0
    if (!(sold > 0)) return p
    return { ...p, cant: Math.max(0, (p.cant || 0) - sold) }
  })
}
