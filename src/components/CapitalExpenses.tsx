import { triParts } from '../lib/format'
import type { MoneyItem, Rates } from '../types/calculator'

type Kind = 'capital' | 'gastos'

type Props = {
  kind: Kind
  title: string
  items: MoneyItem[]
  total: number
  rates: Rates
  onUpdate: (kind: Kind, id: string, patch: Partial<MoneyItem>) => void
  onRemove: (kind: Kind, id: string) => void
  onAdd: (kind: Kind) => void
}

export function CapitalExpenses({
  kind,
  title,
  items,
  total,
  rates,
  onUpdate,
  onRemove,
  onAdd,
}: Props) {
  const parts = total > 0 ? triParts(total, rates) : null

  return (
    <div className="card">
      <div className="card-ttl">
        {title} <span className="card-badge edit">Editable</span>
      </div>

      {items.map((item) => (
        <div className="money-row" key={item.id}>
          <input
            type="text"
            value={item.desc}
            placeholder="Descripción"
            onChange={(e) => onUpdate(kind, item.id, { desc: e.target.value })}
          />
          <input
            type="number"
            min={0}
            step="0.01"
            value={item.monto}
            placeholder="Monto Bs"
            onChange={(e) =>
              onUpdate(kind, item.id, { monto: parseFloat(e.target.value) || 0 })
            }
          />
          <span style={{ fontSize: 11, color: 'var(--txt3)' }}>Bs</span>
          <button
            type="button"
            className="del-btn"
            onClick={() => onRemove(kind, item.id)}
            aria-label="Eliminar ítem"
          >
            ✕
          </button>
        </div>
      ))}

      <button type="button" className="add-btn sm" onClick={() => onAdd(kind)}>
        {kind === 'capital' ? '+ Agregar ítem' : '+ Agregar gasto'}
      </button>

      <div className={`mrow tot${kind === 'gastos' ? ' r' : ''}`} style={{ marginTop: 10 }}>
        <span className="lbl">
          {kind === 'capital' ? 'Total capital inicial' : 'Total gastos fijos / mes'}
        </span>
        <span className="val">
          {parts ? (
            <>
              {parts.bs}{' '}
              <span className="mono-usd" style={{ marginLeft: 6 }}>
                {parts.usd}
              </span>{' '}
              <span className="mono-eur">{parts.eur}</span>
            </>
          ) : (
            '— Bs'
          )}
        </span>
      </div>
    </div>
  )
}
