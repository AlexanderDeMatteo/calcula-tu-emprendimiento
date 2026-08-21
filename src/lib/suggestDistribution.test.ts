import { describe, expect, it } from 'vitest'
import {
  reinvPctFromPlan,
  suggestDistribution,
} from './suggestDistribution'
import { DIST_KEYS } from '../data/defaults'

describe('suggestDistribution', () => {
  it('devuelve defaults si no hay ventas', () => {
    const r = suggestDistribution({
      venBs: 0,
      gasTotal: 100,
      paraTotal: 10,
      munTotal: 10,
      nacTotal: 10,
      cuotaDeudas: 50,
      mode: 'crecer',
    })
    const sum = DIST_KEYS.reduce((a, k) => a + r.dist[k], 0)
    expect(sum).toBe(100)
    expect(r.tight).toBe(false)
  })

  it('deriva obligaciones y reparte residual en modo crecer', () => {
    const venBs = 100_000
    const r = suggestDistribution({
      venBs,
      gasTotal: 20_000, // 20%
      paraTotal: 5_000, // 5%
      munTotal: 3_000,
      nacTotal: 2_000, // imp 5%
      cuotaDeudas: 10_000, // 10%
      mode: 'crecer',
    })
    const sum = DIST_KEYS.reduce((a, k) => a + r.dist[k], 0)
    expect(sum).toBe(100)
    expect(r.dist.suel).toBe(20)
    expect(r.dist.para).toBe(5)
    expect(r.dist.imp).toBe(5)
    expect(r.dist.deuda).toBe(10)
    // residual 60 → crecer 70/10/20 → 42, 6, 12
    expect(r.dist.reinv).toBe(42)
    expect(r.dist.inv).toBe(6)
    expect(r.dist.util).toBe(12)
    expect(r.tight).toBe(false)
  })

  it('escala cuando obligaciones > 100% (tight)', () => {
    const r = suggestDistribution({
      venBs: 1000,
      gasTotal: 800,
      paraTotal: 200,
      munTotal: 100,
      nacTotal: 100,
      cuotaDeudas: 200,
      mode: 'sobrevivir',
    })
    expect(r.tight).toBe(true)
    expect(DIST_KEYS.reduce((a, k) => a + r.dist[k], 0)).toBe(100)
    expect(r.dist.reinv + r.dist.inv + r.dist.util).toBe(0)
  })

  it('modo pagar_deuda usa 1.25× cuota', () => {
    const r = suggestDistribution({
      venBs: 100_000,
      gasTotal: 0,
      paraTotal: 0,
      munTotal: 0,
      nacTotal: 0,
      cuotaDeudas: 10_000,
      mode: 'pagar_deuda',
    })
    expect(r.dist.deuda).toBe(13) // 12.5 → round
    expect(r.deudaBsUsed).toBe(12_500)
  })
})

describe('reinvPctFromPlan', () => {
  it('alinea reinversión Apéndice I con bucket del plan', () => {
    // ven 100, reinv dist 20% = 20 Bs; gan 40 → reinvPct = 50
    expect(reinvPctFromPlan(100, 40, 20)).toBe(50)
    expect(reinvPctFromPlan(0, 40, 20)).toBeNull()
  })
})
