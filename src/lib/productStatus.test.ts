import { describe, expect, it } from 'vitest'
import {
  LEGAL_MARKUP_CAP_PCT,
  productStatusFlags,
  realMarkupPct,
  replacementFloorBs,
  resolveInflationPct,
  scenarioProfitStatus,
  monthProfitStatus,
} from './productStatus'

describe('resolveInflationPct', () => {
  it('usa el override si es > 0', () => {
    expect(resolveInflationPct(8, 5)).toBe(8)
  })

  it('override 0 desactiva el piso', () => {
    expect(resolveInflationPct(0, 5)).toBeNull()
  })

  it('sin override usa IPR positivo', () => {
    expect(resolveInflationPct(null, 4.2)).toBe(4.2)
    expect(resolveInflationPct(null, 0)).toBeNull()
    expect(resolveInflationPct(null, null)).toBeNull()
  })
})

describe('replacementFloorBs', () => {
  it('sube el costo por la inflación', () => {
    expect(replacementFloorBs(100, 10)).toBeCloseTo(110, 8)
  })
})

describe('productStatusFlags', () => {
  const base = { markupPct: 25, ppubBs: 125, costoBs: 100, inflationPct: 5 as number | null }

  it('está en rango si hay holgura comercial sobre reposición', () => {
    const flags = productStatusFlags(base)
    expect(realMarkupPct(25, 5)).toBe(20)
    expect(flags).toHaveLength(1)
    expect(flags[0].kind).toBe('ok')
  })

  it('solo reposición si el markup apenas cubre la inflación', () => {
    const flags = productStatusFlags({
      markupPct: 6.5,
      ppubBs: 106.5,
      costoBs: 100,
      inflationPct: 6.5,
    })
    expect(flags[0].kind).toBe('tight')
    expect(flags[0].label).toBe('Solo reposición')
  })

  it('ajustada si hay poca holgura sobre reposición', () => {
    const flags = productStatusFlags({
      markupPct: 12,
      ppubBs: 112,
      costoBs: 100,
      inflationPct: 6,
    })
    expect(flags[0].kind).toBe('thin')
  })

  it('avisa tope legal sobre 30% sin bloquear', () => {
    const flags = productStatusFlags({ ...base, markupPct: 40, ppubBs: 140 })
    expect(flags.some((f) => f.kind === 'legal')).toBe(true)
    expect(LEGAL_MARKUP_CAP_PCT).toBe(30)
  })

  it('30% exacto está en rango, no dispara tope legal', () => {
    const flags = productStatusFlags({ ...base, markupPct: 30, ppubBs: 130 })
    expect(flags.every((f) => f.kind !== 'legal')).toBe(true)
    expect(flags[0].kind).toBe('ok')
    expect(flags[0].label).toBe('En rango')
  })

  it('30.04% redondeado a 30.0% sigue en rango', () => {
    const flags = productStatusFlags({ ...base, markupPct: 30.04, ppubBs: 130.04 })
    expect(flags[0].kind).toBe('ok')
  })

  it('30.1% ya es sobre el tope', () => {
    const flags = productStatusFlags({ ...base, markupPct: 30.1, ppubBs: 130.1 })
    expect(flags.some((f) => f.kind === 'legal')).toBe(true)
  })

  it('avisa si el precio no cubre inflación/reposición', () => {
    const flags = productStatusFlags({
      markupPct: 2,
      ppubBs: 102,
      costoBs: 100,
      inflationPct: 10,
    })
    expect(flags.some((f) => f.kind === 'inflation')).toBe(true)
  })

  it('puede mostrar ambos avisos', () => {
    const flags = productStatusFlags({
      markupPct: 40,
      ppubBs: 140,
      costoBs: 100,
      inflationPct: 50,
    })
    expect(flags.map((f) => f.kind).sort()).toEqual(['inflation', 'legal'])
  })
})

describe('scenarioProfitStatus', () => {
  it('rentable si queda caja tras obligaciones', () => {
    expect(scenarioProfitStatus(477, 41278).label).toBe('Rentable')
    expect(scenarioProfitStatus(477, 41278).kind).toBe('ok')
  })

  it('revisar si no hay utilidad', () => {
    expect(scenarioProfitStatus(0, 1000).kind).toBe('bad')
    expect(scenarioProfitStatus(-10, 1000).label).toBe('Revisar')
  })
})

describe('monthProfitStatus', () => {
  it('sin ventas reales', () => {
    expect(monthProfitStatus(0, false).kind).toBe('empty')
    expect(monthProfitStatus(0, false).label).toBe('Sin ventas reales')
  })

  it('rentable con ventas y utilidad positiva', () => {
    expect(monthProfitStatus(500, true).kind).toBe('ok')
  })

  it('revisar con ventas pero utilidad negativa', () => {
    expect(monthProfitStatus(-100, true).kind).toBe('bad')
  })
})
