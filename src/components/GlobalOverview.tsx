import { fbs, feur, fusd } from '../lib/format'
import type { FinancialTotals, GlobalTotals, Rates } from '../types/calculator'

type Props = {
  financial: FinancialTotals
  global: GlobalTotals
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

export function GlobalOverview({ financial, global, rates }: Props) {
  const { invBs, venBs, ganBs } = financial
  const {
    capTotal,
    gasTotal,
    utilAntesImpuestos,
    tributosRef,
    utilDespuesTributosRef,
    puntoEquilibrioPct,
    margenPct,
  } = global

  return (
    <section>
      <div className="sec-lbl">Resumen global del negocio</div>
      <div className="card" style={{ marginBottom: 4 }}>
        <div className="card-ttl">Cuadro consolidado</div>
        <p className="global-disclaimer">
          Tributos referenciales; no sustituye contador certificado.
        </p>
        <div className="global-grid">
          <Card
            title="Capital invertido (inventario)"
            value={fbs(invBs)}
            sub={`${fusd(invBs / rates.bcv)} · ${feur(invBs / rates.eur)}`}
            color="var(--blue)"
          />
          <Card
            title="Ingresos totales ventas"
            value={fbs(venBs)}
            sub={`${fusd(venBs / rates.bcv)} · ${feur(venBs / rates.eur)}`}
            color="var(--green)"
          />
          <Card
            title="Ganancia bruta"
            value={fbs(ganBs)}
            sub={`${fusd(ganBs / rates.bcv)} · ${feur(ganBs / rates.eur)}${
              venBs > 0 ? ` · ${margenPct.toFixed(1)}% margen` : ''
            }`}
            color="var(--green2)"
          />
          <Card
            title="Gastos fijos mensuales"
            value={fbs(gasTotal)}
            sub={`${fusd(gasTotal / rates.bcv)} · ${feur(gasTotal / rates.eur)}`}
            color="var(--amber)"
          />
          <Card
            title="Utilidad antes de tributos"
            value={fbs(utilAntesImpuestos)}
            sub={`${fusd(utilAntesImpuestos / rates.bcv)} · ${feur(utilAntesImpuestos / rates.eur)}`}
            color="var(--blue2)"
          />
          <Card
            title="Tributos estimados (ref.)"
            value={fbs(tributosRef)}
            sub={`${fusd(tributosRef / rates.bcv)} · ${feur(tributosRef / rates.eur)} · para+mun+SENIAT`}
            color="var(--red)"
          />
          <Card
            title="Utilidad después de tributos (referencial)"
            value={fbs(utilDespuesTributosRef)}
            sub={`${fusd(utilDespuesTributosRef / rates.bcv)} · ${feur(utilDespuesTributosRef / rates.eur)}${
              utilDespuesTributosRef > 0 ? ' · Rentable' : ' · Revisar'
            }`}
            color={utilDespuesTributosRef > 0 ? 'var(--green)' : 'var(--red)'}
          />
          <Card
            title="Punto de equilibrio"
            value={`${puntoEquilibrioPct.toFixed(1)}% de ventas cubre gastos`}
            sub={
              capTotal > 0
                ? `Capital inicial: ${fbs(capTotal)} / ${fusd(capTotal / rates.bcv)}`
                : '—'
            }
            color="var(--blue2)"
          />
        </div>
      </div>
    </section>
  )
}
