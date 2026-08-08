import { fbs, feur, fusd, triParts } from '../lib/format'
import type { Currency, Rates, TaxItem, TaxTotals } from '../types/calculator'

type Group = 'para' | 'mun' | 'nac'

type Props = {
  group: Group
  title: string
  items: TaxItem[]
  rates: Rates
  taxes: TaxTotals
  // para
  salario?: number
  salarioDivisa?: Currency
  salarioBs?: number
  onSalarioChange?: (v: number) => void
  onSalarioDivisaChange?: (v: Currency) => void
  // mun / nac
  ingresosEUR?: number
  onIngresosEURChange?: (v: number) => void
  onFillFromSales?: () => void
  onTaxUpdate: (group: Group, key: string, patch: Partial<TaxItem>) => void
}

function Amount({ bs, rates, preferEur }: { bs: number; rates: Rates; preferEur?: boolean }) {
  if (bs <= 0) return <>—</>
  return (
    <>
      {fbs(bs)}
      <br />
      {preferEur ? (
        <>
          <span className="sub-ref eur">{feur(bs / rates.eur)}</span>{' '}
          <span className="sub-ref">{fusd(bs / rates.bcv)}</span>
        </>
      ) : (
        <>
          <span className="sub-ref">{fusd(bs / rates.bcv)}</span>{' '}
          <span className="sub-ref eur">{feur(bs / rates.eur)}</span>
        </>
      )}
    </>
  )
}

export function TaxPanel({
  group,
  title,
  items,
  rates,
  taxes,
  salario = 0,
  salarioDivisa = 'bs',
  salarioBs = 0,
  onSalarioChange,
  onSalarioDivisaChange,
  ingresosEUR = 0,
  onIngresosEURChange,
  onFillFromSales,
  onTaxUpdate,
}: Props) {
  const total =
    group === 'para' ? taxes.paraTotal : group === 'mun' ? taxes.munTotal : taxes.nacTotal
  const totalParts = total > 0 ? triParts(total, rates) : null
  const eurBaseBs = ingresosEUR * rates.eur

  return (
    <div className="card">
      <div className="card-ttl">
        {title} <span className="card-badge edit">Editable</span>
      </div>

      {group === 'para' && (
        <>
          <div className="nominal-row">
            <label>Salario mensual integral</label>
            <input
              className="nominal-inp"
              type="number"
              min={0}
              step="0.01"
              value={salario}
              onChange={(e) => onSalarioChange?.(parseFloat(e.target.value) || 0)}
            />
            <select
              value={salarioDivisa}
              onChange={(e) => onSalarioDivisaChange?.(e.target.value as Currency)}
              style={{
                padding: '6px 8px',
                border: '1px solid var(--border)',
                borderRadius: 8,
                background: 'var(--bg)',
                cursor: 'pointer',
              }}
            >
              <option value="bs">Bs</option>
              <option value="usd">USD ($)</option>
              <option value="eur">EUR (€)</option>
            </select>
          </div>
          <div className="ref-line">
            {salarioBs > 0 ? (
              <>
                = <b>{fbs(salarioBs)}</b>
                {salarioDivisa !== 'usd' ? ` · ${fusd(salarioBs / rates.bcv)}` : ''}
                {salarioDivisa !== 'eur' ? ` · ${feur(salarioBs / rates.eur)}` : ''}
              </>
            ) : (
              '—'
            )}
          </div>
        </>
      )}

      {(group === 'mun' || group === 'nac') && (
        <>
          <div className="nominal-row">
            <label>Ingresos brutos mensuales (€ EUR)</label>
            <input
              className="nominal-inp"
              type="number"
              min={0}
              step="0.01"
              value={ingresosEUR}
              onChange={(e) => onIngresosEURChange?.(parseFloat(e.target.value) || 0)}
            />
            <span className="nominal-unit">€</span>
          </div>
          {onFillFromSales ? (
            <button type="button" className="add-btn" style={{ marginBottom: 8 }} onClick={onFillFromSales}>
              Usar ventas como base
            </button>
          ) : null}
          <div className="ref-line">
            {eurBaseBs > 0 ? (
              <>
                = <b>{fbs(eurBaseBs)}</b> · {fusd(eurBaseBs / rates.bcv)} — base de cálculo en Bs
                <br />
                <span style={{ color: 'var(--txt3)' }}>Referencial — valida con contador</span>
              </>
            ) : (
              '— Bs según tasa EUR'
            )}
          </div>
        </>
      )}

      {items.map((item) => (
        <div
          key={item.key}
          className={`tax-item${item.active ? '' : ' disabled'}`}
        >
          <input
            type="checkbox"
            className="tax-check"
            checked={item.active}
            onChange={(e) => onTaxUpdate(group, item.key, { active: e.target.checked })}
          />
          <div className="tax-name">
            <b>{item.nombre}</b>
            <small>{item.desc}</small>
          </div>
          {item.base === 'fixed_eur' ? (
            <div className="tax-rate-wrap">
              <input
                className="tax-rate-inp"
                type="number"
                min={0}
                step="0.01"
                value={item.fixedEur ?? 0}
                style={{ width: 64 }}
                title="Monto fijo en EUR/mes"
                onChange={(e) =>
                  onTaxUpdate(group, item.key, {
                    fixedEur: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <span className="tax-pct" style={{ color: 'var(--accent)', fontWeight: 700 }}>
                €/mes
              </span>
            </div>
          ) : (
            <div className="tax-rate-wrap">
              <input
                className="tax-rate-inp"
                type="number"
                min={0}
                step="0.01"
                value={item.rate}
                title="Editar tasa %"
                onChange={(e) =>
                  onTaxUpdate(group, item.key, {
                    rate: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <span className="tax-pct">%</span>
            </div>
          )}
          <div className="tax-amount">
            <Amount
              bs={taxes.amounts[item.key] || 0}
              rates={rates}
              preferEur={group !== 'para'}
            />
          </div>
        </div>
      ))}

      <div className="mrow tot stack" style={{ marginTop: 8 }}>
        <span className="lbl">
          {group === 'para' ? 'Total aportes empleador / mes' : 'Total estimado mensual'}
        </span>
        <span className="val" style={{ fontSize: 13 }}>
          {totalParts ? (
            <>
              {totalParts.bs}{' '}
              <span className="mono-usd" style={{ marginLeft: 6 }}>
                {totalParts.usd}
              </span>{' '}
              <span className="mono-eur">{totalParts.eur}</span>
            </>
          ) : (
            '—'
          )}
        </span>
      </div>
    </div>
  )
}
