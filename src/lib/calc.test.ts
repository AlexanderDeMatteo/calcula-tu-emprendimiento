import { describe, expect, it } from 'vitest'
import {
  computeFinancialSummary,
  computeGlobal,
  computeProductRow,
  computeTaxes,
  salesToEurBase,
} from './calc'
import type { Product, Rates, TaxItem } from '../types/calculator'

const rates: Rates = { bcv: 40.5, eur: 44.2 }

const baseProduct: Product = {
  id: 'p1',
  desc: 'A',
  cant: 10,
  costoUSD: 5,
  margen: 40,
  pvRef: 0,
  pvDivisa: 'usd',
}

describe('computeProductRow', () => {
  it('calcula costo, sugerido y margen efectivo desde margen planificado', () => {
    const row = computeProductRow(baseProduct, rates)
    expect(row.costoBs).toBe(5 * 40.5)
    expect(row.pvSugBs).toBeCloseTo(202.5 * 1.4, 5)
    expect(row.margenEfectivo).toBeCloseTo(40, 5)
  })

  it('usa pvRef USD como override del sugerido', () => {
    const row = computeProductRow({ ...baseProduct, pvRef: 10, pvDivisa: 'usd' }, rates)
    expect(row.ppubBs).toBe(10 * 40.5)
    expect(row.margenEfectivo).toBeCloseTo(((405 - 202.5) / 202.5) * 100, 5)
  })

  it('usa pvRef EUR como override', () => {
    const row = computeProductRow({ ...baseProduct, pvRef: 8, pvDivisa: 'eur' }, rates)
    expect(row.ppubBs).toBe(8 * 44.2)
  })
})

describe('computeFinancialSummary', () => {
  it('suma inventario, ventas y aplica reinversión', () => {
    const fin = computeFinancialSummary([baseProduct], rates, 20)
    const row = computeProductRow(baseProduct, rates)
    expect(fin.invBs).toBeCloseTo(row.costoBs * 10, 5)
    expect(fin.venBs).toBeCloseTo(row.ppubBs * 10, 5)
    expect(fin.ganBs).toBeCloseTo(row.gananciaTotalBs, 5)
    expect(fin.reinvBs).toBeCloseTo(fin.ganBs * 0.2, 5)
    expect(fin.ganNet).toBeCloseTo(fin.ganBs - fin.reinvBs, 5)
  })
})

describe('computeTaxes', () => {
  it('suma solo aportes empleador en parafiscales', () => {
    const items: TaxItem[] = [
      {
        key: 'ivss',
        nombre: 'IVSS',
        desc: '',
        rate: 11,
        base: 'salary',
        active: true,
        employer: true,
      },
      {
        key: 'ivss_w',
        nombre: 'IVSS w',
        desc: '',
        rate: 4,
        base: 'salary',
        active: true,
        employer: false,
        worker: true,
      },
    ]
    const taxes = computeTaxes({
      parafiscales: items,
      municipales: [],
      nacionales: [],
      salarioBs: 1000,
      ingMunEUR: 0,
      ingNacEUR: 0,
      rates,
    })
    expect(taxes.paraTotal).toBe(110)
    expect(taxes.amounts.ivss_w).toBe(40)
  })

  it('calcula municipales e IVA referencial sobre base EUR', () => {
    const municipales: TaxItem[] = [
      {
        key: 'isae',
        nombre: 'ISAE',
        desc: '',
        rate: 1.5,
        base: 'ingresos_mun_eur',
        active: true,
      },
    ]
    const nacionales: TaxItem[] = [
      {
        key: 'iva',
        nombre: 'IVA',
        desc: '',
        rate: 16,
        base: 'ingresos_nac_eur',
        active: true,
      },
    ]
    const taxes = computeTaxes({
      parafiscales: [],
      municipales,
      nacionales,
      salarioBs: 0,
      ingMunEUR: 100,
      ingNacEUR: 100,
      rates,
    })
    const baseBs = 100 * 44.2
    expect(taxes.munTotal).toBeCloseTo((baseBs * 1.5) / 100, 5)
    expect(taxes.nacTotal).toBeCloseTo((baseBs * 16) / 100, 5)
  })
})

describe('computeGlobal', () => {
  it('separa utilidad antes y después de tributos', () => {
    const fin = computeFinancialSummary([baseProduct], rates, 0)
    const global = computeGlobal(
      fin,
      [{ id: 'c1', desc: 'cap', monto: 100 }],
      [{ id: 'g1', desc: 'gas', monto: 50 }],
      { paraTotal: 20, munTotal: 10, nacTotal: 5 },
    )
    expect(global.utilAntesImpuestos).toBeCloseTo(fin.ganNet - 50, 5)
    expect(global.tributosRef).toBe(35)
    expect(global.utilDespuesTributosRef).toBeCloseTo(global.utilAntesImpuestos - 35, 5)
    expect(global.utilNeta).toBe(global.utilAntesImpuestos)
    expect(global.capTotal).toBe(100)
  })

  it('calcula punto de equilibrio sobre ganancia bruta', () => {
    const fin = computeFinancialSummary([baseProduct], rates, 0)
    const global = computeGlobal(fin, [], [{ id: 'g1', desc: 'gas', monto: fin.ganBs / 2 }])
    expect(global.puntoEquilibrioPct).toBeCloseTo(50, 5)
  })
})

describe('salesToEurBase', () => {
  it('convierte ventas Bs a EUR redondeado a 2 decimales', () => {
    expect(salesToEurBase(4420, 44.2)).toBe(100)
    expect(salesToEurBase(0, 44.2)).toBe(0)
    expect(salesToEurBase(100, 0)).toBe(0)
  })
})
