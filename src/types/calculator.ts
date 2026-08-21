export type Currency = 'bs' | 'usd' | 'eur'
export type PriceCurrency = 'usd' | 'eur'

export type Product = {
  id: string
  desc: string
  cant: number
  costoUSD: number
  margen: number
  pvRef: number
  pvDivisa: PriceCurrency
}

export type DistKey = 'reinv' | 'inv' | 'imp' | 'para' | 'suel' | 'deuda' | 'util'

export type DistMode = 'sobrevivir' | 'crecer' | 'pagar_deuda' | 'dueno'

export type DebtItem = {
  id: string
  desc: string
  saldo: number
  cuotaMensual: number
}

export type TaxBase = 'salary' | 'ingresos_mun_eur' | 'ingresos_nac_eur' | 'fixed_eur' | 'fixed'

export type TaxItem = {
  key: string
  nombre: string
  desc: string
  rate: number
  base: TaxBase
  active: boolean
  employer?: boolean
  worker?: boolean
  fixedEur?: number
  fixedBs?: number
}

export type MoneyItem = {
  id: string
  desc: string
  monto: number
}

export type Rates = {
  bcv: number
  eur: number
}

export type Location = {
  estado: string
  ciudad: string
}

export type ProductQuoteSource = 'plan' | 'replenish'

export type ProductQuoteCtx = {
  pressurePct?: number | null
  lastSoldUsdByProduct?: Record<string, number>
}

export type ProductComputed = {
  costoBs: number
  pisoBs: number
  pvSugBs: number
  pvSugUSD: number
  ppubBs: number
  gananciaUnitBs: number
  gananciaTotalBs: number
  margenEfectivo: number
  quoteSource: ProductQuoteSource
}

export type FinancialTotals = {
  invBs: number
  venBs: number
  ganBs: number
  reinvBs: number
  ganNet: number
}

export type TaxTotals = {
  paraTotal: number
  munTotal: number
  nacTotal: number
  amounts: Record<string, number>
}

export type GlobalTotals = {
  capTotal: number
  gasTotal: number
  cuotaDeudas: number
  saldoDeudas: number
  /** @deprecated use utilAntesImpuestos — kept for compatibility */
  utilNeta: number
  utilAntesImpuestos: number
  tributosRef: number
  utilDespuesTributosRef: number
  puntoEquilibrioPct: number
  margenPct: number
}

export type RatesSource = 'manual' | 'bcv'

export type BcvFetchStatus = 'idle' | 'loading' | 'ok' | 'error'

/** Línea de venta real por producto (snapshot del catálogo al agregar). */
export type WeeklySaleLine = {
  id: string
  productId: string
  desc: string
  costoUSD: number
  qty: number
  unitPriceBs: number
  /** Día de la venta (YYYY-MM-DD, hora local). */
  saleDate: string
}

/** Registro de ventas reales del negocio (no escenario de inventario). */
export type WeeklySales = {
  id: string
  weekStart: string
  weekEnd: string
  salesBs: number
  salesUsd: number
  rateUsdStart: number
  rateUsdEnd: number
  rateEurStart: number
  rateEurEnd: number
  notes: string
  /** Desglose opcional; si hay líneas, salesBs = suma de ingresos. */
  lines: WeeklySaleLine[]
}

export type WeeklySalesComputed = {
  deltaUsdPct: number | null
  deltaEurPct: number | null
  /** Índice de presión de reposición = max(ΔUSD%, ΔEUR%) */
  ipr: number | null
  salesUsdEq: number | null
  alert: boolean
}

