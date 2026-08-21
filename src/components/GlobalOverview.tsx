import { fbs, feur, fusd } from '../lib/format'
import { monthProfitStatus } from '../lib/productStatus'
import type { MonthRealProfit } from '../lib/weeklySales'
import type { FinancialTotals, GlobalTotals, Rates } from '../types/calculator'

type Props = {
  financial: FinancialTotals
  global: GlobalTotals
  monthReal: MonthRealProfit
  rates: Rates
}

function Card({
  title,
  value,
  sub,
  color,
}: {
  title: string
  value: string
  sub: string
  color: string
}) {
  return (
    <div className="g-card">
      <div className="t">{title}</div>
      <div className="v" style={{ color }}>
        {value}
      </div>
      <div className="s">{sub}</div>
    </div>
  )
}

export function GlobalOverview({ financial, global, monthReal, rates }: Props) {
  const { invBs, venBs, ganBs } = financial
  const {
    capTotal,
    gasTotal,
    cuotaDeudas,
    saldoDeudas,
    utilAntesImpuestos,
    tributosRef,
    puntoEquilibrioPct,
    margenPct,
  } = global
  const profit = monthProfitStatus(monthReal.utilMes, monthReal.hasSales)
  const utilColor =
    profit.kind === 'ok'
      ? 'var(--green)'
      : profit.kind === 'empty'
        ? 'var(--txt3)'
        : 'var(--red)'

  return (
    <section>
      <div className="sec-lbl">Resumen global del negocio</div>
      <div className="card" style={{ marginBottom: 4 }}>
        <div className="card-ttl">Escenario de inventario</div>
        <p className="global-disclaimer">
          Costo del stock en escenario. No es caja cobrada ni ventas del mes.
        </p>
        <div className="global-grid">
          <Card
            title="Inversión en inventario"
            value={fbs(invBs)}
            sub={`${fusd(invBs / rates.bcv)} · ${feur(invBs / rates.eur)} · costo × cantidad`}
            color="var(--blue)"
          />
          <Card
            title="Ganancia bruta escenario"
            value={fbs(ganBs)}
            sub={`${fusd(ganBs / rates.bcv)} · ${feur(ganBs / rates.eur)}${
              venBs > 0 ? ` · ${margenPct.toFixed(1)}% margen` : ''
            }`}
            color="var(--green2)"
          />
          <Card
            title="Punto de equilibrio (escenario)"
            value={`${puntoEquilibrioPct.toFixed(1)}% de gan. bruta cubre gastos+cuotas`}
            sub={
              capTotal > 0
                ? `Capital inicial: ${fbs(capTotal)} / ${fusd(capTotal / rates.bcv)}`
                : '—'
            }
            color="var(--blue2)"
          />
        </div>
      </div>

      <div className="card" style={{ marginBottom: 4 }}>
        <div className="card-ttl">Mes real — ventas cobradas ({monthReal.monthLabel})</div>
        <p className="global-disclaimer">
          Tributos referenciales; no sustituye contador certificado. Gastos, cuotas y tributos
          son mensuales (no prorrateados).
        </p>
        <div className="global-grid">
          <Card
            title="Ventas reales del mes"
            value={monthReal.hasSales ? fbs(monthReal.salesBs) : '—'}
            sub={
              monthReal.hasSales
                ? `${monthReal.lineCount} línea(s) · ${fusd(monthReal.salesBs / rates.bcv)}`
                : 'Sin ventas registradas este mes'
            }
            color="var(--green)"
          />
          <Card
            title="Contribución del mes"
            value={monthReal.hasSales ? fbs(monthReal.contribBs) : '—'}
            sub={
              monthReal.hasSales
                ? `Ingresos − costo vendido (ref.) · ${fusd(monthReal.contribBs / rates.bcv)}`
                : '—'
            }
            color="var(--green2)"
          />
          <Card
            title="Gastos fijos mensuales"
            value={fbs(gasTotal)}
            sub={`${fusd(gasTotal / rates.bcv)} · ${feur(gasTotal / rates.eur)}`}
            color="var(--amber)"
          />
          <Card
            title="Cuotas de deudas / mes"
            value={fbs(cuotaDeudas)}
            sub={`Saldo: ${fbs(saldoDeudas)} · ${fusd(cuotaDeudas / rates.bcv)}`}
            color="#8B4513"
          />
          <Card
            title="Tributos estimados (ref.)"
            value={fbs(tributosRef)}
            sub={`${fusd(tributosRef / rates.bcv)} · ${feur(tributosRef / rates.eur)} · solo checks activos`}
            color="var(--red)"
          />
          <Card
            title="Utilidad del mes"
            value={monthReal.hasSales ? fbs(monthReal.utilMes) : '—'}
            sub={
              monthReal.hasSales
                ? `${fusd(monthReal.utilMes / rates.bcv)} · ${feur(monthReal.utilMes / rates.eur)} · ${profit.label} · contribución − obligaciones`
                : `${profit.label} · registra ventas en Ventas reales`
            }
            color={utilColor}
          />
          <Card
            title="Utilidad escenario antes de tributos"
            value={fbs(utilAntesImpuestos)}
            sub={`${fusd(utilAntesImpuestos / rates.bcv)} · referencia de inventario, no caja`}
            color="var(--blue2)"
          />
        </div>
      </div>
    </section>
  )
}
