import { describe, expect, it } from 'vitest'
import {
  applyOpeningStock,
  availableStock,
  computeMonthRealProfit,
  computeWeeklySalesRow,
  formatWeekRange,
  groupMonthSaleLines,
  lastSoldUsdByProduct,
  lineContribBs,
  lineRevenueBs,
  listMonthSaleLines,
  pctChange,
  rankWeeklyProducts,
  soldQtyByProduct,
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
  saleDate: '2026-08-05',
}

const lineB: WeeklySaleLine = {
  id: 'l2',
  productId: 'p2',
  desc: 'Producto B',
  costoUSD: 2.5,
  qty: 25,
  unitPriceBs: 3000,
  saleDate: '2026-08-07',
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

  it('última venta en USD usa la semana más reciente con tasa fin', () => {
    const older: WeeklySales = {
      ...base,
      id: 'w0',
      weekStart: '2026-07-27',
      weekEnd: '2026-08-02',
      rateUsdEnd: 700,
      lines: [{ ...lineA, unitPriceBs: 7000 }],
    }
    const newer: WeeklySales = {
      ...base,
      salesBs: weekSalesBsFromLines([lineA]),
      lines: [lineA],
    }
    const map = lastSoldUsdByProduct([newer, older])
    expect(map.p1).toBeCloseTo(8000 / 752.09, 5)
  })
})

describe('computeMonthRealProfit', () => {
  it('sin ventas en el mes devuelve hasSales false', () => {
    const m = computeMonthRealProfit({
      weeks: [],
      gasTotal: 100,
      cuotaDeudas: 50,
      tributosRef: 20,
      refDate: new Date(2026, 7, 15),
    })
    expect(m.hasSales).toBe(false)
    expect(m.utilMes).toBe(0)
    expect(m.lineCount).toBe(0)
  })

  it('calcula utilidad del mes calendario', () => {
    const weeks: WeeklySales[] = [
      {
        ...base,
        salesBs: weekSalesBsFromLines([lineA, lineB]),
        lines: [lineA, lineB],
      },
    ]
    const salesBs = weekSalesBsFromLines([lineA, lineB])
    const contrib = lineContribBs(lineA, 752.09) + lineContribBs(lineB, 752.09)
    const m = computeMonthRealProfit({
      weeks,
      gasTotal: 1000,
      cuotaDeudas: 200,
      tributosRef: 300,
      refDate: new Date(2026, 7, 15),
    })
    expect(m.hasSales).toBe(true)
    expect(m.salesBs).toBeCloseTo(salesBs, 5)
    expect(m.contribBs).toBeCloseTo(contrib, 5)
    expect(m.utilMes).toBeCloseTo(contrib - 1000 - 200 - 300, 5)
    expect(m.lineCount).toBe(2)
  })

  it('ignora líneas de otro mes', () => {
    const otherMonth: WeeklySaleLine = { ...lineA, saleDate: '2026-07-15' }
    const weeks: WeeklySales[] = [
      {
        ...base,
        weekStart: '2026-07-14',
        weekEnd: '2026-07-20',
        lines: [otherMonth],
      },
    ]
    const m = computeMonthRealProfit({
      weeks,
      gasTotal: 0,
      cuotaDeudas: 0,
      tributosRef: 0,
      refDate: new Date(2026, 7, 15),
    })
    expect(m.hasSales).toBe(false)
  })
})

describe('listMonthSaleLines', () => {
  it('filtra y ordena líneas del mes', () => {
    const weeks: WeeklySales[] = [
      {
        ...base,
        salesBs: weekSalesBsFromLines([lineA, lineB]),
        lines: [lineA, lineB],
      },
    ]
    const rows = listMonthSaleLines(weeks, new Date(2026, 7, 15))
    expect(rows).toHaveLength(2)
    expect(rows[0].line.saleDate).toBe('2026-08-07')
    expect(rows[1].line.saleDate).toBe('2026-08-05')
  })
})

describe('groupMonthSaleLines', () => {
  it('agrupa por día descendente', () => {
    const weeks: WeeklySales[] = [
      {
        ...base,
        salesBs: weekSalesBsFromLines([lineA, lineB]),
        lines: [lineA, lineB],
      },
    ]
    const groups = groupMonthSaleLines(listMonthSaleLines(weeks, new Date(2026, 7, 15)))
    expect(groups.map((g) => g.date)).toEqual(['2026-08-07', '2026-08-05'])
    expect(groups[0].rows).toHaveLength(1)
  })
})

describe('formatWeekRange', () => {
  it('muestra rango legible', () => {
    expect(formatWeekRange('2026-08-03', '2026-08-09')).toBe('2026-08-03 – 2026-08-09')
  })
})

describe('kardex stock', () => {
  it('availableStock no es negativo', () => {
    expect(availableStock(10)).toBe(10)
    expect(availableStock(0)).toBe(0)
    expect(availableStock(-3)).toBe(0)
  })

  it('soldQtyByProduct suma líneas', () => {
    const weeks: WeeklySales[] = [
      { ...base, lines: [lineA, lineB] },
      { ...base, id: 'w2', lines: [{ ...lineA, id: 'l3', qty: 2 }] },
    ]
    const map = soldQtyByProduct(weeks)
    expect(map.p1).toBe(12)
    expect(map.p2).toBe(25)
  })

  it('applyOpeningStock resta ventas una vez', () => {
    const products = [
      {
        id: 'p1',
        desc: 'A',
        cant: 10,
        costoUSD: 5,
        margen: 30,
        pvRef: 0,
        pvDivisa: 'usd' as const,
      },
    ]
    const next = applyOpeningStock(products, { p1: 10 })
    expect(next[0].cant).toBe(0)
    expect(applyOpeningStock(next, { p1: 10 })[0].cant).toBe(0)
  })
})
