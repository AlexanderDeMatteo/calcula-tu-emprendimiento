import { describe, expect, it } from 'vitest'
import {
  addCalendarDays,
  parseIsoDay,
  parseOficialHistory,
  pressurePctOverDays,
  resolvePressurePct,
} from './fxPressure'

describe('parseOficialHistory', () => {
  it('filtra paralelo y deja un punto por día', () => {
    const series = parseOficialHistory([
      { fuente: 'paralelo', promedio: 900, fecha: '2026-07-01' },
      { fuente: 'oficial', promedio: 750, fecha: '2026-07-01' },
      { fuente: 'oficial', promedio: 760, fecha: '2026-07-02' },
      { fuente: 'oficial', promedio: 762, fecha: '2026-07-02T16:00:00-04:00' },
    ])
    expect(series).toEqual([
      { fecha: '2026-07-01', promedio: 750, fuente: 'oficial' },
      { fecha: '2026-07-02', promedio: 762, fuente: 'oficial' },
    ])
  })
})

describe('pressurePctOverDays', () => {
  it('usa el último punto ≤ hace N días vs tasa de hoy', () => {
    const series = parseOficialHistory([
      { fuente: 'oficial', promedio: 100, fecha: '2026-06-20' },
      { fuente: 'oficial', promedio: 110, fecha: '2026-07-20' },
    ])
    expect(addCalendarDays('2026-07-20', -30)).toBe('2026-06-20')
    expect(pressurePctOverDays(series, 30, 112)).toBeCloseTo(12, 5)
  })

  it('devuelve null si no hay serie', () => {
    expect(pressurePctOverDays([], 30, 100)).toBeNull()
  })
})

describe('parseIsoDay', () => {
  it('acepta YYYY-MM-DD y YYYY/MM/DD', () => {
    expect(parseIsoDay('2026/01/02')).toBe('2026-01-02')
    expect(parseIsoDay('2026-01-02T00:00:00-04:00')).toBe('2026-01-02')
  })
})

describe('resolvePressurePct', () => {
  it('prioriza histórico positivo y cae a IPR', () => {
    expect(resolvePressurePct(2.1, 5)).toBeCloseTo(2.1, 5)
    expect(resolvePressurePct(null, 5)).toBe(5)
    expect(resolvePressurePct(-1, 5)).toBe(5)
    expect(resolvePressurePct(null, null)).toBeNull()
  })
})
