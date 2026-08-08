import {
  DEFAULT_CAPITAL,
  DEFAULT_DIST,
  DEFAULT_GASTOS,
  DEFAULT_MUNICIPALES,
  DEFAULT_NACIONALES,
  DEFAULT_PARAFISCALES,
  DEFAULT_PRODUCTS,
} from '../data/defaults'
import type {
  Currency,
  DistKey,
  Location,
  MoneyItem,
  Product,
  Rates,
  RatesSource,
  TaxItem,
  WeeklySaleLine,
  WeeklySales,
} from '../types/calculator'

export const STORAGE_KEY = 'calculadora-emprendedor-ve:v1'

export type PersistedState = {
  rates: Rates
  draftRates: Rates
  lastUpdate: string
  ratesSource: RatesSource
  location: Location
  products: Product[]
  reinvPct: number
  dist: Record<DistKey, number>
  parafiscales: TaxItem[]
  municipales: TaxItem[]
  nacionales: TaxItem[]
  salario: number
  salarioDivisa: Currency
  ingresosMunEUR: number
  ingresosNacEUR: number
  capitalItems: MoneyItem[]
  gastosItems: MoneyItem[]
  weeklySales: WeeklySales[]
  iprAlertPct: number
}

export function defaultPersistedState(lastUpdate: string): PersistedState {
  return {
    rates: { bcv: 40.5, eur: 44.2 },
    draftRates: { bcv: 40.5, eur: 44.2 },
    lastUpdate,
    ratesSource: 'manual',
    location: { estado: 'Carabobo', ciudad: 'Valencia' },
    products: DEFAULT_PRODUCTS,
    reinvPct: 20,
    dist: { ...DEFAULT_DIST },
    parafiscales: DEFAULT_PARAFISCALES,
    municipales: DEFAULT_MUNICIPALES,
    nacionales: DEFAULT_NACIONALES,
    salario: 0,
    salarioDivisa: 'bs',
    ingresosMunEUR: 0,
    ingresosNacEUR: 0,
    capitalItems: DEFAULT_CAPITAL,
    gastosItems: DEFAULT_GASTOS,
    weeklySales: [],
    iprAlertPct: 5,
  }
}

function isRates(v: unknown): v is Rates {
  if (!v || typeof v !== 'object') return false
  const r = v as Rates
  return Number.isFinite(r.bcv) && r.bcv > 0 && Number.isFinite(r.eur) && r.eur > 0
}

function normalizeWeeklySaleLine(raw: unknown): WeeklySaleLine | null {
  if (!raw || typeof raw !== 'object') return null
  const l = raw as Partial<WeeklySaleLine>
  if (typeof l.id !== 'string' || typeof l.productId !== 'string') return null
  return {
    id: l.id,
    productId: l.productId,
    desc: typeof l.desc === 'string' ? l.desc : '',
    costoUSD: Number.isFinite(l.costoUSD) ? Number(l.costoUSD) : 0,
    qty: Number.isFinite(l.qty) ? Number(l.qty) : 0,
    unitPriceBs: Number.isFinite(l.unitPriceBs) ? Number(l.unitPriceBs) : 0,
  }
}

function normalizeWeeklySales(rows: unknown[]): WeeklySales[] {
  return rows.map((raw, i) => {
    const w = (raw && typeof raw === 'object' ? raw : {}) as Partial<WeeklySales>
    const linesRaw = Array.isArray(w.lines) ? w.lines : []
    const lines = linesRaw
      .map(normalizeWeeklySaleLine)
      .filter((l): l is WeeklySaleLine => l !== null)
    return {
      id: typeof w.id === 'string' ? w.id : `w-migrated-${i}`,
      weekStart: typeof w.weekStart === 'string' ? w.weekStart : '',
      weekEnd: typeof w.weekEnd === 'string' ? w.weekEnd : '',
      salesBs: Number.isFinite(w.salesBs) ? Number(w.salesBs) : 0,
      salesUsd: Number.isFinite(w.salesUsd) ? Number(w.salesUsd) : 0,
      rateUsdStart: Number.isFinite(w.rateUsdStart) ? Number(w.rateUsdStart) : 0,
      rateUsdEnd: Number.isFinite(w.rateUsdEnd) ? Number(w.rateUsdEnd) : 0,
      rateEurStart: Number.isFinite(w.rateEurStart) ? Number(w.rateEurStart) : 0,
      rateEurEnd: Number.isFinite(w.rateEurEnd) ? Number(w.rateEurEnd) : 0,
      notes: typeof w.notes === 'string' ? w.notes : '',
      lines,
    }
  })
}

export function loadPersistedState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as Partial<PersistedState>
    if (!isRates(data.rates) || !isRates(data.draftRates)) return null
    if (!Array.isArray(data.products)) return null
    return {
      ...defaultPersistedState(data.lastUpdate || ''),
      ...data,
      rates: data.rates,
      draftRates: data.draftRates,
      products: data.products,
      dist: data.dist ? { ...DEFAULT_DIST, ...data.dist } : { ...DEFAULT_DIST },
      parafiscales: data.parafiscales ?? DEFAULT_PARAFISCALES,
      municipales: data.municipales ?? DEFAULT_MUNICIPALES,
      nacionales: data.nacionales ?? DEFAULT_NACIONALES,
      capitalItems: data.capitalItems ?? DEFAULT_CAPITAL,
      gastosItems: data.gastosItems ?? DEFAULT_GASTOS,
      weeklySales: Array.isArray(data.weeklySales)
        ? normalizeWeeklySales(data.weeklySales)
        : [],
      iprAlertPct:
        typeof data.iprAlertPct === 'number' && data.iprAlertPct > 0
          ? data.iprAlertPct
          : 5,
      ratesSource: data.ratesSource === 'bcv' ? 'bcv' : 'manual',
    }
  } catch {
    return null
  }
}

export function savePersistedState(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // quota / private mode — ignore
  }
}

export function clearPersistedState() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
