import { computeProductRow } from '../lib/calc'
import { fbs, feur, fusd, marginBadge } from '../lib/format'
import type { PriceCurrency, Product, Rates } from '../types/calculator'

type Props = {
  products: Product[]
  rates: Rates
  onAdd: () => void
  onUpdate: (id: string, patch: Partial<Product>) => void
  onRemove: (id: string) => void
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

export function ProductTable({ products, rates, onAdd, onUpdate, onRemove }: Props) {
  return (
    <section className="panel-card">
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Descripción del producto</th>
              <th className="r">Cant.</th>
              <th className="r">
                Costo unit.
                <br />
                USD
              </th>
              <th className="r">
                Costo unit.
                <br />
                Bs
              </th>
              <th className="r">
                P. sugerido
                <br />
                venta Bs
              </th>
              <th className="r">
                P. sugerido
                <br />
                USD ref.
              </th>
              <th className="r">
                Margen
                <br />
                planificado %
              </th>
              <th className="r" style={{ background: '#FFFBEA', color: '#92400E' }}>
                Precio publicado
                <br />
                en divisa → Bs
                <br />
                <span style={{ fontWeight: 500, fontSize: 10 }}>
                  vacío = usa sugerido
                </span>
              </th>
              <th className="r">
                Margen
                <br />
                efectivo %
              </th>
              <th className="r">
                Ganancia
                <br />
                unit. Bs
              </th>
              <th className="r">
                Ganancia
                <br />
                total Bs
              </th>
              <th style={{ textAlign: 'center' }}>Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const row = computeProductRow(product, rates)
              const badge = marginBadge(row.margenEfectivo)
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
                      onChange={(e) => onUpdate(product.id, { desc: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      className="ei r"
                      type="number"
                      min={0}
                      value={product.cant}
                      onChange={(e) =>
                        onUpdate(product.id, { cant: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </td>
                  <td className="r">
                    <input
                      className="ei r"
                      type="number"
                      min={0}
                      step="0.01"
                      value={product.costoUSD}
                      style={{ width: 70 }}
                      onChange={(e) =>
                        onUpdate(product.id, { costoUSD: parseFloat(e.target.value) || 0 })
                      }
                    />
                    <span style={{ color: 'var(--txt3)', fontSize: 11 }}> $</span>
                  </td>
                  <td className="r" style={{ color: 'var(--txt2)' }}>
                    <TriRef bs={row.costoBs} rates={rates} />
                  </td>
                  <td className="r" style={{ color: 'var(--txt3)' }}>
                    <TriRef bs={row.pvSugBs} rates={rates} />
                  </td>
                  <td className="r" style={{ color: 'var(--txt3)' }}>
                    {fusd(row.pvSugUSD)}
                  </td>
                  <td className="r">
                    <input
                      className="ei r"
                      type="number"
                      min={0}
                      step="1"
                      value={product.margen}
                      style={{ width: 64 }}
                      title="Margen planificado sobre costo"
                      onChange={(e) =>
                        onUpdate(product.id, {
                          margen: Math.max(0, parseFloat(e.target.value) || 0),
                        })
                      }
                    />
                    <span style={{ color: 'var(--txt3)', fontSize: 11 }}> %</span>
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
                  </td>
                  <td style={{ textAlign: 'right' }}>{row.margenEfectivo.toFixed(1)}%</td>
                  <td className="r" style={{ color: 'var(--green)', fontWeight: 600 }}>
                    <TriRef bs={row.gananciaUnitBs} rates={rates} />
                  </td>
                  <td className="r" style={{ color: 'var(--green)', fontWeight: 700 }}>
                    <TriRef bs={row.gananciaTotalBs} rates={rates} />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge b-${badge.kind}`}>{badge.label}</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="del-btn"
                      onClick={() => onRemove(product.id)}
                      aria-label="Eliminar producto"
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
    </section>
  )
}
