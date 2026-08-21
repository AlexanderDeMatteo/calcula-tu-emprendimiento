import { computeProductRow } from '../lib/calc'
import { fbs, feur, fusd } from '../lib/format'
import { productStatusFlags, replacementFloorBs } from '../lib/productStatus'
import type { PriceCurrency, Product, ProductQuoteCtx, Rates } from '../types/calculator'

type Props = {
  products: Product[]
  rates: Rates
  quoteCtx: ProductQuoteCtx
  onAdd: () => void
  onUpdate: (id: string, patch: Partial<Product>) => void
  onRemove: (id: string) => void
}

function BsEur({ bs, rates }: { bs: number; rates: Rates }) {
  return (
    <>
      {fbs(bs)}
      <br />
      <span className="sub-ref eur">{feur(bs / rates.eur)}</span>
    </>
  )
}

function TriRef({ bs, rates }: { bs: number; rates: Rates }) {
  return (
    <>
      {fbs(bs)}
      <br />
      <span className="sub-ref">{fusd(bs / rates.bcv)}</span>{' '}
      <span className="sub-ref eur">{feur(bs / rates.eur)}</span>
    </>
  )
}

export function ProductTable({
  products,
  rates,
  quoteCtx,
  onAdd,
  onUpdate,
  onRemove,
}: Props) {
  const pressurePct = quoteCtx.pressurePct ?? null

  return (
    <section className="panel-card">
      <div className="inv-meta">
        <p>
          Fija el <strong>markup %</strong> al que quieres vender. <strong>Cant.</strong> son
          existencias actuales (bajan al vender). Para reponer, sube la cantidad. El sugerido
          no baja de la reposición 30d. En rango hasta <strong>30% inclusive</strong>.
        </p>
        <div className="inv-pressure" title="Variación del BCV oficial en ~30 días. No es INPC.">
          <span className="inv-pressure-lbl">Reposición 30d</span>
          <strong>
            {pressurePct != null ? `${pressurePct.toFixed(1)}%` : '—'}
          </strong>
        </div>
      </div>
      {products.length === 0 ? (
        <div className="inv-empty">
          <p>No hay productos en inventario.</p>
          <button type="button" className="add-btn" onClick={onAdd}>
            + Agregar producto
          </button>
        </div>
      ) : (
        <>
          <div className="tbl-wrap">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th className="r" title="Existencias actuales. Reponer subiendo este número.">
                    Existencias
                  </th>
                  <th className="r">
                    Costo unit.
                    <br />
                    USD → Bs
                  </th>
                  <th className="r">
                    Markup
                    <br />
                    planificado %
                  </th>
                  <th className="r">
                    Precio sugerido
                    <br />
                    Bs
                  </th>
                  <th className="r" style={{ background: '#FFFBEA', color: '#92400E' }}>
                    Precio publicado
                    <br />
                    en divisa → Bs
                    <br />
                    <span style={{ fontWeight: 500, fontSize: 10 }}>vacío = usa sugerido</span>
                  </th>
                  <th className="r">
                    Markup
                    <br />
                    efectivo
                  </th>
                  <th className="r">Ganancia</th>
                  <th style={{ textAlign: 'center' }}>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const row = computeProductRow(product, rates, quoteCtx)
                  const flags = productStatusFlags({
                    markupPct: row.margenEfectivo,
                    ppubBs: row.ppubBs,
                    costoBs: row.costoBs,
                    inflationPct: pressurePct,
                  })
                  const floorBs =
                    pressurePct != null
                      ? replacementFloorBs(row.costoBs, pressurePct)
                      : null
                  const belowFloor = flags.some((f) => f.kind === 'inflation')
                  const overCap = flags.some((f) => f.kind === 'legal')
                  const sym = product.pvDivisa === 'eur' ? '€' : '$'
                  const color = product.pvDivisa === 'eur' ? 'var(--accent)' : 'var(--blue)'
                  const placeholder =
                    product.pvDivisa === 'eur'
                      ? (row.pvSugBs / rates.eur).toFixed(2)
                      : (row.pvSugBs / rates.bcv).toFixed(2)

                  return (
                    <tr key={product.id}>
                      <td>
                        <input
                          className="ei"
                          value={product.desc}
                          aria-label="Descripción del producto"
                          onChange={(e) => onUpdate(product.id, { desc: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          className="ei r"
                          type="number"
                          min={0}
                          value={product.cant}
                          aria-label={`Existencias de ${product.desc}`}
                          onChange={(e) =>
                            onUpdate(product.id, { cant: parseFloat(e.target.value) || 0 })
                          }
                        />
                      </td>
                      <td className="r">
                        <div className="inv-cost">
                          <input
                            className="ei r"
                            type="number"
                            min={0}
                            step="0.01"
                            value={product.costoUSD}
                            aria-label={`Costo unitario USD de ${product.desc}`}
                            onChange={(e) =>
                              onUpdate(product.id, {
                                costoUSD: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                          <span className="inv-unit">$</span>
                        </div>
                        <div className="inv-cost-bs">
                          <BsEur bs={row.costoBs} rates={rates} />
                        </div>
                      </td>
                      <td className="r">
                        <input
                          className="ei r"
                          type="number"
                          min={0}
                          step="1"
                          value={product.margen}
                          style={{ width: 64 }}
                          aria-label={`Markup planificado de ${product.desc}`}
                          title="Porcentaje sobre costo al que quieres vender. El sugerido no baja de la reposición 30d."
                          onChange={(e) =>
                            onUpdate(product.id, {
                              margen: Math.max(0, parseFloat(e.target.value) || 0),
                            })
                          }
                        />
                        <span style={{ color: 'var(--txt3)', fontSize: 11 }}> %</span>
                      </td>
                      <td className="r" style={{ color: 'var(--txt3)' }}>
                        <TriRef bs={row.pvSugBs} rates={rates} />
                        <div className="sub-ref" style={{ marginTop: 2 }}>
                          {row.quoteSource === 'plan'
                            ? `tu ${product.margen}%`
                            : 'piso reposición'}
                        </div>
                        {row.quoteSource === 'plan' && row.pisoBs + 1e-9 < row.pvSugBs ? (
                          <div className="sub-ref" style={{ marginTop: 1 }}>
                            mín. {fbs(row.pisoBs)}
                          </div>
                        ) : null}
                      </td>
                      <td className="r pv-cell">
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            marginBottom: 3,
                          }}
                        >
                          <select
                            value={product.pvDivisa}
                            aria-label={`Divisa de precio publicado de ${product.desc}`}
                            onChange={(e) =>
                              onUpdate(product.id, {
                                pvDivisa: e.target.value as PriceCurrency,
                              })
                            }
                            style={{
                              fontSize: 10,
                              padding: '2px 4px',
                              border: '1px solid var(--border)',
                              borderRadius: 4,
                              background: 'var(--bg)',
                              color: 'var(--txt)',
                              cursor: 'pointer',
                            }}
                          >
                            <option value="usd">USD $</option>
                            <option value="eur">EUR €</option>
                          </select>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                            justifyContent: 'flex-end',
                          }}
                        >
                          <span style={{ fontSize: 13, fontWeight: 800, color }}>{sym}</span>
                          <input
                            className="ei r"
                            type="number"
                            min={0}
                            step="0.01"
                            value={product.pvRef > 0 ? product.pvRef : ''}
                            placeholder={placeholder}
                            aria-label={`Precio publicado de ${product.desc}`}
                            style={{ width: 72, color, fontWeight: 700, fontSize: 14 }}
                            onChange={(e) =>
                              onUpdate(product.id, {
                                pvRef: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div className="pv-bs">{fbs(row.ppubBs)}</div>
                        {product.pvRef > 0 ? (
                          <div className="sub-ref" style={{ marginTop: 2 }}>
                            override del sugerido
                          </div>
                        ) : null}
                        {belowFloor && floorBs != null ? (
                          <div className="inv-flag-note infl">
                            Mín. reposición {fbs(floorBs)}
                          </div>
                        ) : null}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {row.margenEfectivo.toFixed(1)}%
                        {overCap ? (
                          <div className="inv-flag-note legal">sobre 30%</div>
                        ) : null}
                      </td>
                      <td className="r" style={{ color: 'var(--green)', fontWeight: 700 }}>
                        <TriRef bs={row.gananciaTotalBs} rates={rates} />
                        <div className="sub-ref" style={{ marginTop: 2 }}>
                          unit. {fbs(row.gananciaUnitBs)}
                        </div>
                      </td>
                      <td>
                        <div className="status-stack">
                          {flags.map((flag) => (
                            <span
                              key={flag.kind}
                              className={`badge b-${flag.kind}`}
                              title={flag.detail}
                            >
                              {flag.label}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="del-btn"
                          onClick={() => onRemove(product.id)}
                          aria-label={`Eliminar ${product.desc}`}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <button type="button" className="add-btn" onClick={onAdd}>
            + Agregar producto
          </button>
        </>
      )}
    </section>
  )
}
