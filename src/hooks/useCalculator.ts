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
  clearPersistedState,
  defaultPersistedState,
  loadPersistedState,
  savePersistedState,
  type PersistedState,
} from '../lib/storage'
import {
  summarizeWeeklySales,
  weekEndFromStart,
  weekSalesBsFromLines,
  weekStartFromDate,
} from '../lib/weeklySales'
import type {
  BcvFetchStatus,
  Currency,
  DistKey,
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
  const [parafiscales, setParafiscales] = useState(initial.parafiscales)
  const [municipales, setMunicipales] = useState(initial.municipales)
  const [nacionales, setNacionales] = useState(initial.nacionales)
  const [salario, setSalario] = useState(initial.salario)
  const [salarioDivisa, setSalarioDivisa] = useState<Currency>(initial.salarioDivisa)
  const [ingresosMunEUR, setIngresosMunEUR] = useState(initial.ingresosMunEUR)
  const [ingresosNacEUR, setIngresosNacEUR] = useState(initial.ingresosNacEUR)
  const [capitalItems, setCapitalItems] = useState(initial.capitalItems)
  const [gastosItems, setGastosItems] = useState(initial.gastosItems)
  const [weeklySales, setWeeklySales] = useState<WeeklySales[]>(initial.weeklySales)
  const [iprAlertPct, setIprAlertPct] = useState(initial.iprAlertPct)

  const financial = useMemo(
    () => computeFinancialSummary(products, rates, reinvPct),
    [products, rates, reinvPct],
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
    () => computeGlobal(financial, capitalItems, gastosItems, taxes),
    [financial, capitalItems, gastosItems, taxes],
  )

  const distSum = useMemo(
    () => Object.values(dist).reduce((acc, n) => acc + n, 0),
    [dist],
  )

  const weeklySalesSummary = useMemo(
    () => summarizeWeeklySales(weeklySales, iprAlertPct),
    [weeklySales, iprAlertPct],
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
      parafiscales,
      municipales,
      nacionales,
      salario,
      salarioDivisa,
      ingresosMunEUR,
      ingresosNacEUR,
      capitalItems,
      gastosItems,
      weeklySales,
      iprAlertPct,
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
    parafiscales,
    municipales,
    nacionales,
    salario,
    salarioDivisa,
    ingresosMunEUR,
    ingresosNacEUR,
    capitalItems,
    gastosItems,
    weeklySales,
    iprAlertPct,
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
  }, [])

  useEffect(() => {
    void refreshRatesFromBcv()
  }, [refreshRatesFromBcv])

  function resetScenario() {
    const fresh = defaultPersistedState(formatTimestamp(new Date()))
    clearPersistedState()
    skipNextSave.current = true
    setRates(fresh.rates)
    setDraftRates(fresh.draftRates)
    setLastUpdate(fresh.lastUpdate)
    setRatesSource('manual')
    setBcvStatus('idle')
    setBcvError(null)
    setLocation(fresh.location)
    setProducts(fresh.products)
    setReinvPct(fresh.reinvPct)
    setDist(fresh.dist)
    setParafiscales(fresh.parafiscales)
    setMunicipales(fresh.municipales)
    setNacionales(fresh.nacionales)
    setSalario(fresh.salario)
    setSalarioDivisa(fresh.salarioDivisa)
    setIngresosMunEUR(fresh.ingresosMunEUR)
    setIngresosNacEUR(fresh.ingresosNacEUR)
    setCapitalItems(fresh.capitalItems)
    setGastosItems(fresh.gastosItems)
    setWeeklySales(fresh.weeklySales)
    setIprAlertPct(fresh.iprAlertPct)
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
    setDist((prev) => ({ ...prev, [key]: value }))
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
    setWeeklySales((prev) => prev.filter((r) => r.id !== id))
  }

  function addWeeklySaleLine(weekId: string, productId: string) {
    const product = products.find((p) => p.id === productId)
    if (!product) return
    const computed = computeProductRow(product, rates)
    const line: WeeklySaleLine = {
      id: uid('wl'),
      productId: product.id,
      desc: product.desc,
      costoUSD: product.costoUSD,
      qty: 1,
      unitPriceBs: computed.ppubBs,
    }
    setWeeklySales((prev) =>
      prev.map((row) => {
        if (row.id !== weekId) return row
        return syncSalesBsFromLines({
          ...row,
          lines: [...(row.lines ?? []), line],
        })
      }),
    )
  }

  function updateWeeklySaleLine(
    weekId: string,
    lineId: string,
    patch: Partial<Pick<WeeklySaleLine, 'qty' | 'unitPriceBs' | 'desc'>>,
  ) {
    setWeeklySales((prev) =>
      prev.map((row) => {
        if (row.id !== weekId) return row
        const lines = (row.lines ?? []).map((line) =>
          line.id === lineId ? { ...line, ...patch } : line,
        )
        return syncSalesBsFromLines({ ...row, lines })
      }),
    )
  }

  function removeWeeklySaleLine(weekId: string, lineId: string) {
    setWeeklySales((prev) =>
      prev.map((row) => {
        if (row.id !== weekId) return row
        const lines = (row.lines ?? []).filter((line) => line.id !== lineId)
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
    products,
    addProduct,
    updateProduct,
    removeProduct,
    reinvPct,
    setReinvPct,
    dist,
    setDistValue,
    distSum,
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
    weeklySales,
    weeklySalesSummary,
    iprAlertPct,
    setIprAlertPct,
    addWeeklySale,
    updateWeeklySale,
    removeWeeklySale,
    addWeeklySaleLine,
    updateWeeklySaleLine,
    removeWeeklySaleLine,
    fillWeeklyRatesFromCurrent,
    resetScenario,
    financial,
    taxes,
    global,
  }
}

export type CalculatorApi = ReturnType<typeof useCalculator>

export type ProductField = keyof Product
export type { PriceCurrency, Currency }
