import type { DistKey, MoneyItem, Product, TaxItem } from '../types/calculator'

export const DIST_KEYS: DistKey[] = [
  'reinv',
  'inv',
  'imp',
  'para',
  'suel',
  'deuda',
  'util',
]

export const DIST_LABELS: Record<DistKey, string> = {
  reinv: 'Reinversión',
  inv: 'Pago a inversores',
  imp: 'Impuestos (ISLR/IVA)',
  para: 'Deberes parafiscales',
  suel: 'Sueldos / nómina',
  deuda: 'Deudas (cuotas)',
  util: 'Utilidad neta',
}

export const DIST_COLORS: Record<DistKey, string> = {
  reinv: '#2E7D52',
  inv: '#2B5EA7',
  imp: '#B53535',
  para: '#B87A1A',
  suel: '#534AB7',
  deuda: '#8B4513',
  util: '#0F6E56',
}

/** Suma 100; deuda en 0 hasta que el motor o el usuario la activen. */
export const DEFAULT_DIST: Record<DistKey, number> = {
  reinv: 20,
  inv: 12,
  imp: 16,
  para: 9,
  suel: 23,
  deuda: 0,
  util: 20,
}

export const DEFAULT_PRODUCTS: Product[] = [
  { id: 'p1', desc: 'Producto A', cant: 10, costoUSD: 5.0, margen: 40, pvRef: 0, pvDivisa: 'usd' },
  { id: 'p2', desc: 'Producto B', cant: 25, costoUSD: 2.5, margen: 35, pvRef: 0, pvDivisa: 'usd' },
  { id: 'p3', desc: 'Producto C', cant: 5, costoUSD: 12.0, margen: 45, pvRef: 0, pvDivisa: 'usd' },
]

export const DEFAULT_PARAFISCALES: TaxItem[] = [
  {
    key: 'ivss',
    nombre: 'IVSS — Seguro Social Obligatorio',
    desc: 'Cobertura salud, vejez, invalidez',
    rate: 11,
    base: 'salary',
    employer: true,
    worker: false,
    active: true,
  },
  {
    key: 'ivss_w',
    nombre: 'IVSS — Aporte trabajador',
    desc: 'Retenido al empleado',
    rate: 4,
    base: 'salary',
    employer: false,
    worker: true,
    active: true,
  },
  {
    key: 'faov',
    nombre: 'FAOV — Fondo Ahorro Vivienda',
    desc: 'Empleador 2%, trabajador 1%',
    rate: 2,
    base: 'salary',
    employer: true,
    worker: false,
    active: true,
  },
  {
    key: 'faov_w',
    nombre: 'FAOV — Aporte trabajador',
    desc: 'Retenido al empleado',
    rate: 1,
    base: 'salary',
    employer: false,
    worker: true,
    active: true,
  },
  {
    key: 'inces',
    nombre: 'INCES — Capacitación',
    desc: '2% salarios + 0.5% utilidades',
    rate: 2,
    base: 'salary',
    employer: true,
    worker: false,
    active: true,
  },
  {
    key: 'rpe',
    nombre: 'RPE — Régimen Prestacional Empleo',
    desc: 'Empleador 2%, trabajador 0.25%',
    rate: 2,
    base: 'salary',
    employer: true,
    worker: false,
    active: true,
  },
  {
    key: 'rpe_w',
    nombre: 'RPE — Aporte trabajador',
    desc: 'Retenido al empleado',
    rate: 0.25,
    base: 'salary',
    employer: false,
    worker: true,
    active: true,
  },
]

export const DEFAULT_MUNICIPALES: TaxItem[] = [
  {
    key: 'isae',
    nombre: 'ISAE — Impuesto Actividades Económicas',
    desc: '% sobre ingresos brutos en EUR',
    rate: 1.5,
    base: 'ingresos_mun_eur',
    active: true,
  },
  {
    key: 'pub',
    nombre: 'Publicidad y Propaganda Comercial',
    desc: 'Avisos visibles, vallas, fachada (% EUR)',
    rate: 0.5,
    base: 'ingresos_mun_eur',
    active: true,
  },
  {
    key: 'aseo',
    nombre: 'Aseo Urbano (tasa comercial)',
    desc: 'Recolección de desechos municipio (% EUR)',
    rate: 0.2,
    base: 'ingresos_mun_eur',
    active: true,
  },
  {
    key: 'lic',
    nombre: 'Licencia Actividades Económicas',
    desc: 'Pago mensual (ref. en EUR)',
    rate: 0,
    base: 'fixed_eur',
    fixedEur: 20,
    active: true,
  },
]

export const DEFAULT_NACIONALES: TaxItem[] = [
  {
    key: 'iva',
    nombre: 'IVA — Impuesto al Valor Agregado',
    desc: '16% sobre ingresos brutos en EUR, declaración mensual',
    rate: 16,
    base: 'ingresos_nac_eur',
    active: true,
  },
  {
    key: 'islr',
    nombre: 'ISLR — Impuesto Sobre la Renta',
    desc: 'Estimado mensual sobre ganancias netas (base EUR)',
    rate: 1.5,
    base: 'ingresos_nac_eur',
    active: true,
  },
  {
    key: 'igtf',
    nombre: 'IGTF — Grandes Transacciones Fin.',
    desc: 'Aplica a pagos en divisas sin intermediación (base EUR)',
    rate: 3,
    base: 'ingresos_nac_eur',
    active: false,
  },
]

export const DEFAULT_CAPITAL: MoneyItem[] = [
  { id: 'c1', desc: 'Inventario inicial', monto: 0 },
  { id: 'c2', desc: 'Mobiliario y equipos', monto: 0 },
  { id: 'c3', desc: 'Registro mercantil', monto: 0 },
  { id: 'c4', desc: 'Licencia municipal', monto: 0 },
]

export const DEFAULT_GASTOS: MoneyItem[] = [
  { id: 'g1', desc: 'Alquiler del local', monto: 0 },
  { id: 'g2', desc: 'Servicios (luz, agua, internet)', monto: 0 },
  { id: 'g3', desc: 'Nómina total mensual', monto: 0 },
  { id: 'g4', desc: 'Transporte / logística', monto: 0 },
]
