import { DEFAULT_DIST } from '../data/defaults'
import type { DistKey, DistMode } from '../types/calculator'

export const DIST_MODE_LABELS: Record<DistMode, string> = {
  sobrevivir: 'Sobrevivir',
  crecer: 'Crecer',
  pagar_deuda: 'Pagar deuda',
  dueno: 'Dueño',
}

const RESIDUAL_WEIGHTS: Record<DistMode, { reinv: number; inv: number; util: number }> = {
  sobrevivir: { reinv: 40, inv: 0, util: 60 },
  crecer: { reinv: 70, inv: 10, util: 20 },
  pagar_deuda: { reinv: 25, inv: 0, util: 75 },
  dueno: { reinv: 30, inv: 10, util: 60 },
}

const OBLIG_KEYS = ['imp', 'para', 'suel', 'deuda'] as const

export type SuggestDistributionInput = {
  venBs: number
  gasTotal: number
  paraTotal: number
  munTotal: number
  nacTotal: number
  cuotaDeudas: number
  mode: DistMode
}

export type SuggestDistributionResult = {
  dist: Record<DistKey, number>
  tight: boolean
  obligBs: number
  residualPct: number
  deudaBsUsed: number
}

function pctOfVen(amountBs: number, venBs: number): number {
  if (!(venBs > 0) || !(amountBs > 0)) return 0
  return (amountBs / venBs) * 100
}

function roundDist(raw: Record<DistKey, number>): Record<DistKey, number> {
  const keys = Object.keys(raw) as DistKey[]
  const floored: Record<DistKey, number> = { ...raw }
  let sum = 0
  for (const k of keys) {
    floored[k] = Math.max(0, Math.round(raw[k]))
    sum += floored[k]
  }
  let diff = 100 - sum
  const residualRaw = raw.reinv + raw.inv + raw.util
  const adjustOrder: DistKey[] =
    residualRaw < 0.5
      ? ['suel', 'deuda', 'para', 'imp', 'util', 'reinv', 'inv']
      : ['util', 'reinv', 'inv', 'suel', 'deuda', 'para', 'imp']
  for (const k of adjustOrder) {
    if (diff === 0) break
    const next = floored[k] + diff
    if (next < 0) {
      diff += floored[k]
      floored[k] = 0
    } else {
      floored[k] = next
      diff = 0
    }
  }
  return floored
}

export function suggestDistribution(
  input: SuggestDistributionInput,
): SuggestDistributionResult {
  const { venBs, gasTotal, paraTotal, munTotal, nacTotal, cuotaDeudas, mode } = input

  if (!(venBs > 0)) {
    return {
      dist: { ...DEFAULT_DIST },
      tight: false,
      obligBs: 0,
      residualPct: DEFAULT_DIST.reinv + DEFAULT_DIST.inv + DEFAULT_DIST.util,
      deudaBsUsed: 0,
    }
  }

  const deudaBsUsed =
    mode === 'pagar_deuda' ? Math.min(cuotaDeudas * 1.25, venBs) : Math.max(0, cuotaDeudas)

  let imp = pctOfVen(munTotal + nacTotal, venBs)
  let para = pctOfVen(paraTotal, venBs)
  let suel = pctOfVen(gasTotal, venBs)
  let deuda = pctOfVen(deudaBsUsed, venBs)

  let obligSum = imp + para + suel + deuda
  let tight = false

  if (obligSum > 100) {
    tight = true
    const scale = 100 / obligSum
    imp *= scale
    para *= scale
    suel *= scale
    deuda *= scale
    obligSum = 100
  }

  const residualPct = Math.max(0, 100 - obligSum)
  const weights = RESIDUAL_WEIGHTS[mode]
  const wSum = weights.reinv + weights.inv + weights.util || 1

  const distRaw: Record<DistKey, number> = {
    reinv: (residualPct * weights.reinv) / wSum,
    inv: (residualPct * weights.inv) / wSum,
    imp,
    para,
    suel,
    deuda,
    util: (residualPct * weights.util) / wSum,
  }

  const dist = roundDist(distRaw)
  const obligBs =
    (venBs * (dist.imp + dist.para + dist.suel + dist.deuda)) / 100

  return {
    dist,
    tight,
    obligBs,
    residualPct: dist.reinv + dist.inv + dist.util,
    deudaBsUsed,
  }
}

/** Sync Apéndice I reinversión % so Bs ≈ plan bucket on ventas. */
export function reinvPctFromPlan(
  venBs: number,
  ganBs: number,
  reinvDistPct: number,
): number | null {
  if (!(ganBs > 0) || !(venBs > 0)) return null
  const reinvBs = (venBs * reinvDistPct) / 100
  return Math.max(0, Math.min(100, Math.round((reinvBs / ganBs) * 100)))
}

export { OBLIG_KEYS }
