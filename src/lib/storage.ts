import {
  DEFAULT_CAPITAL,
  DEFAULT_DIST,
  DEFAULT_GASTOS,
  DEFAULT_MUNICIPALES,
  DEFAULT_NACIONALES,
  DEFAULT_PARAFISCALES,
} from '../data/defaults'
import { applyOpeningStock, soldQtyByProduct } from './weeklySales'
import { defaultBusinessProfile, type BusinessProfile } from '../types/profile'
import type {
  Currency,
  DebtItem,
  DistKey,
  DistMode,
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
  distMode: DistMode
  distManual: boolean
  parafiscales: TaxItem[]
  municipales: TaxItem[]
  nacionales: TaxItem[]
  salario: number
  salarioDivisa: Currency
  ingresosMunEUR: number
  ingresosNacEUR: number
  capitalItems: MoneyItem[]
  gastosItems: MoneyItem[]
  debtItems: DebtItem[]
  weeklySales: WeeklySales[]
  iprAlertPct: number
  /** Una vez true, no se vuelven a restar ventas históricas del stock. */
  stockKardexApplied: boolean
  /** null = usar IPR de última semana; 0 = sin piso de inflación */
  inflationRefPct: number | null
  profile: BusinessProfile
}

export function defaultPersistedState(lastUpdate: string): PersistedState {
  return {
    rates: { bcv: 40.5, eur: 44.2 },
    draftRates: { bcv: 40.5, eur: 44.2 },
    lastUpdate,
    ratesSource: 'manual',
    location: { estado: 'Carabobo', ciudad: 'Valencia' },
    products: [],
    reinvPct: 20,
    dist: { ...DEFAULT_DIST },
    distMode: 'crecer',
    distManual: false,
    parafiscales: DEFAULT_PARAFISCALES,
    municipales: DEFAULT_MUNICIPALES,
    nacionales: DEFAULT_NACIONALES,
    salario: 0,
    salarioDivisa: 'bs',
    ingresosMunEUR: 0,
    ingresosNacEUR: 0,
    capitalItems: DEFAULT_CAPITAL,
    gastosItems: DEFAULT_GASTOS,
    debtItems: [],
    weeklySales: [],
    iprAlertPct: 5,
    stockKardexApplied: true,
    inflationRefPct: null,
    profile: defaultBusinessProfile(),
  }
}

function normalizeProfile(raw: unknown): BusinessProfile {
  const base = defaultBusinessProfile()
  if (!raw || typeof raw !== 'object') return base
  const p = raw as Partial<BusinessProfile>
  return {
    ...base,
    complete: p.complete === true,
    name: typeof p.name === 'string' ? p.name : base.name,
    estado: typeof p.estado === 'string' ? p.estado : base.estado,
    ciudad: typeof p.ciudad === 'string' ? p.ciudad : base.ciudad,
    sector:
      p.sector === 'comercio' ||
      p.sector === 'comida' ||
      p.sector === 'servicios' ||
      p.sector === 'produccion' ||
      p.sector === 'mixto'
        ? p.sector
        : base.sector,
    model:
      p.model === 'producto' || p.model === 'servicio' || p.model === 'mixto'
        ? p.model
        : base.model,
    stage:
      p.stage === 'idea' || p.stage === 'informal' || p.stage === 'formalizado'
        ? p.stage
        : base.stage,
    peopleCount:
      typeof p.peopleCount === 'number' && p.peopleCount > 0
        ? Math.round(p.peopleCount)
        : base.peopleCount,
    hasFormalEmployees: p.hasFormalEmployees === true,
    site:
      p.site === 'casa' ||
      p.site === 'alquilado' ||
      p.site === 'propio' ||
      p.site === 'digital' ||
      p.site === 'otro'
        ? p.site
        : base.site,
    hasDebt: p.hasDebt === true,
    hasSales: p.hasSales === true,
    monthFocus: isDistMode(p.monthFocus) ? p.monthFocus : base.monthFocus,
    departments: Array.isArray(p.departments)
      ? p.departments.filter((d): d is BusinessProfile['departments'][number] =>
          d === 'ventas' ||
          d === 'caja' ||
          d === 'operacion' ||
          d === 'gente' ||
          d === 'deudas' ||
          d === 'atencion' ||
          d === 'compras',
        )
      : [],
  }
}

function isRates(v: unknown): v is Rates {
  if (!v || typeof v !== 'object') return false
  const r = v as Rates
  return Number.isFinite(r.bcv) && r.bcv > 0 && Number.isFinite(r.eur) && r.eur > 0
}

function normalizeWeeklySaleLine(raw: unknown, weekStart: string): WeeklySaleLine | null {
  if (!raw || typeof raw !== 'object') return null
  const l = raw as Partial<WeeklySaleLine>
  if (typeof l.id !== 'string' || typeof l.productId !== 'string') return null
  const saleDate =
    typeof l.saleDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(l.saleDate)
      ? l.saleDate
      : weekStart
  return {
    id: l.id,
    productId: l.productId,
    desc: typeof l.desc === 'string' ? l.desc : '',
    costoUSD: Number.isFinite(l.costoUSD) ? Number(l.costoUSD) : 0,
    qty: Number.isFinite(l.qty) ? Number(l.qty) : 0,
    unitPriceBs: Number.isFinite(l.unitPriceBs) ? Number(l.unitPriceBs) : 0,
    saleDate,
  }
}

function normalizeWeeklySales(rows: unknown[]): WeeklySales[] {
  return rows.map((raw, i) => {
    const w = (raw && typeof raw === 'object' ? raw : {}) as Partial<WeeklySales>
    const weekStart = typeof w.weekStart === 'string' ? w.weekStart : ''
    const linesRaw = Array.isArray(w.lines) ? w.lines : []
    const lines = linesRaw
      .map((l) => normalizeWeeklySaleLine(l, weekStart))
      .filter((l): l is WeeklySaleLine => l !== null)
    return {
      id: typeof w.id === 'string' ? w.id : `w-migrated-${i}`,
      weekStart,
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

function normalizeDebtItems(rows: unknown[]): DebtItem[] {
  return rows
    .map((raw, i) => {
      if (!raw || typeof raw !== 'object') return null
      const d = raw as Partial<DebtItem>
      return {
        id: typeof d.id === 'string' ? d.id : `d-migrated-${i}`,
        desc: typeof d.desc === 'string' ? d.desc : 'Deuda',
        saldo: Number.isFinite(d.saldo) ? Number(d.saldo) : 0,
        cuotaMensual: Number.isFinite(d.cuotaMensual) ? Number(d.cuotaMensual) : 0,
      } satisfies DebtItem
    })
    .filter((d): d is DebtItem => d !== null)
}

function isDistMode(v: unknown): v is DistMode {
  return (
    v === 'sobrevivir' || v === 'crecer' || v === 'pagar_deuda' || v === 'dueno'
  )
}

export function loadPersistedState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as Partial<PersistedState>
    if (!isRates(data.rates) || !isRates(data.draftRates)) return null
    if (!Array.isArray(data.products)) return null
    const weeklySales = Array.isArray(data.weeklySales)
      ? normalizeWeeklySales(data.weeklySales)
      : []
    const products = data.products
    const stockKardexApplied = data.stockKardexApplied === true
    const migratedProducts = stockKardexApplied
      ? products
      : applyOpeningStock(products, soldQtyByProduct(weeklySales))
    return {
      ...defaultPersistedState(data.lastUpdate || ''),
      ...data,
      rates: data.rates,
      draftRates: data.draftRates,
      products: migratedProducts,
      dist: data.dist ? { ...DEFAULT_DIST, ...data.dist, deuda: data.dist.deuda ?? 0 } : { ...DEFAULT_DIST },
      distMode: isDistMode(data.distMode) ? data.distMode : 'crecer',
      distManual: data.distManual === true,
      parafiscales: data.parafiscales ?? DEFAULT_PARAFISCALES,
      municipales: data.municipales ?? DEFAULT_MUNICIPALES,
      nacionales: data.nacionales ?? DEFAULT_NACIONALES,
      capitalItems: data.capitalItems ?? DEFAULT_CAPITAL,
      gastosItems: data.gastosItems ?? DEFAULT_GASTOS,
      debtItems: Array.isArray(data.debtItems) ? normalizeDebtItems(data.debtItems) : [],
      weeklySales,
      iprAlertPct:
        typeof data.iprAlertPct === 'number' && data.iprAlertPct > 0
          ? data.iprAlertPct
          : 5,
      inflationRefPct:
        typeof data.inflationRefPct === 'number' && Number.isFinite(data.inflationRefPct)
          ? data.inflationRefPct
          : null,
      stockKardexApplied: true,
      ratesSource: data.ratesSource === 'bcv' ? 'bcv' : 'manual',
      profile: normalizeProfile(data.profile),
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
