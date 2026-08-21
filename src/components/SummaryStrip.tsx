import { fbs, fusd } from '../lib/format'
import { monthProfitStatus } from '../lib/productStatus'
import type { MonthRealProfit } from '../lib/weeklySales'
import type { FinancialTotals, Rates } from '../types/calculator'

type Props = {
  financial: FinancialTotals
  monthReal: MonthRealProfit
  rates: Rates
  productCount: number
  pressurePct: number | null
  onGoSales: () => void
}

export function SummaryStrip({
  financial,
  monthReal,
  rates,
  productCount,
  pressurePct,
  onGoSales,
}: Props) {
  const profit = monthProfitStatus(monthReal.utilMes, monthReal.hasSales)
  const valColor =
    profit.kind === 'ok'
      ? 'var(--green)'
      : profit.kind === 'empty'
        ? 'var(--txt3)'
        : 'var(--red)'

  return (
    <div className="kpi-grid summary-kpis" aria-label="Indicadores del negocio">
      <div className="kpi-card">
        <div className="kpi-lbl">Productos</div>
        <div className="kpi-val">{productCount}</div>
        <div className="kpi-sub">Ítems en el escenario</div>
      </div>
      <div className="kpi-card">
        <div className="kpi-lbl">Reposición 30d</div>
        <div className="kpi-val">
          {pressurePct != null ? `${pressurePct.toFixed(1)}%` : '—'}
        </div>
        <div className="kpi-sub">Presión BCV (ref.), no INPC</div>
      </div>
      <div className="kpi-card">
        <div className="kpi-lbl">Inversión en inventario</div>
        <div className="kpi-val">{fbs(financial.invBs)}</div>
        <div className="kpi-sub">
          {fusd(financial.invBs / rates.bcv)} · costo × cantidad · stock en escenario
        </div>
      </div>
      <button
        type="button"
        className={`kpi-card kpi-action${profit.kind === 'bad' ? ' alert' : ''}`}
        onClick={onGoSales}
      >
        <div className="kpi-lbl">Utilidad del mes</div>
        <div className="kpi-val" style={{ color: valColor }}>
          {monthReal.hasSales ? fbs(monthReal.utilMes) : '—'}
        </div>
        <div className="kpi-sub">
          <span
            className={`summary-badge ${
              profit.kind === 'ok' ? 'ok' : profit.kind === 'empty' ? 'empty' : 'bad'
            }`}
            title="Contribución del mes (ventas reales) − gastos fijos − cuotas − tributos con check activo."
          >
            {profit.label}
          </span>
          {monthReal.hasSales ? (
            <>
              {' · '}
              {fusd(monthReal.utilMes / rates.bcv)} — ventas reales del mes
            </>
          ) : (
            <> · Registra ventas en Ventas reales</>
          )}
        </div>
      </button>
    </div>
  )
}
