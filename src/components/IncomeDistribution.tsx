import { DIST_COLORS, DIST_KEYS, DIST_LABELS } from '../data/defaults'
import { fbs, triParts } from '../lib/format'
import {
  DIST_MODE_LABELS,
  type SuggestDistributionResult,
} from '../lib/suggestDistribution'
import type { DistKey, DistMode, Rates } from '../types/calculator'

type Props = {
  dist: Record<DistKey, number>
  distSum: number
  venBs: number
  rates: Rates
  distMode: DistMode
  distManual: boolean
  suggestion: SuggestDistributionResult
  onChange: (key: DistKey, value: number) => void
  onModeChange: (mode: DistMode) => void
  onRecalculate: () => void
}

export function IncomeDistribution({
  dist,
  distSum,
  venBs,
  rates,
  distMode,
  distManual,
  suggestion,
  onChange,
  onModeChange,
  onRecalculate,
}: Props) {
  const warnClass =
    distSum > 100 ? 'dist-warn err' : distSum === 100 ? 'dist-warn ok' : 'dist-warn'
  const warnText =
    distSum > 100
      ? `Suma: ${distSum}% — excede 100%, ajusta los porcentajes.`
      : distSum < 100
        ? `Suma: ${distSum}% — faltan ${100 - distSum}% por asignar.`
        : '✓ Distribución balanceada al 100%'

  const total = venBs > 0 ? triParts(venBs, rates) : null
  const obligPct = dist.imp + dist.para + dist.suel + dist.deuda
  const residualPct = dist.reinv + dist.inv + dist.util

  return (
    <div className="card">
      <div className="card-ttl">
        Apéndice II — Plan de caja{' '}
        <span className="card-badge edit">Guiado</span>
      </div>
      <p className="card-hint">
        Plan de caja referencial (no contabilidad). Los % obligatorios salen de gastos,
        tributos y deudas; el sobrante se reparte según el modo. Al Recalcular, la reinversión
        también alimenta el puente del Apéndice I.
      </p>

      <div className="dist-mode-bar">
        <label>
          Modo
          <select
            className="ei"
            value={distMode}
            onChange={(e) => onModeChange(e.target.value as DistMode)}
          >
            {(Object.keys(DIST_MODE_LABELS) as DistMode[]).map((m) => (
              <option key={m} value={m}>
                {DIST_MODE_LABELS[m]}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="add-btn sm" onClick={onRecalculate}>
          Recalcular con mis datos
        </button>
      </div>

      {distManual ? (
        <p className="kpi-sub" style={{ margin: '8px 0' }}>
          Edición manual activa. Pulsa Recalcular o cambia el modo para volver a la
          sugerencia.
        </p>
      ) : null}

      {suggestion.tight ? (
        <div className="weekly-alert" style={{ marginTop: 8 }}>
          <strong>Caja ajustada.</strong> Obligaciones superan el 100% de ventas; se
          escalaron proporcionalmente. Revisa precios, gastos o deudas.
        </div>
      ) : null}

      <div className="dist-summary">
        <div>
          <span className="kpi-lbl">Obligaciones</span>
          <div className="kpi-val" style={{ fontSize: 16 }}>
            {obligPct}% · {venBs > 0 ? fbs((venBs * obligPct) / 100) : '—'}
          </div>
        </div>
        <div>
          <span className="kpi-lbl">Sobrante repartible</span>
          <div className="kpi-val" style={{ fontSize: 16 }}>
            {residualPct}% · {venBs > 0 ? fbs((venBs * residualPct) / 100) : '—'}
          </div>
        </div>
      </div>

      <div className="pb-track" style={{ marginTop: 12 }}>
        {DIST_KEYS.map((key) => (
          <div
            key={key}
            className="pb-seg"
            style={{
              width: `${Math.min(dist[key], 100)}%`,
              background: DIST_COLORS[key],
            }}
          />
        ))}
      </div>

      <div className="pb-leg">
        {DIST_KEYS.map((key) => (
          <div className="pb-it" key={key}>
            <span className="pb-dot" style={{ background: DIST_COLORS[key] }} />
            {DIST_LABELS[key]} {dist[key]}%
          </div>
        ))}
      </div>

      <div className="dist-amounts">
        {DIST_KEYS.map((key) => (
          <div className="mrow" key={key}>
            <span className="lbl">{DIST_LABELS[key]}</span>
            <span className="val">
              {dist[key]}% · {venBs > 0 ? fbs((venBs * dist[key]) / 100) : '—'}
            </span>
          </div>
        ))}
      </div>

      <div className={warnClass}>{warnText}</div>

      <details className="dist-advanced">
        <summary>Avanzado — editar porcentajes</summary>
        {DIST_KEYS.map((key) => (
          <div className="sl-row" key={key}>
            <label>{DIST_LABELS[key]}</label>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={dist[key]}
              onChange={(e) => onChange(key, parseInt(e.target.value, 10) || 0)}
            />
            <span className="sv">{dist[key]}%</span>
            <span className="bv">{venBs > 0 ? fbs((venBs * dist[key]) / 100) : '—'}</span>
          </div>
        ))}
      </details>

      <div className="mrow tot" style={{ marginTop: 10 }}>
        <span className="lbl">Total ventas brutas (Bs)</span>
        <span className="val">
          {total ? (
            <>
              {total.bs}{' '}
              <span className="mono-usd" style={{ marginLeft: 6 }}>
                {total.usd}
              </span>{' '}
              <span className="mono-eur">{total.eur}</span>
            </>
          ) : (
            '—'
          )}
        </span>
      </div>
    </div>
  )
}
