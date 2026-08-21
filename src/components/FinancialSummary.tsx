import { triParts } from '../lib/format'
import type { FinancialTotals, GlobalTotals, Rates } from '../types/calculator'

type Props = {
  financial: FinancialTotals
  global: GlobalTotals
  rates: Rates
  reinvPct: number
  onGoCapital: () => void
  onGoDeudas: () => void
  onApplySobrevivir: () => void
}

function TriVal({ bs, rates }: { bs: number; rates: Rates }) {
  const t = triParts(bs, rates)
  return (
    <>
      {t.bs}{' '}
      <span className="mono-usd" style={{ marginLeft: 6 }}>
        {t.usd}
      </span>{' '}
      <span className="mono-eur">{t.eur}</span>
    </>
  )
}

export function FinancialSummary({
  financial,
  global,
  rates,
  reinvPct,
  onGoCapital,
  onGoDeudas,
  onApplySobrevivir,
}: Props) {
  const {
    gasTotal,
    cuotaDeudas,
    utilAntesImpuestos,
    tributosRef,
    utilDespuesTributosRef,
  } = global
  const deficit = utilDespuesTributosRef < 0

  return (
    <div className="card">
      <div className="card-ttl">
        Apéndice I — Puente de caja <span className="card-badge">Auto</span>
      </div>
      <p className="card-hint">
        Plan de caja referencial: de la ganancia bruta hasta la utilidad tras gastos, cuotas y
        tributos. La reinversión la define el plan (Apéndice II al Recalcular).
      </p>

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
        <span className="lbl">
          Reinversión (plan)
          <span className="fin-sub">
            {reinvPct}% de gan. bruta · editar en Avanzado del plan
          </span>
        </span>
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

      <div className="mrow r">
        <span className="lbl">− Gastos fijos</span>
        <span className="val">
          <TriVal bs={gasTotal} rates={rates} />
        </span>
      </div>
      <div className="mrow r">
        <span className="lbl">− Cuotas de deudas</span>
        <span className="val">
          <TriVal bs={cuotaDeudas} rates={rates} />
        </span>
      </div>
      <div className="mrow">
        <span className="lbl">Utilidad antes de tributos</span>
        <span className="val">
          <TriVal bs={utilAntesImpuestos} rates={rates} />
        </span>
      </div>
      <div className="mrow r">
        <span className="lbl">− Tributos (ref.)</span>
        <span className="val">
          <TriVal bs={tributosRef} rates={rates} />
        </span>
      </div>
      <div className={`mrow tot${deficit ? ' r' : ' g'}`}>
        <span className="lbl">Utilidad después de tributos (ref.)</span>
        <span
          className="val"
          style={{ color: deficit ? 'var(--red)' : 'var(--green)' }}
        >
          <TriVal bs={utilDespuesTributosRef} rates={rates} />
        </span>
      </div>

      {deficit ? (
        <div className="weekly-alert" style={{ marginTop: 12 }}>
          <strong>Déficit de caja (ref.).</strong> Gastos, cuotas y tributos superan la
          ganancia disponible en este escenario.
          <div className="fin-deficit-actions">
            <button type="button" className="add-btn sm" onClick={onGoCapital}>
              Ir a Capital
            </button>
            <button type="button" className="add-btn sm" onClick={onGoDeudas}>
              Ir a Deudas
            </button>
            <button type="button" className="add-btn sm" onClick={onApplySobrevivir}>
              Modo sobrevivir
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
