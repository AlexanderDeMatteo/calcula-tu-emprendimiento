import { triParts } from '../lib/format'
import type { FinancialTotals, Rates } from '../types/calculator'

type Props = {
  financial: FinancialTotals
  rates: Rates
  reinvPct: number
  onReinvChange: (value: number) => void
}

function TriVal({ bs, rates }: { bs: number; rates: Rates }) {
  const t = triParts(bs, rates)
  return (
    <>
      {t.bs} <span className="mono-usd" style={{ marginLeft: 6 }}>{t.usd}</span>{' '}
      <span className="mono-eur">{t.eur}</span>
    </>
  )
}

export function FinancialSummary({ financial, rates, reinvPct, onReinvChange }: Props) {
  return (
    <div className="card">
      <div className="card-ttl">
        Apéndice I — Resumen financiero <span className="card-badge">Auto</span>
      </div>
      <p className="card-hint">
        % de reinversión = porción de la ganancia bruta a reinvertir (distinto al plan de
        asignación del Apéndice II).
      </p>
      <div className="sl-row" style={{ marginBottom: 14 }}>
        <label style={{ width: 130 }}>% de ganancia a reinvertir</label>
        <input
          type="range"
          min={0}
          max={60}
          value={reinvPct}
          step={1}
          onChange={(e) => onReinvChange(parseInt(e.target.value, 10) || 0)}
        />
        <span className="sv">{reinvPct}%</span>
      </div>
      <div className="mrow">
        <span className="lbl">Monto invertido</span>
        <span className="val">
          <TriVal bs={financial.invBs} rates={rates} />
        </span>
      </div>
      <div className="mrow g">
        <span className="lbl">Ingresos totales por ventas</span>
        <span className="val">
          <TriVal bs={financial.venBs} rates={rates} />
        </span>
      </div>
      <div className="mrow g">
        <span className="lbl">Ganancia bruta estimada</span>
        <span className="val">
          <TriVal bs={financial.ganBs} rates={rates} />
        </span>
      </div>
      <div className="mrow w">
        <span className="lbl">Reinversión estimada ({reinvPct}%)</span>
        <span className="val">
          <TriVal bs={financial.reinvBs} rates={rates} />
        </span>
      </div>
      <div className="mrow tot g">
        <span className="lbl">Ganancia disponible</span>
        <span className="val">
          <TriVal bs={financial.ganNet} rates={rates} />
        </span>
      </div>
    </div>
  )
}
