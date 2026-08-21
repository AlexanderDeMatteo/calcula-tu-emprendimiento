import type { DebtItem, Rates } from '../types/calculator'
import { fbs, triParts } from '../lib/format'

type Props = {
  items: DebtItem[]
  saldoTotal: number
  cuotaTotal: number
  rates: Rates
  onUpdate: (id: string, patch: Partial<DebtItem>) => void
  onRemove: (id: string) => void
  onAdd: () => void
}

export function DebtsPanel({
  items,
  saldoTotal,
  cuotaTotal,
  rates,
  onUpdate,
  onRemove,
  onAdd,
}: Props) {
  const saldoParts = saldoTotal > 0 ? triParts(saldoTotal, rates) : null
  const cuotaParts = cuotaTotal > 0 ? triParts(cuotaTotal, rates) : null

  return (
    <section className="panel-card">
      <p className="card-hint">
        Registra deudas del negocio y su <strong>cuota mensual</strong> en Bs. La cuota entra
        al plan de caja (Apéndice II) y se resta en Vista global. No modela intereses ni
        calendario de pagos.
      </p>

      <div className="card">
        <div className="card-ttl">
          Deudas <span className="card-badge edit">Editable</span>
        </div>

        {items.length === 0 ? (
          <p className="kpi-sub" style={{ margin: '8px 0 12px' }}>
            Sin deudas registradas. Agrega préstamos, proveedores o cuotas fijas.
          </p>
        ) : (
          items.map((item) => (
            <div className="debt-row" key={item.id}>
              <input
                type="text"
                value={item.desc}
                placeholder="Acreedor / descripción"
                onChange={(e) => onUpdate(item.id, { desc: e.target.value })}
              />
              <label className="debt-field">
                <span>Saldo Bs</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.saldo || ''}
                  onChange={(e) =>
                    onUpdate(item.id, { saldo: parseFloat(e.target.value) || 0 })
                  }
                />
              </label>
              <label className="debt-field">
                <span>Cuota / mes Bs</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.cuotaMensual || ''}
                  onChange={(e) =>
                    onUpdate(item.id, { cuotaMensual: parseFloat(e.target.value) || 0 })
                  }
                />
              </label>
              <button
                type="button"
                className="del-btn"
                onClick={() => onRemove(item.id)}
                aria-label="Eliminar deuda"
              >
                ✕
              </button>
            </div>
          ))
        )}

        <button type="button" className="add-btn sm" onClick={onAdd}>
          + Agregar deuda
        </button>

        <div className="mrow tot" style={{ marginTop: 10 }}>
          <span className="lbl">Saldo total</span>
          <span className="val">
            {saldoParts ? (
              <>
                {saldoParts.bs}{' '}
                <span className="mono-usd" style={{ marginLeft: 6 }}>
                  {saldoParts.usd}
                </span>{' '}
                <span className="mono-eur">{saldoParts.eur}</span>
              </>
            ) : (
              fbs(0)
            )}
          </span>
        </div>
        <div className="mrow tot r">
          <span className="lbl">Cuotas mensuales</span>
          <span className="val">
            {cuotaParts ? (
              <>
                {cuotaParts.bs}{' '}
                <span className="mono-usd" style={{ marginLeft: 6 }}>
                  {cuotaParts.usd}
                </span>{' '}
                <span className="mono-eur">{cuotaParts.eur}</span>
              </>
            ) : (
              fbs(0)
            )}
          </span>
        </div>
      </div>
    </section>
  )
}
