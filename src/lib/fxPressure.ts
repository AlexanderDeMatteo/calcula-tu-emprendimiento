export const DOLARAPI_USD_HISTORY_URL = 'https://ve.dolarapi.com/v1/historicos/dolares'
export const DOLARAPI_EUR_HISTORY_URL = 'https://ve.dolarapi.com/v1/historicos/euros'

export const FX_HISTORY_CACHE_KEY = 'calculadora-emprendedor-ve:fx-history:v1'
export const PRESSURE_WINDOW_DAYS = 30

export type FxDayQuote = {
  fecha: string
  promedio: number
  fuente: string
}

export type FxHistoryCache = {
  fetchedAt: string
  usdOficial: FxDayQuote[]
  eurOficial: FxDayQuote[]
}

function asPositiveNumber(value: unknown): number | null {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? parseFloat(value) : NaN
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

export function parseIsoDay(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const m = value.trim().match(/^(\d{4})[-/](\d{2})[-/](\d{2})/)
  if (!m) return null
  return `${m[1]}-${m[2]}-${m[3]}`
}

export function localIsoDate(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addCalendarDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + days)
  return localIsoDate(dt)
}

function quoteFromUnknown(raw: unknown): FxDayQuote | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  const fecha = parseIsoDay(row.fecha ?? row.fechaActualizacion)
  const promedio = asPositiveNumber(row.promedio)
  const fuente = typeof row.fuente === 'string' ? row.fuente.toLowerCase() : ''
  if (!fecha || promedio == null) return null
  return { fecha, promedio, fuente: fuente || 'oficial' }
}

/** Solo serie oficial, un valor por día (el último si hay duplicados). */
export function parseOficialHistory(raw: unknown): FxDayQuote[] {
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)
      ? ((raw as { data: unknown[] }).data)
      : []
  const byDay = new Map<string, FxDayQuote>()
  for (const item of list) {
    const quote = quoteFromUnknown(item)
    if (!quote) continue
    if (quote.fuente && quote.fuente !== 'oficial') continue
    byDay.set(quote.fecha, quote)
  }
  return [...byDay.values()].sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(-90)
}

export function pressurePctOverDays(
  series: FxDayQuote[],
  windowDays = PRESSURE_WINDOW_DAYS,
  endRate?: number | null,
): number | null {
  if (series.length < 1) return null
  const sorted = [...series].sort((a, b) => a.fecha.localeCompare(b.fecha))
  const last = sorted[sorted.length - 1]
  const end =
    endRate != null && Number.isFinite(endRate) && endRate > 0 ? endRate : last.promedio
  const endFecha = last.fecha
  const cutoff = addCalendarDays(endFecha, -windowDays)
  let start: FxDayQuote | null = null
  for (const q of sorted) {
    if (q.fecha <= cutoff) start = q
  }
  if (!start) start = sorted[0]
  if (!start || start.promedio <= 0) return null
  if (start.fecha === endFecha && (endRate == null || endRate === start.promedio)) return null
  return ((end / start.promedio) - 1) * 100
}

export function resolvePressurePct(
  historyPct: number | null,
  iprPct: number | null,
): number | null {
  const hist = historyPct != null && Number.isFinite(historyPct) && historyPct > 0 ? historyPct : null
  if (hist != null) return hist
  if (iprPct != null && Number.isFinite(iprPct) && iprPct > 0) return iprPct
  return null
}

export function loadFxHistoryCache(): FxHistoryCache | null {
  try {
    const raw = localStorage.getItem(FX_HISTORY_CACHE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as Partial<FxHistoryCache>
    if (typeof data.fetchedAt !== 'string') return null
    return {
      fetchedAt: data.fetchedAt,
      usdOficial: parseOficialHistory(data.usdOficial),
      eurOficial: parseOficialHistory(data.eurOficial),
    }
  } catch {
    return null
  }
}

export function saveFxHistoryCache(cache: FxHistoryCache) {
  try {
    localStorage.setItem(FX_HISTORY_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // quota / private mode
  }
}

async function fetchJson(url: string, signal: AbortSignal) {
  const res = await fetch(url, {
    signal,
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`)
  return res.json()
}

export async function fetchOficialHistory(
  url: string,
  timeoutMs = 12000,
): Promise<FxDayQuote[]> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const data = await fetchJson(url, controller.signal)
    return parseOficialHistory(data)
  } finally {
    clearTimeout(timer)
  }
}

export async function fetchFxHistory(): Promise<Pick<FxHistoryCache, 'usdOficial' | 'eurOficial'>> {
  const usdOficial = await fetchOficialHistory(DOLARAPI_USD_HISTORY_URL)
  let eurOficial: FxDayQuote[] = []
  try {
    eurOficial = await fetchOficialHistory(DOLARAPI_EUR_HISTORY_URL)
  } catch {
    eurOficial = []
  }
  return { usdOficial, eurOficial }
}

export function pressureFromHistory(
  usdOficial: FxDayQuote[],
  eurOficial: FxDayQuote[],
  rates: { bcv: number; eur: number },
): number | null {
  const usd = pressurePctOverDays(usdOficial, PRESSURE_WINDOW_DAYS, rates.bcv)
  const eur = pressurePctOverDays(eurOficial, PRESSURE_WINDOW_DAYS, rates.eur)
  const candidates = [usd, eur].filter((n): n is number => n != null && Number.isFinite(n))
  if (!candidates.length) return null
  return Math.max(...candidates)
}
