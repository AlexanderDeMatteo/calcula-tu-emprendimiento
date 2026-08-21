import type {
  FinancialTotals,
  GlobalTotals,
  MoneyItem,
  Product,
  ProductComputed,
  ProductQuoteCtx,
  Rates,
  TaxItem,
  TaxTotals,
  Currency,
  DebtItem,
} from '../types/calculator'

export function computeProductRow(
  product: Product,
  rates: Rates,
  ctx: ProductQuoteCtx = {},
): ProductComputed {
  const costoBs = product.costoUSD * rates.bcv
  const margen = Math.max(0, product.margen)
  const pressure =
    ctx.pressurePct != null && Number.isFinite(ctx.pressurePct) && ctx.pressurePct > 0
      ? ctx.pressurePct
      : 0
  const pisoBs = costoBs * (1 + pressure / 100)
  const planBs = costoBs * (1 + margen / 100)
  const pvSugBs = Math.max(pisoBs, planBs)
  const quoteSource = planBs > pisoBs + 1e-9 ? 'plan' : 'replenish'
  const pvSugUSD = rates.bcv > 0 ? pvSugBs / rates.bcv : 0
  const pvRefVal = product.pvRef || 0
  const ppubBs =
    pvRefVal > 0
      ? product.pvDivisa === 'eur'
        ? pvRefVal * rates.eur
        : pvRefVal * rates.bcv
      : pvSugBs
  const gananciaUnitBs = ppubBs - costoBs
  const gananciaTotalBs = gananciaUnitBs * product.cant
  const margenEfectivo = costoBs > 0 ? ((ppubBs - costoBs) / costoBs) * 100 : margen

  return {
    costoBs,
    pisoBs,
    pvSugBs,
    pvSugUSD,
    ppubBs,
    gananciaUnitBs,
    gananciaTotalBs,
    margenEfectivo,
    quoteSource,
  }
}

export function computeFinancialSummary(
  products: Product[],
  rates: Rates,
  reinvPct: number,
  quoteCtx: ProductQuoteCtx = {},
): FinancialTotals {
  let invBs = 0
  let venBs = 0
  let ganBs = 0

  for (const product of products) {
    const row = computeProductRow(product, rates, quoteCtx)
    invBs += row.costoBs * product.cant
    venBs += row.ppubBs * product.cant
    ganBs += row.gananciaTotalBs
  }

  const reinvBs = (ganBs * reinvPct) / 100
  return {
    invBs,
    venBs,
    ganBs,
    reinvBs,
    ganNet: ganBs - reinvBs,
  }
}

export function salaryToBs(raw: number, currency: Currency, rates: Rates) {
  if (currency === 'usd') return raw * rates.bcv
  if (currency === 'eur') return raw * rates.eur
  return raw
}

export function computeTaxes(params: {
  parafiscales: TaxItem[]
  municipales: TaxItem[]
  nacionales: TaxItem[]
  salarioBs: number
  ingMunEUR: number
  ingNacEUR: number
  rates: Rates
}): TaxTotals {
  const { parafiscales, municipales, nacionales, salarioBs, ingMunEUR, ingNacEUR, rates } = params
  const amounts: Record<string, number> = {}
  let paraTotal = 0
  let munTotal = 0
  let nacTotal = 0

  const ingMunBs = ingMunEUR * rates.eur
  const ingNacBs = ingNacEUR * rates.eur

  for (const item of parafiscales) {
    const amt = item.active ? (salarioBs * item.rate) / 100 : 0
    amounts[item.key] = amt
    if (item.active && item.employer) paraTotal += amt
  }

  for (const item of municipales) {
    let amtBs = 0
    if (item.active) {
      amtBs =
        item.base === 'fixed_eur'
          ? (item.fixedEur || 0) * rates.eur
          : (ingMunBs * item.rate) / 100
    }
    amounts[item.key] = amtBs
    if (item.active) munTotal += amtBs
  }

  for (const item of nacionales) {
    const amtBs = item.active ? (ingNacBs * item.rate) / 100 : 0
    amounts[item.key] = amtBs
    if (item.active) nacTotal += amtBs
  }

  return { paraTotal, munTotal, nacTotal, amounts }
}

export function sumMoneyItems(items: MoneyItem[]) {
  return items.reduce((acc, item) => acc + item.monto, 0)
}

export function sumDebtCuotas(items: DebtItem[]) {
  return items.reduce((acc, d) => acc + (d.cuotaMensual || 0), 0)
}

export function sumDebtSaldos(items: DebtItem[]) {
  return items.reduce((acc, d) => acc + (d.saldo || 0), 0)
}

export function salesToEurBase(venBs: number, eurRate: number): number {
  if (eurRate <= 0 || venBs <= 0) return 0
  return Math.round((venBs / eurRate) * 100) / 100
}

export function computeGlobal(
  financial: FinancialTotals,
  capitalItems: MoneyItem[],
  gastosItems: MoneyItem[],
  taxes?: Pick<TaxTotals, 'paraTotal' | 'munTotal' | 'nacTotal'>,
  debtItems: DebtItem[] = [],
): GlobalTotals {
  const capTotal = sumMoneyItems(capitalItems)
  const gasTotal = sumMoneyItems(gastosItems)
  const cuotaDeudas = sumDebtCuotas(debtItems)
  const saldoDeudas = sumDebtSaldos(debtItems)
  const utilAntesImpuestos = financial.ganNet - gasTotal - cuotaDeudas
  const tributosRef = taxes
    ? taxes.paraTotal + taxes.munTotal + taxes.nacTotal
    : 0
  const utilDespuesTributosRef = utilAntesImpuestos - tributosRef
  const cargaFija = gasTotal + cuotaDeudas
  const puntoEquilibrioPct = financial.ganBs > 0 ? (cargaFija / financial.ganBs) * 100 : 0
  const margenPct = financial.venBs > 0 ? (financial.ganBs / financial.venBs) * 100 : 0

  return {
    capTotal,
    gasTotal,
    cuotaDeudas,
    saldoDeudas,
    utilNeta: utilAntesImpuestos,
    utilAntesImpuestos,
    tributosRef,
    utilDespuesTributosRef,
    puntoEquilibrioPct,
    margenPct,
  }
}
