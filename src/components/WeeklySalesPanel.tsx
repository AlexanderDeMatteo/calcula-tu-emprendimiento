import { Fragment, useState } from 'react'
import { fbs, fusd, rateLabel } from '../lib/format'
import {
  DEFAULT_IPR_ALERT_PCT,
  lineContribBs,
  lineCostBs,
  lineRevenueBs,
  type WeeklySalesSummary,
} from '../lib/weeklySales'
import type { Product, Rates, WeeklySaleLine, WeeklySales } from '../types/calculator'

type Props = {
  rates: Rates
  products: Product[]
  iprAlertPct: number
  onIprAlertChange: (v: number) => void
  summary: WeeklySalesSummary
  onAdd: () => void
  onUpdate: (id: string, patch: Partial<WeeklySales>) => void
  onRemove: (id: string) => void
  onFillRates: (id: string, which: 'start' | 'end' | 'both') => void
  onAddLine: (weekId: string, productId: string) => void
  onUpdateLine: (
    weekId: string,
    lineId: string,
    patch: Partial<Pick<WeeklySaleLine, 'qty' | 'unitPriceBs'>>,
  ) => void
  onRemoveLine: (weekId: string, lineId: string) => void
  onGoInventory: () => void
}

export function WeeklySalesPanel({
  rates,
  products,
  iprAlertPct,
  onIprAlertChange,
  summary,
  onAdd,
  onUpdate,
  onRemove,
  onFillRates,
  onAddLine,
  onUpdateLine,
  onRemoveLine,
  onGoInventory,
}: Props) {
  const latest = summary.latest
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [pickProductId, setPickProductId] = useState<Record<string, string>>({})

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  function handleAddLine(weekId: string) {
    const productId =
      pickProductId[weekId] || products[0]?.id || ''
    if (!productId) return
    onAddLine(weekId, productId)
  }

  return (
    <section className="panel-card weekly-sales">
      <p className="card-hint">
        Registro de <strong>ventas reales</strong> del negocio (no el escenario de Inventario).
        El <strong>IPR</strong> (índice de presión de reposición) es el mayor Δ% semanal entre
        USD y EUR BCV — señal para revisar precios, no predicción de inflación oficial.
        Opcional: desglosa por producto para ver más vendidos y contribución en Bs
        (USD referencial con tasa fin de semana).
      </p>

      <div className="kpi-grid weekly-kpis">
        <div className="kpi-card">
          <div className="kpi-lbl">Semanas registradas</div>
          <div className="kpi-val">{summary.sorted.length}</div>
          <div className="kpi-sub">Total ventas Bs: {fbs(summary.totalSalesBs)}</div>
        </div>
        <div className={`kpi-card${latest?.alert ? ' alert' : ''}`}>
          <div className="kpi-lbl">IPR última semana</div>
          <div
            className="kpi-val"
            style={{ color: latest?.alert ? 'var(--red)' : 'var(--navy)' }}
          >
            {latest?.ipr !== null && latest?.ipr !== undefined
              ? `${latest.ipr.toFixed(1)}%`
              : '—'}
          </div>
          <div className="kpi-sub">
            {latest?.alert
              ? 'Alerta: revisar lista de precios'
              : 'Presión cambiaria (ref.)'}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-lbl">Umbral alerta IPR</div>
          <div className="kpi-val" style={{ fontSize: 16 }}>
            <input
              className="ei r"
              type="number"
              min={1}
              step={0.5}
              value={iprAlertPct}
              style={{ width: 72 }}
              onChange={(e) =>
                onIprAlertChange(Math.max(0.5, parseFloat(e.target.value) || DEFAULT_IPR_ALERT_PCT))
              }
            />
            %
          </div>
          <div className="kpi-sub">
            Tasas hoy: {rateLabel(rates.bcv)} Bs/$ · {rateLabel(rates.eur)} Bs/€
          </div>
        </div>
      </div>

      {summary.hasAnyLines ? (
        <div className="kpi-grid weekly-rank-kpis">
          <div className="kpi-card">
            <div className="kpi-lbl">Más vendidos (unidades)</div>
            <ol className="rank-list">
              {summary.topUnits.map((r) => (
                <li key={r.productId}>
                  <span className="rank-name">{r.desc}</span>
                  <span className="rank-meta">
                    {r.units} u · {fbs(r.salesBs)}
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div className="kpi-card">
            <div className="kpi-lbl">Mayor contribución (Bs)</div>
            <ol className="rank-list">
              {summary.topContrib.map((r) => (
                <li key={r.productId}>
                  <span className="rank-name">{r.desc}</span>
                  <span className="rank-meta">{fbs(r.contribBs)}</span>
                </li>
              ))}
            </ol>
            <div className="kpi-sub">Antes de fijos/tributos · costo a tasa fin semana</div>
          </div>
        </div>
      ) : null}

      {latest?.alert ? (
        <div className="weekly-alert">
          <strong>Señal de presión de reposición.</strong> Con el movimiento de tasa de la
          última semana, conviene revisar precios en Inventario antes de que el margen se
          erosione.
          <button type="button" className="add-btn" onClick={onGoInventory}>
            Ir a Inventario
          </button>
        </div>
      ) : null}

      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th />
              <th>Inicio</th>
              <th>Fin</th>
              <th className="r">Ventas Bs</th>
              <th className="r">Ventas USD</th>
              <th className="r">USD ini</th>
              <th className="r">USD fin</th>
              <th className="r">EUR ini</th>
              <th className="r">EUR fin</th>
              <th className="r">Δ USD %</th>
              <th className="r">Δ EUR %</th>
              <th className="r">IPR</th>
              <th>Notas</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {summary.computed.length === 0 ? (
              <tr>
                <td colSpan={14} style={{ textAlign: 'center', color: 'var(--txt3)', padding: 24 }}>
                  Sin semanas aún. Agrega la semana en curso con las tasas BCV actuales.
                </td>
              </tr>
            ) : (
              summary.computed.map(
                ({ row, deltaUsdPct, deltaEurPct, ipr, salesUsdEq, alert, hasLines, lineCount }) => {
                  const open = expandedId === row.id
                  const lines = row.lines ?? []
                  return (
                    <Fragment key={row.id}>
                      <tr className={alert ? 'row-alert' : undefined}>
                        <td>
                          <button
                            type="button"
                            className="rate-btn"
                            aria-expanded={open}
                            onClick={() => toggleExpand(row.id)}
                          >
                            {open ? '▾' : '▸'} Productos
                            {lineCount > 0 ? ` (${lineCount})` : ''}
                          </button>
                        </td>
                        <td>
                          <input
                            className="ei"
                            type="date"
                            value={row.weekStart}
                            onChange={(e) => onUpdate(row.id, { weekStart: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            className="ei"
                            type="date"
                            value={row.weekEnd}
                            onChange={(e) => onUpdate(row.id, { weekEnd: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            className="ei r"
                            type="number"
                            min={0}
                            step="0.01"
                            value={row.salesBs || ''}
                            readOnly={hasLines}
                            title={
                              hasLines
                                ? 'Calculado desde productos de la semana'
                                : undefined
                            }
                            onChange={(e) =>
                              onUpdate(row.id, { salesBs: parseFloat(e.target.value) || 0 })
                            }
                          />
                        </td>
                        <td>
                          <input
                            className="ei r"
                            type="number"
                            min={0}
                            step="0.01"
                            value={row.salesUsd || ''}
                            onChange={(e) =>
                              onUpdate(row.id, { salesUsd: parseFloat(e.target.value) || 0 })
                            }
                          />
                        </td>
                        <td>
                          <input
                            className="ei r"
                            type="number"
                            min={0}
                            step="0.01"
                            value={row.rateUsdStart || ''}
                            onChange={(e) =>
                              onUpdate(row.id, {
                                rateUsdStart: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </td>
                        <td>
                          <input
                            className="ei r"
                            type="number"
                            min={0}
                            step="0.01"
                            value={row.rateUsdEnd || ''}
                            onChange={(e) =>
                              onUpdate(row.id, { rateUsdEnd: parseFloat(e.target.value) || 0 })
                            }
                          />
                        </td>
                        <td>
                          <input
                            className="ei r"
                            type="number"
                            min={0}
                            step="0.01"
                            value={row.rateEurStart || ''}
                            onChange={(e) =>
                              onUpdate(row.id, {
                                rateEurStart: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </td>
                        <td>
                          <input
                            className="ei r"
                            type="number"
                            min={0}
                            step="0.01"
                            value={row.rateEurEnd || ''}
                            onChange={(e) =>
                              onUpdate(row.id, { rateEurEnd: parseFloat(e.target.value) || 0 })
                            }
                          />
                        </td>
                        <td className="r">
                          {deltaUsdPct !== null ? `${deltaUsdPct.toFixed(1)}%` : '—'}
                        </td>
                        <td className="r">
                          {deltaEurPct !== null ? `${deltaEurPct.toFixed(1)}%` : '—'}
                        </td>
                        <td
                          className="r"
                          style={{ fontWeight: 800, color: alert ? 'var(--red)' : undefined }}
                        >
                          {ipr !== null ? `${ipr.toFixed(1)}%` : '—'}
                          {salesUsdEq !== null ? (
                            <>
                              <br />
                              <span className="sub-ref">{fusd(salesUsdEq)} ref.</span>
                            </>
                          ) : null}
                        </td>
                        <td>
                          <input
                            className="ei"
                            value={row.notes}
                            placeholder="Notas"
                            onChange={(e) => onUpdate(row.id, { notes: e.target.value })}
                          />
                          <div className="weekly-row-actions">
                            <button
                              type="button"
                              className="rate-btn"
                              onClick={() => onFillRates(row.id, 'start')}
                            >
                              Tasas=hoy (ini)
                            </button>
                            <button
                              type="button"
                              className="rate-btn"
                              onClick={() => onFillRates(row.id, 'end')}
                            >
                              Tasas=hoy (fin)
                            </button>
                          </div>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="del-btn"
                            onClick={() => onRemove(row.id)}
                            aria-label="Eliminar semana"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                      {open ? (
                        <tr className="weekly-lines-row">
                          <td colSpan={14}>
                            <div className="weekly-lines-panel">
                              <p className="card-hint" style={{ marginTop: 0 }}>
                                Productos vendidos esta semana. La contribución usa costo USD ×
                                tasa USD fin (referencial). Si hay líneas, Ventas Bs se suma sola.
                              </p>
                              {products.length === 0 ? (
                                <div className="weekly-alert">
                                  No hay productos en Inventario.
                                  <button
                                    type="button"
                                    className="add-btn"
                                    onClick={onGoInventory}
                                  >
                                    Ir a Inventario
                                  </button>
                                </div>
                              ) : (
                                <div className="weekly-line-add">
                                  <select
                                    className="ei"
                                    value={pickProductId[row.id] || products[0]?.id || ''}
                                    onChange={(e) =>
                                      setPickProductId((prev) => ({
                                        ...prev,
                                        [row.id]: e.target.value,
                                      }))
                                    }
                                  >
                                    {products.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.desc}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    className="add-btn"
                                    onClick={() => handleAddLine(row.id)}
                                  >
                                    + Agregar producto
                                  </button>
                                </div>
                              )}
                              {lines.length === 0 ? (
                                <p className="kpi-sub" style={{ margin: '8px 0 0' }}>
                                  Sin productos aún. Puedes dejar solo el total en Ventas Bs.
                                </p>
                              ) : (
                                <div className="tbl-wrap" style={{ marginTop: 10 }}>
                                  <table className="weekly-lines-table">
                                    <thead>
                                      <tr>
                                        <th>Producto</th>
                                        <th className="r">Cant.</th>
                                        <th className="r">Precio unit. Bs</th>
                                        <th className="r">Ventas Bs</th>
                                        <th className="r">Costo ref.</th>
                                        <th className="r">Contrib. Bs</th>
                                        <th />
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {lines.map((line) => (
                                        <tr key={line.id}>
                                          <td>{line.desc}</td>
                                          <td>
                                            <input
                                              className="ei r"
                                              type="number"
                                              min={0}
                                              step="1"
                                              value={line.qty || ''}
                                              onChange={(e) =>
                                                onUpdateLine(row.id, line.id, {
                                                  qty: parseFloat(e.target.value) || 0,
                                                })
                                              }
                                            />
                                          </td>
                                          <td>
                                            <input
                                              className="ei r"
                                              type="number"
                                              min={0}
                                              step="0.01"
                                              value={line.unitPriceBs || ''}
                                              onChange={(e) =>
                                                onUpdateLine(row.id, line.id, {
                                                  unitPriceBs: parseFloat(e.target.value) || 0,
                                                })
                                              }
                                            />
                                          </td>
                                          <td className="r">{fbs(lineRevenueBs(line))}</td>
                                          <td className="r">
                                            {fbs(lineCostBs(line, row.rateUsdEnd))}
                                          </td>
                                          <td className="r">
                                            {fbs(lineContribBs(line, row.rateUsdEnd))}
                                          </td>
                                          <td>
                                            <button
                                              type="button"
                                              className="del-btn"
                                              onClick={() => onRemoveLine(row.id, line.id)}
                                              aria-label="Eliminar línea"
                                            >
                                              ✕
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  )
                },
              )
            )}
          </tbody>
        </table>
      </div>

      <button type="button" className="add-btn" onClick={onAdd}>
        + Agregar semana
      </button>
    </section>
  )
}
