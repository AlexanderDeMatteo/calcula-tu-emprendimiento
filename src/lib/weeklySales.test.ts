import { describe, expect, it } from 'vitest'
import {
  computeWeeklySalesRow,
  lineContribBs,
  lineRevenueBs,
  pctChange,
  rankWeeklyProducts,
  summarizeWeeklySales,
  topByContrib,
  topByUnits,
  weekEndFromStart,
  weekSalesBsFromLines,
  weekStartFromDate,
} from './weeklySales'
import type { WeeklySaleLine, WeeklySales } from '../types/calculator'

const lineA: WeeklySaleLine = {
  id: 'l1',
  productId: 'p1',
  desc: 'Producto A',
  costoUSD: 5,
  qty: 10,
  unitPriceBs: 8000,
}

const lineB: WeeklySaleLine = {
  id: 'l2',
  productId: 'p2',
  desc: 'Producto B',
  costoUSD: 2.5,
  qty: 25,
  unitPriceBs: 3000,
}

const base: WeeklySales = {
  id: 'w1',
  weekStart: '2026-08-03',
  weekEnd: '2026-08-09',
  salesBs: 752090,
  salesUsd: 0,
  rateUsdStart: 700,
  rateUsdEnd: 752.09,
  rateEurStart: 800,
  rateEurEnd: 865.18,
  notes: '',
  lines: [],
}

describe('pctChange', () => {
  it('calcula variación porcentual', () => {
    expect(pctChange(100, 110)).toBeCloseTo(10, 5)
    expect(pctChange(0, 10)).toBeNull()
  })
})

describe('computeWeeklySalesRow', () => {
  it('IPR es el máximo entre ΔUSD y ΔEUR y dispara alerta', () => {
    const c = computeWeeklySalesRow(base, 5)
    expect(c.deltaUsdPct).toBeCloseTo(((752.09 - 700) / 700) * 100, 5)
    expect(c.deltaEurPct).toBeCloseTo(((865.18 - 800) / 800) * 100, 5)
    expect(c.ipr).toBe(Math.max(c.deltaUsdPct!, c.deltaEurPct!))
    expect(c.alert).toBe(true)
    expect(c.salesUsdEq).toBeCloseTo(752090 / 752.09, 5)
  })

  it('no alerta bajo umbral', () => {
    const c = computeWeeklySalesRow(
      { ...base, rateUsdEnd: 710, rateEurEnd: 810 },
      5,
    )
    expect(c.alert).toBe(false)
  })
})

describe('week helpers', () => {
  it('weekEnd es +6 días', () => {
    expect(weekEndFromStart('2026-08-03')).toBe('2026-08-09')
  })

  it('weekStartFromDate devuelve formato ISO', () => {
    expect(weekStartFromDate(new Date(2026, 7, 5))).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('summarizeWeeklySales', () => {
  it('ordena y suma ventas', () => {
    const s = summarizeWeeklySales([
      { ...base, id: 'b', weekStart: '2026-08-10', weekEnd: '2026-08-16', salesBs: 100 },
      { ...base, id: 'a', weekStart: '2026-08-03', salesBs: 50 },
    ])
    expect(s.sorted[0].id).toBe('a')
    expect(s.totalSalesBs).toBe(150)
    expect(s.hasAnyLines).toBe(false)
  })

  it('semana sin lines no rompe', () => {
    const legacy = { ...base } as WeeklySales & { lines?: WeeklySaleLine[] }
    delete (legacy as { lines?: WeeklySaleLine[] }).lines
    const s = summarizeWeeklySales([legacy as WeeklySales])
    expect(s.computed[0].hasLines).toBe(false)
    expect(s.computed[0].contribBs).toBeNull()
  })
})

describe('líneas de producto', () => {
  it('suma ingresos de líneas', () => {
    expect(weekSalesBsFromLines([lineA, lineB])).toBe(10 * 8000 + 25 * 3000)
  })

  it('contribución usa tasa fin de semana', () => {
    const rate = 750
    // revenue 80000 - cost 10*5*750 = 37500 → 42500
    expect(lineRevenueBs(lineA)).toBe(80000)
    expect(lineContribBs(lineA, rate)).toBe(80000 - 10 * 5 * 750)
  })

  it('ranking por unidades y contribución', () => {
    const weeks: WeeklySales[] = [
      {
        ...base,
        salesBs: weekSalesBsFromLines([lineA, lineB]),
        lines: [lineA, lineB],
      },
    ]
    const ranks = rankWeeklyProducts(weeks)
    expect(topByUnits(ranks, 1)[0].productId).toBe('p2')
    expect(topByContrib(ranks, 1)[0].productId).toBe('p1')
    const s = summarizeWeeklySales(weeks)
    expect(s.hasAnyLines).toBe(true)
    expect(s.computed[0].hasLines).toBe(true)
    expect(s.topUnits[0].productId).toBe('p2')
  })
})
