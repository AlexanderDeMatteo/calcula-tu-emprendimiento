import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchBcvRates } from '../lib/bcvRates'
import {
  computeFinancialSummary,
  computeGlobal,
  computeProductRow,
  computeTaxes,
  salaryToBs,
  salesToEurBase,
} from '../lib/calc'
import { formatTimestamp } from '../lib/format'
import {
  fetchFxHistory,
  loadFxHistoryCache,
  localIsoDate,
  pressureFromHistory,
  resolvePressurePct,
  saveFxHistoryCache,
  type FxHistoryCache,
} from '../lib/fxPressure'
import {
  clearPersistedState,
  defaultPersistedState,
  loadPersistedState,
  savePersistedState,
  type PersistedState,
} from '../lib/storage'
import {
  availableStock,
  computeMonthRealProfit,
  findWeekForDate,
  lastSoldUsdByProduct,
  summarizeWeeklySales,
  todayIsoDate,
  weekEndFromStart,
  weekSalesBsFromLines,
  weekStartFromDate,
} from '../lib/weeklySales'
import {
  reinvPctFromPlan,
  suggestDistribution,
} from '../lib/suggestDistribution'
import { derivePlantLeaves, derivePlantStage, deriveQuickLinks } from '../lib/plant'
import type {
  BcvFetchStatus,
  Currency,
  DebtItem,
  DistKey,
  DistMode,
  Location,
  MoneyItem,
  PriceCurrency,
  Product,
  Rates,
  RatesSource,
  TaxItem,
  WeeklySaleLine,
  WeeklySales,
} from '../types/calculator'
import { defaultBusinessProfile, type BusinessProfile } from '../types/profile'

function uid(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

function patchTax(items: TaxItem[], key: string, patch: Partial<TaxItem>) {
  return items.map((item) => (item.key === key ? { ...item, ...patch } : item))
}

function initFromStorage(): PersistedState {
  const loaded = loadPersistedState()
  if (loaded) return loaded
  return defaultPersistedState(formatTimestamp(new Date()))
}

export function useCalculator() {
  const initial = useRef(initFromStorage()).current
  const hydrated = useRef(false)
  const skipNextSave = useRef(false)

  const [rates, setRates] = useState<Rates>(initial.rates)
  const [draftRates, setDraftRates] = useState<Rates>(initial.draftRates)
  const [lastUpdate, setLastUpdate] = useState(initial.lastUpdate)
  const [ratesSource, setRatesSource] = useState<RatesSource>(initial.ratesSource)
  const [bcvStatus, setBcvStatus] = useState<BcvFetchStatus>('idle')
  const [bcvError, setBcvError] = useState<string | null>(null)
  const [location, setLocation] = useState<Location>(initial.location)
  const [products, setProducts] = useState<Product[]>(initial.products)
  const [reinvPct, setReinvPct] = useState(initial.reinvPct)
  const [dist, setDist] = useState<Record<DistKey, number>>(initial.dist)
  const [distMode, setDistModeState] = useState<DistMode>(initial.distMode)
  const [distManual, setDistManual] = useState(initial.distManual)
  const [parafiscales, setParafiscales] = useState(initial.parafiscales)
  const [municipales, setMunicipales] = useState(initial.municipales)
  const [nacionales, setNacionales] = useState(initial.nacionales)
  const [salario, setSalario] = useState(initial.salario)
  const [salarioDivisa, setSalarioDivisa] = useState<Currency>(initial.salarioDivisa)
  const [ingresosMunEUR, setIngresosMunEUR] = useState(initial.ingresosMunEUR)
  const [ingresosNacEUR, setIngresosNacEUR] = useState(initial.ingresosNacEUR)
  const [capitalItems, setCapitalItems] = useState(initial.capitalItems)
  const [gastosItems, setGastosItems] = useState(initial.gastosItems)
  const [debtItems, setDebtItems] = useState<DebtItem[]>(initial.debtItems)
  const [weeklySales, setWeeklySales] = useState<WeeklySales[]>(initial.weeklySales)
  const [iprAlertPct, setIprAlertPct] = useState(initial.iprAlertPct)
  const [fxCache, setFxCache] = useState<FxHistoryCache | null>(() => loadFxHistoryCache())
  const [profile, setProfile] = useState<BusinessProfile>(initial.profile)

  const weeklySalesSummary = useMemo(
    () => summarizeWeeklySales(weeklySales, iprAlertPct),
    [weeklySales, iprAlertPct],
  )

  const latestIprPct = weeklySalesSummary.latest?.ipr ?? null
  const lastSoldMap = useMemo(() => lastSoldUsdByProduct(weeklySales), [weeklySales])
  const historyPressurePct = useMemo(
    () =>
      fxCache
        ? pressureFromHistory(fxCache.usdOficial, fxCache.eurOficial, rates)
        : null,
    [fxCache, rates],
  )
  const pressurePct = useMemo(
    () => resolvePressurePct(historyPressurePct, latestIprPct),
    [historyPressurePct, latestIprPct],
  )
  const quoteCtx = useMemo(
    () => ({ pressurePct, lastSoldUsdByProduct: lastSoldMap }),
    [pressurePct, lastSoldMap],
  )

  const financial = useMemo(
    () => computeFinancialSummary(products, rates, reinvPct, quoteCtx),
    [products, rates, reinvPct, quoteCtx],
  )

  const salarioBs = useMemo(
    () => salaryToBs(salario, salarioDivisa, rates),
    [salario, salarioDivisa, rates],
  )

  const taxes = useMemo(
    () =>
      computeTaxes({
        parafiscales,
        municipales,
        nacionales,
        salarioBs,
        ingMunEUR: ingresosMunEUR,
        ingNacEUR: ingresosNacEUR,
        rates,
      }),
    [
      parafiscales,
      municipales,
      nacionales,
      salarioBs,
      ingresosMunEUR,
      ingresosNacEUR,
      rates,
    ],
  )

  const global = useMemo(
    () => computeGlobal(financial, capitalItems, gastosItems, taxes, debtItems),
    [financial, capitalItems, gastosItems, taxes, debtItems],
  )

  const monthReal = useMemo(
    () =>
      computeMonthRealProfit({
        weeks: weeklySales,
        gasTotal: global.gasTotal,
        cuotaDeudas: global.cuotaDeudas,
        tributosRef: global.tributosRef,
      }),
    [weeklySales, global.gasTotal, global.cuotaDeudas, global.tributosRef],
  )

  const distSuggestion = useMemo(
    () =>
      suggestDistribution({
        venBs: financial.venBs,
        gasTotal: global.gasTotal,
        paraTotal: taxes.paraTotal,
        munTotal: taxes.munTotal,
        nacTotal: taxes.nacTotal,
        cuotaDeudas: global.cuotaDeudas,
        mode: distMode,
      }),
    [
      financial.venBs,
      global.gasTotal,
      global.cuotaDeudas,
      taxes.paraTotal,
      taxes.munTotal,
      taxes.nacTotal,
      distMode,
    ],
  )

  const distSum = useMemo(
    () => Object.values(dist).reduce((acc, n) => acc + n, 0),
    [dist],
  )

  const snapshot = useCallback((): PersistedState => {
    return {
      rates,
      draftRates,
      lastUpdate,
      ratesSource,
      location,
      products,
      reinvPct,
      dist,
      distMode,
      distManual,
      parafiscales,
      municipales,
      nacionales,
      salario,
      salarioDivisa,
      ingresosMunEUR,
      ingresosNacEUR,
      capitalItems,
      gastosItems,
      debtItems,
      weeklySales,
      iprAlertPct,
      inflationRefPct: null,
      stockKardexApplied: true,
      profile,
    }
  }, [
    rates,
    draftRates,
    lastUpdate,
    ratesSource,
    location,
    products,
    reinvPct,
    dist,
    distMode,
    distManual,
    parafiscales,
    municipales,
    nacionales,
    salario,
    salarioDivisa,
    ingresosMunEUR,
    ingresosNacEUR,
    capitalItems,
    gastosItems,
    debtItems,
    weeklySales,
    iprAlertPct,
    profile,
  ])

  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true
      return
    }
    if (skipNextSave.current) {
      skipNextSave.current = false
      return
    }
    const t = window.setTimeout(() => savePersistedState(snapshot()), 300)
    return () => window.clearTimeout(t)
  }, [snapshot])

  const applyRates = useCallback(
    (source: RatesSource = 'manual') => {
      const next: Rates = {
        bcv: draftRates.bcv > 0 ? draftRates.bcv : rates.bcv,
        eur: draftRates.eur > 0 ? draftRates.eur : rates.eur,
      }
      setRates(next)
      setDraftRates(next)
      setRatesSource(source)
      setLastUpdate(formatTimestamp(new Date()))
    },
    [draftRates, rates],
  )

  const refreshFxHistoryCache = useCallback(async () => {
    const today = localIsoDate()
    let cached = loadFxHistoryCache()
    if (!cached || cached.fetchedAt !== today) {
      try {
        const fresh = await fetchFxHistory()
        if (fresh.usdOficial.length > 0) {
          cached = {
            fetchedAt: today,
            usdOficial: fresh.usdOficial,
            eurOficial: fresh.eurOficial,
          }
          saveFxHistoryCache(cached)
        }
      } catch {
        // keep last cache; pressure will fall back to IPR if needed
      }
    }
    if (cached) setFxCache(cached)
  }, [])

  const refreshRatesFromBcv = useCallback(async () => {
    setBcvStatus('loading')
    setBcvError(null)
    try {
      const parsed = await fetchBcvRates()
      setRates(parsed.rates)
      setDraftRates(parsed.rates)
      setRatesSource('bcv')
      const label = parsed.effectiveDate
        ? `BCV ${parsed.effectiveDate} · ${formatTimestamp(new Date())}`
        : formatTimestamp(new Date())
      setLastUpdate(label)
      setBcvStatus('ok')
    } catch {
      setBcvStatus('error')
      setBcvError('No se pudo obtener la tasa. Usa el valor manual o reintenta.')
    }
    void refreshFxHistoryCache()
  }, [refreshFxHistoryCache])

  useEffect(() => {
    void refreshRatesFromBcv()
  }, [refreshRatesFromBcv])

  function resetScenario() {
    const fresh = defaultPersistedState(formatTimestamp(new Date()))
    const keepProfile = profile
    clearPersistedState()
    skipNextSave.current = true
    setRates(fresh.rates)
    setDraftRates(fresh.draftRates)
    setLastUpdate(fresh.lastUpdate)
    setRatesSource('manual')
    setBcvStatus('idle')
    setBcvError(null)
    setLocation({ estado: keepProfile.estado || fresh.location.estado, ciudad: keepProfile.ciudad || fresh.location.ciudad })
    setProducts(fresh.products)
    setReinvPct(fresh.reinvPct)
    setDist(fresh.dist)
    setDistModeState(fresh.distMode)
    setDistManual(fresh.distManual)
    setParafiscales(fresh.parafiscales)
    setMunicipales(fresh.municipales)
    setNacionales(fresh.nacionales)
    setSalario(fresh.salario)
    setSalarioDivisa(fresh.salarioDivisa)
    setIngresosMunEUR(fresh.ingresosMunEUR)
    setIngresosNacEUR(fresh.ingresosNacEUR)
    setCapitalItems(fresh.capitalItems)
    setGastosItems(fresh.gastosItems)
    setDebtItems(fresh.debtItems)
    setWeeklySales(fresh.weeklySales)
    setIprAlertPct(fresh.iprAlertPct)
    setProfile(keepProfile)
  }

  function completeOnboarding(next: BusinessProfile) {
    const safe: BusinessProfile = { ...defaultBusinessProfile(), ...next, complete: true }
    setProfile(safe)
    setLocation({ estado: safe.estado, ciudad: safe.ciudad })
    setDistMode(safe.monthFocus)
    if (safe.hasDebt === false) setDebtItems([])
    if (safe.hasFormalEmployees === false) {
      setSalario(0)
      setSalarioDivisa('bs')
    }
    setProducts((prev) => {
      if (prev.length > 0) return prev
      return [
        {
          id: uid('p'),
          desc:
            safe.model === 'servicio'
              ? 'Servicio principal'
              : safe.model === 'mixto'
                ? 'Producto / servicio principal'
                : 'Producto principal',
          cant: 1,
          costoUSD: 1,
          margen: 30,
          pvRef: 0,
          pvDivisa: 'usd',
        },
      ]
    })
    setGastosItems((prev) =>
      prev.map((item) =>
        item.id === 'g1' && safe.site === 'digital'
          ? { ...item, desc: 'Espacio digital / herramientas', monto: item.monto }
          : item,
      ),
    )
  }

  function fillTaxBaseFromSales() {
    const eurBase = salesToEurBase(financial.venBs, rates.eur)
    setIngresosMunEUR(eurBase)
    setIngresosNacEUR(eurBase)
  }

  function addProduct() {
    setProducts((prev) => [
      ...prev,
      {
        id: uid('p'),
        desc: 'Nuevo producto',
        cant: 1,
        costoUSD: 1,
        margen: 30,
        pvRef: 0,
        pvDivisa: 'usd',
      },
    ])
  }

  function updateProduct(id: string, patch: Partial<Product>) {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  function removeProduct(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  function setDistValue(key: DistKey, value: number) {
    setDistManual(true)
    setDist((prev) => ({ ...prev, [key]: value }))
  }

  function applySuggestedDist(mode = distMode) {
    const suggestion = suggestDistribution({
      venBs: financial.venBs,
      gasTotal: global.gasTotal,
      paraTotal: taxes.paraTotal,
      munTotal: taxes.munTotal,
      nacTotal: taxes.nacTotal,
      cuotaDeudas: global.cuotaDeudas,
      mode,
    })
    setDist(suggestion.dist)
    setDistManual(false)
    const nextReinv = reinvPctFromPlan(
      financial.venBs,
      financial.ganBs,
      suggestion.dist.reinv,
    )
    if (nextReinv !== null) setReinvPct(nextReinv)
    return suggestion
  }

  function setDistMode(mode: DistMode) {
    setDistModeState(mode)
    applySuggestedDist(mode)
  }

  function updateDebtItem(id: string, patch: Partial<DebtItem>) {
    setDebtItems((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)))
  }

  function removeDebtItem(id: string) {
    setDebtItems((prev) => prev.filter((d) => d.id !== id))
  }

  function addDebtItem() {
    setDebtItems((prev) => [
      ...prev,
      {
        id: uid('d'),
        desc: 'Nueva deuda',
        saldo: 0,
        cuotaMensual: 0,
      },
    ])
  }

  function updateTax(
    group: 'para' | 'mun' | 'nac',
    key: string,
    patch: Partial<TaxItem>,
  ) {
    if (group === 'para') setParafiscales((prev) => patchTax(prev, key, patch))
    if (group === 'mun') setMunicipales((prev) => patchTax(prev, key, patch))
    if (group === 'nac') setNacionales((prev) => patchTax(prev, key, patch))
  }

  function updateMoneyItem(
    kind: 'capital' | 'gastos',
    id: string,
    patch: Partial<MoneyItem>,
  ) {
    const setter = kind === 'capital' ? setCapitalItems : setGastosItems
    setter((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  function removeMoneyItem(kind: 'capital' | 'gastos', id: string) {
    const setter = kind === 'capital' ? setCapitalItems : setGastosItems
    setter((prev) => prev.filter((item) => item.id !== id))
  }

  function addMoneyItem(kind: 'capital' | 'gastos') {
    const setter = kind === 'capital' ? setCapitalItems : setGastosItems
    setter((prev) => [
      ...prev,
      {
        id: uid(kind === 'capital' ? 'c' : 'g'),
        desc: kind === 'capital' ? 'Nuevo ítem' : 'Nuevo gasto',
        monto: 0,
      },
    ])
  }

  function syncSalesBsFromLines(row: WeeklySales): WeeklySales {
    const lines = row.lines ?? []
    if (lines.length === 0) return { ...row, lines }
    return { ...row, lines, salesBs: weekSalesBsFromLines(lines) }
  }

  function adjustStock(productId: string, delta: number): boolean {
    let ok = false
    setProducts((prev) => {
      const product = prev.find((p) => p.id === productId)
      if (!product) return prev
      if (delta >= 0) {
        ok = true
        return prev.map((p) =>
          p.id === productId ? { ...p, cant: (p.cant || 0) + delta } : p,
        )
      }
      const need = -delta
      if (availableStock(product.cant) < need) return prev
      ok = true
      return prev.map((p) =>
        p.id === productId ? { ...p, cant: availableStock(p.cant) - need } : p,
      )
    })
    return ok
  }

  function addWeeklySale(partial?: Partial<WeeklySales>) {
    const start = partial?.weekStart || weekStartFromDate(new Date())
    const lines = partial?.lines ?? []
    const row: WeeklySales = {
      id: uid('w'),
      weekStart: start,
      weekEnd: partial?.weekEnd || weekEndFromStart(start),
      salesBs: partial?.salesBs ?? 0,
      salesUsd: partial?.salesUsd ?? 0,
      rateUsdStart: partial?.rateUsdStart ?? rates.bcv,
      rateUsdEnd: partial?.rateUsdEnd ?? rates.bcv,
      rateEurStart: partial?.rateEurStart ?? rates.eur,
      rateEurEnd: partial?.rateEurEnd ?? rates.eur,
      notes: partial?.notes ?? '',
      lines,
    }
    setWeeklySales((prev) => [...prev, syncSalesBsFromLines(row)])
  }

  function updateWeeklySale(id: string, patch: Partial<WeeklySales>) {
    setWeeklySales((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row
        const next = { ...row, ...patch, lines: patch.lines ?? row.lines ?? [] }
        if (patch.weekStart && !patch.weekEnd) {
          next.weekEnd = weekEndFromStart(patch.weekStart)
        }
        if (next.lines.length > 0) return syncSalesBsFromLines(next)
        return next
      }),
    )
  }

  function removeWeeklySale(id: string) {
    const week = weeklySales.find((r) => r.id === id)
    for (const line of week?.lines ?? []) {
      if (line.productId && line.qty > 0) adjustStock(line.productId, line.qty)
    }
    setWeeklySales((prev) => prev.filter((r) => r.id !== id))
  }

  function addWeeklySaleLine(weekId: string, productId: string) {
    const product = products.find((p) => p.id === productId)
    if (!product) return
    if (!adjustStock(product.id, -1)) return
    const computed = computeProductRow(product, rates, quoteCtx)
    setWeeklySales((prev) =>
      prev.map((row) => {
        if (row.id !== weekId) return row
        const line: WeeklySaleLine = {
          id: uid('wl'),
          productId: product.id,
          desc: product.desc,
          costoUSD: product.costoUSD,
          qty: 1,
          unitPriceBs: computed.ppubBs,
          saleDate: row.weekStart,
        }
        return syncSalesBsFromLines({
          ...row,
          lines: [...(row.lines ?? []), line],
        })
      }),
    )
  }

  function addDailySaleLine(input: {
    date?: string
    productId: string
    qty: number
    unitPriceBs?: number
  }): boolean {
    const product = products.find((p) => p.id === input.productId)
    if (!product) return false
    const saleDate = input.date || todayIsoDate()
    const computed = computeProductRow(product, rates, quoteCtx)
    const unitPriceBs = input.unitPriceBs ?? computed.ppubBs
    const qty = input.qty > 0 ? input.qty : 1
    if (!adjustStock(product.id, -qty)) return false

    setWeeklySales((prev) => {
      let week = findWeekForDate(prev, saleDate)
      let rows = prev
      if (!week) {
        const [y, mo, d] = saleDate.split('-').map(Number)
        const start = weekStartFromDate(new Date(y, mo - 1, d))
        week = {
          id: uid('w'),
          weekStart: start,
          weekEnd: weekEndFromStart(start),
          salesBs: 0,
          salesUsd: 0,
          rateUsdStart: rates.bcv,
          rateUsdEnd: rates.bcv,
          rateEurStart: rates.eur,
          rateEurEnd: rates.eur,
          notes: '',
          lines: [],
        }
        rows = [...prev, week]
      }

      const line: WeeklySaleLine = {
        id: uid('wl'),
        productId: product.id,
        desc: product.desc,
        costoUSD: product.costoUSD,
        qty,
        unitPriceBs,
        saleDate,
      }

      return rows.map((row) => {
        if (row.id !== week!.id) return row
        return syncSalesBsFromLines({
          ...row,
          lines: [...(row.lines ?? []), line],
        })
      })
    })
    return true
  }

  function updateWeeklySaleLine(
    weekId: string,
    lineId: string,
    patch: Partial<Pick<WeeklySaleLine, 'qty' | 'unitPriceBs' | 'desc' | 'saleDate'>>,
  ) {
    const week = weeklySales.find((r) => r.id === weekId)
    const line = week?.lines?.find((l) => l.id === lineId)
    if (!line) return
    if (patch.qty != null && Number.isFinite(patch.qty)) {
      const nextQty = Math.max(0, patch.qty)
      const delta = line.qty - nextQty
      if (delta !== 0 && !adjustStock(line.productId, delta)) return
      patch = { ...patch, qty: nextQty }
    }
    setWeeklySales((prev) =>
      prev.map((row) => {
        if (row.id !== weekId) return row
        const lines = (row.lines ?? []).map((item) =>
          item.id === lineId ? { ...item, ...patch } : item,
        )
        return syncSalesBsFromLines({ ...row, lines })
      }),
    )
  }

  function removeWeeklySaleLine(weekId: string, lineId: string) {
    const week = weeklySales.find((r) => r.id === weekId)
    const line = week?.lines?.find((l) => l.id === lineId)
    if (line?.productId && line.qty > 0) adjustStock(line.productId, line.qty)
    setWeeklySales((prev) =>
      prev.map((row) => {
        if (row.id !== weekId) return row
        const lines = (row.lines ?? []).filter((item) => item.id !== lineId)
        const next = { ...row, lines }
        if (lines.length === 0) return next
        return syncSalesBsFromLines(next)
      }),
    )
  }

  function fillWeeklyRatesFromCurrent(id: string, which: 'start' | 'end' | 'both') {
    const patch: Partial<WeeklySales> = {}
    if (which === 'start' || which === 'both') {
      patch.rateUsdStart = rates.bcv
      patch.rateEurStart = rates.eur
    }
    if (which === 'end' || which === 'both') {
      patch.rateUsdEnd = rates.bcv
      patch.rateEurEnd = rates.eur
    }
    updateWeeklySale(id, patch)
  }

  return {
    rates,
    draftRates,
    setDraftRates,
    applyRates: () => applyRates('manual'),
    refreshRatesFromBcv,
    bcvStatus,
    bcvError,
    ratesSource,
    lastUpdate,
    location,
    setLocation,
    profile,
    setProfile,
    completeOnboarding,
    plantStage: derivePlantStage(profile),
    plantLeaves: derivePlantLeaves(profile),
    plantQuickLinks: deriveQuickLinks(profile),
    products,
    addProduct,
    updateProduct,
    removeProduct,
    reinvPct,
    setReinvPct,
    dist,
    setDistValue,
    distSum,
    distMode,
    setDistMode,
    distManual,
    distSuggestion,
    applySuggestedDist,
    parafiscales,
    municipales,
    nacionales,
    updateTax,
    salario,
    setSalario,
    salarioDivisa,
    setSalarioDivisa,
    salarioBs,
    ingresosMunEUR,
    setIngresosMunEUR,
    ingresosNacEUR,
    setIngresosNacEUR,
    fillTaxBaseFromSales,
    capitalItems,
    gastosItems,
    updateMoneyItem,
    removeMoneyItem,
    addMoneyItem,
    debtItems,
    addDebtItem,
    updateDebtItem,
    removeDebtItem,
    weeklySales,
    weeklySalesSummary,
    iprAlertPct,
    setIprAlertPct,
    quoteCtx,
    pressurePct,
    addWeeklySale,
    updateWeeklySale,
    removeWeeklySale,
    addWeeklySaleLine,
    addDailySaleLine,
    updateWeeklySaleLine,
    removeWeeklySaleLine,
    fillWeeklyRatesFromCurrent,
    resetScenario,
    financial,
    taxes,
    global,
    monthReal,
  }
}

export type CalculatorApi = ReturnType<typeof useCalculator>

export type ProductField = keyof Product
export type { PriceCurrency, Currency }
