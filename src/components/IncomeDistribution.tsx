import { DIST_COLORS, DIST_KEYS, DIST_LABELS } from '../data/defaults'
import { fbs, triParts } from '../lib/format'
import type { DistKey, Rates } from '../types/calculator'

type Props = {
  dist: Record<DistKey, number>
  distSum: number
  venBs: number
  rates: Rates
  onChange: (key: DistKey, value: number) => void
}

export function IncomeDistribution({ dist, distSum, venBs, rates, onChange }: Props) {
  const warnClass =
    distSum > 100 ? 'dist-warn err' : distSum === 100 ? 'dist-warn ok' : 'dist-warn'
  const warnText =
    distSum > 100
      ? `Suma: ${distSum}% — excede 100%, ajusta los porcentajes.`
      : distSum < 100
        ? `Suma: ${distSum}% — faltan ${100 - distSum}% por asignar.`
        : '✓ Distribución balanceada al 100%'

  const total = venBs > 0 ? triParts(venBs, rates) : null

  return (
    <div className="card">
      <div className="card-ttl">
        Apéndice II — Distribución de ingresos{' '}
        <span className="card-badge edit">Editable</span>
      </div>
      <p className="card-hint">
        Plan de asignación sobre ventas (no contabilidad). Los % se aplican a ventas brutas.
      </p>

      {DIST_KEYS.map((key) => (
        <div className="sl-row" key={key}>
          <label>{DIST_LABELS[key]}</label>
          <input
            type="range"
            min={0}
            max={60}
            step={1}
            value={dist[key]}
            onChange={(e) => onChange(key, parseInt(e.target.value, 10) || 0)}
          />
          <span className="sv">{dist[key]}%</span>
          <span className="bv">{venBs > 0 ? fbs((venBs * dist[key]) / 100) : '—'}</span>
        </div>
      ))}

      <div className={warnClass}>{warnText}</div>

      <div className="pb-track">
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
