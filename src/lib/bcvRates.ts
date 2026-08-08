import type { Rates } from '../types/calculator'

/** Fallback (a menudo inestable / TLS) */
export const BCV_TODAY_URL = 'https://bcv.today/api/v1/rate.json'

/** Fuente primaria: tasas oficiales BCV republicadas (CORS *) */
export const DOLARAPI_USD_URL = 'https://ve.dolarapi.com/v1/dolares/oficial'
export const DOLARAPI_EUR_URL = 'https://ve.dolarapi.com/v1/euros/oficial'

/** @deprecated use DOLARAPI / fetchBcvRates */
export const BCV_RATE_URL = BCV_TODAY_URL

export type BcvRatePayload = {
  USD?: unknown
  EUR?: unknown
  effective_date?: string
  updated_at?: string
  date?: string
}

export type DolarApiQuote = {
  moneda?: string
  fuente?: string
  promedio?: unknown
  fechaActualizacion?: string
}

export type ParsedBcvRates = {
  rates: Rates
  effectiveDate: string
  updatedAt: string
  source: 'dolarapi' | 'bcv.today'
}

function asPositiveNumber(value: unknown): number | null {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? parseFloat(value) : NaN
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

export function parseBcvRates(data: BcvRatePayload): ParsedBcvRates {
  const usd = asPositiveNumber(data.USD)
  const eur = asPositiveNumber(data.EUR)
  if (usd === null || eur === null) {
    throw new Error('Respuesta BCV inválida: faltan USD o EUR válidos')
  }
  return {
    rates: { bcv: usd, eur },
    effectiveDate: data.effective_date || data.date || '',
    updatedAt: data.updated_at || '',
    source: 'bcv.today',
  }
}

export function parseDolarApiPair(usd: DolarApiQuote, eur: DolarApiQuote): ParsedBcvRates {
  const usdRate = asPositiveNumber(usd.promedio)
  const eurRate = asPositiveNumber(eur.promedio)
  if (usdRate === null || eurRate === null) {
    throw new Error('Respuesta dolarapi inválida: faltan promedios USD/EUR')
  }
  const fecha = usd.fechaActualizacion || eur.fechaActualizacion || ''
  return {
    rates: { bcv: usdRate, eur: eurRate },
    effectiveDate: fecha ? fecha.slice(0, 10) : '',
    updatedAt: fecha,
    source: 'dolarapi',
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

async function fetchFromDolarApi(signal: AbortSignal): Promise<ParsedBcvRates> {
  const [usd, eur] = await Promise.all([
    fetchJson(DOLARAPI_USD_URL, signal) as Promise<DolarApiQuote>,
    fetchJson(DOLARAPI_EUR_URL, signal) as Promise<DolarApiQuote>,
  ])
  return parseDolarApiPair(usd, eur)
}

async function fetchFromBcvToday(signal: AbortSignal): Promise<ParsedBcvRates> {
  const data = (await fetchJson(BCV_TODAY_URL, signal)) as BcvRatePayload
  return parseBcvRates(data)
}

export async function fetchBcvRates(timeoutMs = 10000): Promise<ParsedBcvRates> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    try {
      return await fetchFromDolarApi(controller.signal)
    } catch {
      return await fetchFromBcvToday(controller.signal)
    }
  } finally {
    clearTimeout(timer)
  }
}
