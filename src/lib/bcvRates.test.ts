import { describe, expect, it } from 'vitest'
import { parseBcvRates, parseDolarApiPair } from './bcvRates'

describe('parseBcvRates', () => {
  it('mapea USD y EUR a rates.bcv / rates.eur', () => {
    const parsed = parseBcvRates({
      USD: 50.12,
      EUR: 55.4,
      effective_date: '2026-08-04',
      updated_at: '2026-08-04T16:00:00Z',
    })
    expect(parsed.rates).toEqual({ bcv: 50.12, eur: 55.4 })
    expect(parsed.effectiveDate).toBe('2026-08-04')
    expect(parsed.source).toBe('bcv.today')
  })

  it('acepta strings numéricos', () => {
    const parsed = parseBcvRates({ USD: '40.5', EUR: '44.2' })
    expect(parsed.rates.bcv).toBe(40.5)
    expect(parsed.rates.eur).toBe(44.2)
  })

  it('rechaza USD o EUR ausentes o ≤ 0', () => {
    expect(() => parseBcvRates({ USD: 40, EUR: 0 })).toThrow()
    expect(() => parseBcvRates({ USD: -1, EUR: 44 })).toThrow()
    expect(() => parseBcvRates({ USD: 40 })).toThrow()
    expect(() => parseBcvRates({})).toThrow()
  })
})

describe('parseDolarApiPair', () => {
  it('usa promedio oficial USD y EUR (valores BCV del día)', () => {
    const parsed = parseDolarApiPair(
      {
        moneda: 'USD',
        fuente: 'oficial',
        promedio: 752.0943,
        fechaActualizacion: '2026-08-04T00:00:00-04:00',
      },
      {
        moneda: 'EUR',
        fuente: 'oficial',
        promedio: 865.17919894,
        fechaActualizacion: '2026-08-04T00:00:00-04:00',
      },
    )
    expect(parsed.rates.bcv).toBe(752.0943)
    expect(parsed.rates.eur).toBe(865.17919894)
    expect(parsed.effectiveDate).toBe('2026-08-04')
    expect(parsed.source).toBe('dolarapi')
  })

  it('rechaza promedios inválidos', () => {
    expect(() =>
      parseDolarApiPair({ promedio: 0 }, { promedio: 100 }),
    ).toThrow()
  })
})
