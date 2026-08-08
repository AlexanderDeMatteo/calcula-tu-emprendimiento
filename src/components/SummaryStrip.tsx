import { fbs, fusd } from '../lib/format'
import type { FinancialTotals, GlobalTotals, Rates } from '../types/calculator'

type Props = {
  financial: FinancialTotals
  global: GlobalTotals
  rates: Rates
  productCount: number
  onGoResult: () => void
}

export function SummaryStrip({
  financial,
  global,
  rates,
  productCount,
  onGoResult,
}: Props) {
  const util = global.utilDespuesTributosRef
  const rentable = util > 0

  return (
    <div className="kpi-grid" aria-label="Indicadores del escenario">
      <div className="kpi-card">
        <div className="kpi-lbl">Productos</div>
        <div className="kpi-val">{productCount}</div>
        <div className="kpi-sub">Ítems en el escenario</div>
      </div>
      <div className="kpi-card">
        <div className="kpi-lbl">Ventas</div>
        <div className="kpi-val">{fbs(financial.venBs)}</div>
        <div className="kpi-sub">
          {fusd(financial.venBs / rates.bcv)} · margen {global.margenPct.toFixed(1)}%
        </div>
      </div>
      <button type="button" className={`kpi-card kpi-action${rentable ? '' : ' alert'}`} onClick={onGoResult}>
        <div className="kpi-lbl">Utilidad después de tributos (ref.)</div>
        <div className="kpi-val" style={{ color: rentable ? 'var(--green)' : 'var(--red)' }}>
          {fbs(util)}
        </div>
        <div className="kpi-sub">
          <span className={`summary-badge${rentable ? ' ok' : ' bad'}`}>
            {rentable ? 'Rentable' : 'Revisar'}
          </span>
          {' · '}
          {fusd(util / rates.bcv)} — ver consolidado
        </div>
      </button>
    </div>
  )
}
