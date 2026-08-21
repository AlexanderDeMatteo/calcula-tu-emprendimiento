/** Tope referencial LOPJ art. 31: 30% sobre estructura de costos. No es dictamen. */
export const LEGAL_MARKUP_CAP_PCT = 30
/** Holgura sobre reposición para llamar “en rango”. */
export const REAL_MARKUP_OK_PCT = 10
/** Por debajo: el precio apenas cubre reposición, no hay ganancia comercial. */
export const REAL_MARKUP_TIGHT_PCT = 2

export type ProductStatusKind = 'ok' | 'legal' | 'inflation' | 'tight' | 'thin'

export type ProductStatusFlag = {
  kind: ProductStatusKind
  label: string
  detail: string
}

export type ProfitTone = 'ok' | 'bad' | 'empty'

export function resolveInflationPct(
  override: number | null,
  iprPct: number | null,
): number | null {
  if (override != null && Number.isFinite(override)) {
    return override > 0 ? override : null
  }
  if (iprPct != null && Number.isFinite(iprPct) && iprPct > 0) return iprPct
  return null
}

/** Precio mínimo Bs para reponer el costo tras inflación / presión cambiaria. */
export function replacementFloorBs(costoBs: number, inflationPct: number): number {
  if (!(costoBs > 0) || !Number.isFinite(inflationPct) || inflationPct <= 0) return costoBs
  return costoBs * (1 + inflationPct / 100)
}

/** Markup mostrado en UI (1 decimal). 30.0% cuenta dentro del rango legal. */
export function roundMarkupPct(markupPct: number): number {
  return Math.round(markupPct * 10) / 10
}

export function exceedsLegalMarkup(markupPct: number): boolean {
  return roundMarkupPct(markupPct) > LEGAL_MARKUP_CAP_PCT
}

/** Markup sobre costo que queda después de cubrir la reposición 30d. */
export function realMarkupPct(markupPct: number, inflationPct: number | null): number {
  const inf = inflationPct != null && Number.isFinite(inflationPct) && inflationPct > 0 ? inflationPct : 0
  return markupPct - inf
}

export function scenarioProfitStatus(
  utilBs: number,
  venBs: number,
): { kind: ProfitTone; label: string; netPct: number } {
  const netPct = venBs > 0 ? (utilBs / venBs) * 100 : 0
  if (utilBs > 0) return { kind: 'ok', label: 'Rentable', netPct }
  return { kind: 'bad', label: 'Revisar', netPct }
}

/** Utilidad del mes desde ventas reales (no escenario de inventario). */
export function monthProfitStatus(
  utilMes: number,
  hasSales: boolean,
): { kind: ProfitTone; label: string } {
  if (!hasSales) return { kind: 'empty', label: 'Sin ventas reales' }
  if (utilMes > 0) return { kind: 'ok', label: 'Rentable' }
  return { kind: 'bad', label: 'Revisar' }
}

export function productStatusFlags(params: {
  markupPct: number
  ppubBs: number
  costoBs: number
  inflationPct: number | null
}): ProductStatusFlag[] {
  const { markupPct, ppubBs, costoBs, inflationPct } = params
  const flags: ProductStatusFlag[] = []

  if (inflationPct != null && inflationPct > 0 && costoBs > 0) {
    const floorBs = replacementFloorBs(costoBs, inflationPct)
    if (ppubBs + 1e-9 < floorBs) {
      flags.push({
        kind: 'inflation',
        label: 'Bajo inflación',
        detail:
          'El precio publicado no cubre reponer el costo a la tasa actual. Aviso, no bloquea.',
      })
    }
  }

  if (exceedsLegalMarkup(markupPct)) {
    flags.push({
      kind: 'legal',
      label: 'Sobre 30%',
      detail:
        'Tope referencial LOPJ art. 31 / SUNDDE: 30% sobre estructura de costos (el 30% exacto sí está en rango; importadores a menudo 20%). Aviso, no limita la carga. Validar con asesor.',
    })
  }

  if (flags.length === 0) {
    const real = realMarkupPct(markupPct, inflationPct)
    const band = roundMarkupPct(markupPct)
    if (band <= LEGAL_MARKUP_CAP_PCT && real >= REAL_MARKUP_OK_PCT) {
      flags.push({
        kind: 'ok',
        label: 'En rango',
        detail: `Markup ${band}% (hasta ${LEGAL_MARKUP_CAP_PCT}% inclusive) con holgura sobre reposición.`,
      })
    } else if (band === LEGAL_MARKUP_CAP_PCT) {
      flags.push({
        kind: 'ok',
        label: 'En rango',
        detail: `Al tope legal ref. de ${LEGAL_MARKUP_CAP_PCT}% (inclusive). Aviso si se supera.`,
      })
    } else if (real < REAL_MARKUP_TIGHT_PCT) {
      flags.push({
        kind: 'tight',
        label: 'Solo reposición',
        detail:
          'El precio cubre el costo de reponer, pero casi no deja ganancia comercial. Sube el publicado o el markup.',
      })
    } else if (real < REAL_MARKUP_OK_PCT) {
      flags.push({
        kind: 'thin',
        label: 'Ajustada',
        detail: `Holgura ${real.toFixed(1)} pts sobre reposición. En rango a partir de ${REAL_MARKUP_OK_PCT} pts y hasta ${LEGAL_MARKUP_CAP_PCT}% inclusive.`,
      })
    }
  }

  return flags
}
